const fs = require('fs');
const path = require('path');
const parseWikiLinks = require('./parse-wiki-links');

/**
 * A Docusaurus plugin that detects wiki-style links in markdown files
 * and generates a graph structure for visualization.
 */
module.exports = function(context, options) {
  const {
    siteDir,
    generatedFilesDir,
    baseUrl,
  } = context;
  
  // Default options with user options
  const {
    docsDir = 'docs',
    outputJsonFile = 'link-graph.json',
    staticDocsDir = 'static',
  } = options || {};
  
  const docsPath = path.join(siteDir, docsDir);
  const outputPath = path.join(siteDir, staticDocsDir, outputJsonFile);
  
  return {
    name: 'docusaurus-wiki-link-graph',
    
    // Generate the graph when docs are changed during development
    getPathsToWatch() {
      return [`${docsPath}/**/*.{md,mdx}`];
    },
    
    async contentLoaded({ content, actions }) {
      // Extract docs routes for later processing
      const { docRoutes } = content;
      const siteDocRoutes = (docRoutes || []).map(route => {
        // Try to get frontmatter ID if available
        let frontMatterId = null;
        if (route.metadata && route.metadata.frontMatter && route.metadata.frontMatter.id) {
          frontMatterId = route.metadata.frontMatter.id;
        }
        
        return {
          id: route.id,
          path: route.path,
          source: route.source,
          title: route.title || route.id,
          frontMatterId: frontMatterId
        };
      });

      // Build a map of route paths to route IDs for faster lookup
      const routeMap = {};
      siteDocRoutes.forEach(route => {
        routeMap[route.path] = route.id;
        // Also store by ID for direct references
        routeMap[route.id] = route.id;
      });
      
      // Process all docs and extract links
      const graphData = {
        nodes: [],
        links: []
      };
      
      // Map to track nodes we've already added
      const nodeMap = new Map();
      
      // Track valid doc IDs to clean up removed docs later
      const validDocIds = new Set();
      
      // Process each doc route
      for (const route of siteDocRoutes) {
        const sourceFilePath = route.source;
        if (!fs.existsSync(sourceFilePath)) {
          continue;
        }
        
        const content = fs.readFileSync(sourceFilePath, 'utf8');
        const sourceId = route.id;
        
        // Mark this doc as valid (it exists)
        validDocIds.add(sourceId);
        
        // Add the current doc as a node if it doesn't exist yet
        if (!nodeMap.has(sourceId)) {
          const node = {
            id: sourceId,
            title: route.title || sourceId,
            path: path.relative(docsPath, sourceFilePath),
            frontMatterId: route.frontMatterId || null,
            group: getGroupFromPath(sourceFilePath, docsPath)
          };
          
          graphData.nodes.push(node);
          nodeMap.set(sourceId, node);
        }
        
        // Extract links from content
        const links = parseWikiLinks(content);
        
        // Process each link
        for (const link of links) {
          let targetId = normalizeTargetId(link.target);
          
          // Skip external links, anchors, or image files
          if (targetId.startsWith('http') || 
              targetId.startsWith('#') || 
              targetId.toLowerCase().endsWith('.png') ||
              targetId.toLowerCase().endsWith('.jpg') ||
              targetId.toLowerCase().endsWith('.jpeg') ||
              targetId.toLowerCase().endsWith('.gif') ||
              targetId.toLowerCase().endsWith('.svg') ||
              targetId.toLowerCase().includes('figures/') ||
              targetId.startsWith('</figures/')) {
            continue;
          }
          
          // Handle /docs/ prefixed links
          if (targetId.startsWith('/docs/')) {
            targetId = targetId.substring(6);
          }
          
          // Handle relative paths in subdirectories
          if (targetId.includes('/')) {
            const parts = targetId.split('/');
            const lastPart = parts[parts.length - 1];
            
            // The source routeId will have the same path except for the last part
            for (const routeId of Object.keys(routeMap)) {
              if (routeId.endsWith(`/${lastPart}`)) {
                const potentialMatch = routeId;
                // If we find a match, use it
                targetId = potentialMatch;
                break;
              }
            }
          }
          
          // Find the target doc in our routes
          // First try direct ID match
          let matchedId = routeMap[targetId];
          
          // If no direct match, try looking up the route path
          if (!matchedId) {
            // Try with and without .html extension
            const possiblePaths = [
              targetId,
              `${targetId}.html`,
              `${targetId}/index.html`
            ];
            
            for (const possiblePath of possiblePaths) {
              if (routeMap[possiblePath]) {
                matchedId = routeMap[possiblePath];
                break;
              }
            }
          }
          
          // If we found a match, add it to the graph
          if (matchedId) {
            targetId = matchedId;
            // Mark referenced doc as valid if it exists in routes
            validDocIds.add(targetId);
          }
          
          // Add the target as a node if it doesn't exist yet
          if (!nodeMap.has(targetId)) {
            // Try to get the frontmatter ID if available from the route
            let frontMatterId = null;
            if (matchedId) {
              const route = siteDocRoutes.find(r => r.id === matchedId);
              if (route && route.frontMatterId) {
                frontMatterId = route.frontMatterId;
              }
            }
            
            const node = {
              id: targetId,
              title: link.text || targetId,
              frontMatterId: frontMatterId,
              isPlaceholder: !matchedId // Mark as placeholder if we couldn't find a matching doc
            };
            
            graphData.nodes.push(node);
            nodeMap.set(targetId, node);
          }
          
          // Add the link
          graphData.links.push({
            source: sourceId,
            target: targetId,
            type: 'link'
          });
        }
      }
      
      // Create a cleaned version of the graph that only contains valid documents
      const cleanedGraph = {
        nodes: [],
        links: []
      };
      
      // Create a map to track nodes by their ID basename
      const nodesByBasename = new Map();
      
      // First, group nodes that might be duplicates (having the same basename)
      for (const node of graphData.nodes) {
        // Keep the node if it's a valid document or a placeholder
        if (validDocIds.has(node.id) || node.isPlaceholder) {
          // Get the basename - either the part after the last slash, or the whole ID if no slash
          const basename = node.id.includes('/') ? node.id.split('/').pop() : node.id;
          
          if (!nodesByBasename.has(basename)) {
            nodesByBasename.set(basename, []);
          }
          nodesByBasename.get(basename).push(node);
        }
      }
      
      // Map to hold our final deduplicated nodes
      const nodeMap = new Map();
      
      // Now, for each group of potential duplicates, choose the canonical one
      for (const [basename, nodes] of nodesByBasename.entries()) {
        if (nodes.length === 1) {
          // If there's only one node with this basename, use it
          nodeMap.set(basename, nodes[0]);
        } else {
          // Multiple nodes with the same basename - potential duplicates
          
          // First, look for the node with frontmatter ID matching the basename
          const nodeWithMatchingId = nodes.find(n => 
            n.frontMatterId && n.frontMatterId === basename);
          
          if (nodeWithMatchingId) {
            // If we found a node with matching ID, use it as the canonical one
            nodeMap.set(basename, nodeWithMatchingId);
          } else {
            // Otherwise, prefer the node with the full path
            const fullPathNode = nodes.find(n => n.id.includes('/'));
            if (fullPathNode) {
              nodeMap.set(basename, fullPathNode);
            } else {
              // If all else fails, just use the first one
              nodeMap.set(basename, nodes[0]);
            }
          }
        }
      }
      
      // Add the unique nodes to the cleaned graph
      cleanedGraph.nodes = Array.from(nodeMap.values());
      
      // Create a set of the canonical node IDs
      const cleanedNodeIds = new Set(cleanedGraph.nodes.map(node => node.id));
      
      // Create a mapping from original node IDs to their canonical ID
      // (needed to update links to point to the correct nodes)
      const idMapping = new Map();
      
      // For each node that might have been deduplicated, create a mapping from its original ID to its canonical ID
      graphData.nodes.forEach(node => {
        const basename = node.id.includes('/') ? node.id.split('/').pop() : node.id;
        if (nodeMap.has(basename)) {
          const canonicalNode = nodeMap.get(basename);
          idMapping.set(node.id, canonicalNode.id);
          
          // Special case: Create a direct mapping for "towards-undersating-cross-and-self-attention"
          if (basename === "towards-undersating-cross-and-self-attention") {
            idMapping.set("towards-undersating-cross-and-self-attention", 
                         "trustworthy-ai/diffusion-based/towards-undersating-cross-and-self-attention");
          }
        }
      });
      
      // Filter and transform links to use the canonical node IDs
      for (const link of graphData.links) {
        const sourceId = idMapping.get(link.source) || link.source;
        const targetId = idMapping.get(link.target) || link.target;
        
        // Only include links where both source and target exist in the cleaned nodes
        if (cleanedNodeIds.has(sourceId) && cleanedNodeIds.has(targetId)) {
          cleanedGraph.links.push({
            source: sourceId,
            target: targetId,
            type: link.type
          });
        }
      }
      
      // Write the cleaned graph data to the output file
      fs.writeFileSync(outputPath, JSON.stringify(cleanedGraph, null, 2));
      
      console.log(`Wiki link graph generated at ${outputPath} with ${cleanedGraph.nodes.length} nodes and ${cleanedGraph.links.length} links`);
    }
  };
};

/**
 * Normalize a target ID from a link
 */
function normalizeTargetId(targetId) {
  // Remove file extensions if present
  const extensionsToRemove = ['.md', '.mdx', '.html'];
  for (const ext of extensionsToRemove) {
    if (targetId.endsWith(ext)) {
      targetId = targetId.substring(0, targetId.length - ext.length);
    }
  }
  
  // Handle paths with trailing slashes
  if (targetId.endsWith('/')) {
    targetId = targetId.substring(0, targetId.length - 1);
  }
  
  // If it starts with ./ in a subdirectory context, treat it as a relative path
  if (targetId.startsWith('./')) {
    targetId = targetId.substring(2);
  }
  
  return targetId;
}

/**
 * Extract a group name from the file path
 */
function getGroupFromPath(filePath, docsPath) {
  const relativePath = path.relative(docsPath, filePath);
  const parts = relativePath.split(path.sep);
  
  if (parts.length > 1) {
    return parts[0];
  }
  
  return 'other';
}