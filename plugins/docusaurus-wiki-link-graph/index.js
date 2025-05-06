/**
 * Docusaurus plugin to generate a graph visualization from wiki-style links
 * This plugin integrates with the remark-wiki-links plugin to process and visualize
 * connections between documents.
 */

const fs = require('fs');
const path = require('path');
const { getLinkMap } = require('../remark-wiki-links');
const matter = require('gray-matter');

// Generate a graph from the link map
function generateGraphData(docsDir) {
  const linkMap = getLinkMap();
  const nodes = [];
  const nodesMap = new Map();
  
  console.log(`Link map contains ${linkMap.size} sources`);
  
  // First pass: create nodes for all documents with detected links
  for (const [sourceId, targetIds] of linkMap.entries()) {
    // Get document title from the file if possible
    let title = getDisplayTitleFromId(sourceId);
    try {
      const filePath = findDocFile(docsDir, sourceId);
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data, content: markdownContent } = matter(content);
        
        // Use front matter title if available, otherwise try to extract from content
        title = data.title || extractTitleFromMarkdown(markdownContent) || title;
      }
    } catch (error) {
      console.warn(`Could not read title for document ${sourceId}: ${error.message}`);
    }
    
    nodesMap.set(sourceId, {
      id: sourceId,
      title: title,
      linkTo: Array.from(targetIds),
      referencedBy: []
    });
    
    console.log(`Added node ${sourceId} with ${targetIds.size} links`);
  }
  
  // Second pass: add nodes for targets that don't have their own documents yet
  // and populate referencedBy
  for (const [sourceId, targetIds] of linkMap.entries()) {
    for (const targetId of targetIds) {
      if (!nodesMap.has(targetId)) {
        // For missing nodes, try to get a nicer display title
        const title = getDisplayTitleFromId(targetId);
        
        nodesMap.set(targetId, {
          id: targetId,
          title: title,
          linkTo: [],
          referencedBy: [sourceId]
        });
        
        console.log(`Added missing node ${targetId} referenced by ${sourceId}`);
      } else {
        // Update referencedBy for existing nodes
        const node = nodesMap.get(targetId);
        if (!node.referencedBy.includes(sourceId)) {
          node.referencedBy.push(sourceId);
        }
      }
    }
  }
  
  const result = Array.from(nodesMap.values());
  console.log(`Generated graph with ${result.length} nodes`);
  return result;
}

// Helper function to get a display title from a node ID
function getDisplayTitleFromId(id) {
  // If it's a path with subdirectories, show only the basename
  if (id.includes('/')) {
    return path.basename(id);
  }
  // Otherwise, just use the ID with first letter capitalized
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
}

// Helper function to find the file path for a document ID
function findDocFile(docsDir, docId) {
  const possibleExtensions = ['.md', '.mdx'];
  
  // Handle IDs with subdirectory paths
  const isSubdirectoryPath = docId.includes('/');
  
  if (isSubdirectoryPath) {
    // For subdirectory paths, try direct match first
    for (const ext of possibleExtensions) {
      const filePath = path.join(docsDir, `${docId}${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    
    // If the path is something like "trustworthy-ai/index"
    // Try with just the directory path
    const dirPath = path.dirname(docId);
    for (const ext of possibleExtensions) {
      const indexPath = path.join(docsDir, dirPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
  } else {
    // Try direct match for simple IDs
    for (const ext of possibleExtensions) {
      const filePath = path.join(docsDir, `${docId}${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    
    // Search recursively in directories for simple IDs
    const searchDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          let stat;
          
          try {
            stat = fs.statSync(fullPath);
          } catch (e) {
            continue; // Skip if we can't access the file
          }
          
          if (stat.isDirectory()) {
            const result = searchDir(fullPath);
            if (result) return result;
          } else {
            const baseName = path.basename(file, path.extname(file));
            if (baseName === docId && possibleExtensions.includes(path.extname(file))) {
              return fullPath;
            }
          }
        }
      } catch (error) {
        console.warn(`Error accessing directory ${dir}: ${error.message}`);
      }
      
      return null;
    };
    
    return searchDir(docsDir);
  }
  
  return null;
}

// Helper function to extract title from markdown content
function extractTitleFromMarkdown(content) {
  // Simple regex to extract first level 1 heading
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// Main plugin function
module.exports = function(context, options) {
  const { siteDir } = context;
  const docsDir = path.join(siteDir, options.docsDir || 'docs');
  const outputFileName = options.outputFileName || 'docusaurus-graph.json';
  
  return {
    name: 'docusaurus-wiki-link-graph',
    
    // Add remark plugin to the markdown processing
    configureWebpack() {
      return {
        resolve: {
          alias: {
            '@docusaurus-wiki-link-graph': path.resolve(__dirname),
          },
        },
      };
    },
    
    // Add our remark plugin to the Markdown pipeline
    extendMarkdownPlugins(plugins) {
      const { remarkPlugin } = require('../remark-wiki-links');
      plugins.push(remarkPlugin);
      return plugins;
    },
    
    // Generate the graph after content is loaded
    async postBuild({ outDir }) {
      try {
        // Generate graph data
        const graphData = generateGraphData(docsDir);
        
        // Write to output file
        const outputPath = path.join(outDir, outputFileName);
        fs.writeFileSync(outputPath, JSON.stringify(graphData, null, 2));
        
        console.log(`Wiki link graph generated: ${outputPath}`);
      } catch (error) {
        console.error(`Error generating wiki link graph: ${error.message}`);
        console.error(error.stack);
      }
    }
  };
};