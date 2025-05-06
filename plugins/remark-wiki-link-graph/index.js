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
      const siteDocRoutes = (docRoutes || []).map(route => ({
        id: route.id,
        path: route.path,
        source: route.source,
        title: route.title || route.id,
      }));

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
          
          // Skip external links or anchors
          if (targetId.startsWith('http') || targetId.startsWith('#')) {
            continue;
          }
          
          // Handle /docs/ prefixed links
          if (targetId.startsWith('/docs/')) {
            targetId = targetId.substring(6);
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
            const node = {
              id: targetId,
              title: link.text || targetId,
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
      
      // Filter nodes to include only valid documents and their references
      for (const node of graphData.nodes) {
        // Keep the node if it's a valid document or a placeholder (for links to non-existent docs)
        if (validDocIds.has(node.id) || node.isPlaceholder) {
          cleanedGraph.nodes.push(node);
        }
      }
      
      // Filter links to only include those where both source and target exist in the cleaned nodes
      const cleanedNodeIds = new Set(cleanedGraph.nodes.map(node => node.id));
      for (const link of graphData.links) {
        if (cleanedNodeIds.has(link.source) && cleanedNodeIds.has(link.target)) {
          cleanedGraph.links.push(link);
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