/**
 * Remark plugin to detect and process wiki-style links in markdown files.
 * This plugin supports:
 * 1. Double-bracket links: [[some-note]] or [[some-note|Link text]]
 * 2. Wikilinks format: [Link text](some-note)
 * 3. Regular markdown links to other docs: [Link text](/docs/some-note)
 */

const visit = require('unist-util-visit');
const path = require('path');
const fs = require('fs');

// Regular expressions for different link formats
const doubleBracketRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const wikiLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
const docsLinkRegex = /\[([^\]]+)\]\(\/docs\/([^)]+)\)/g;

// File to store link information (using file system to persist between builds)
const LINK_FILE = path.join(process.cwd(), '.docusaurus', 'wiki-links.json');

// Get the target id and path from a link path
function getTargetInfo(linkPath) {
  // Extract the id from the path (remove file extension)
  if (linkPath.startsWith('/docs/')) {
    linkPath = linkPath.substring(6); // Remove '/docs/'
  }
  
  // Handle path with subdirectories
  const isSubdirectoryPath = linkPath.includes('/');
  const targetId = path.basename(linkPath, path.extname(linkPath));
  
  // For graph visualization, we want the full path without extension as ID
  const nodeId = isSubdirectoryPath ? linkPath.replace(path.extname(linkPath), '') : targetId;
  
  return { 
    targetId,
    nodeId,
    isSubdirectoryPath 
  };
}

// Helper to ensure directory exists
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Store links in a file for persistence
function saveLinkMap(linkMap) {
  try {
    ensureDirectoryExists(LINK_FILE);
    const serializedMap = {};
    for (const [key, value] of linkMap.entries()) {
      serializedMap[key] = Array.from(value);
    }
    fs.writeFileSync(LINK_FILE, JSON.stringify(serializedMap, null, 2));
  } catch (error) {
    console.error(`Failed to save link map: ${error.message}`);
  }
}

// Load links from file
function loadLinkMap() {
  const linkMap = new Map();
  try {
    if (fs.existsSync(LINK_FILE)) {
      const serializedMap = JSON.parse(fs.readFileSync(LINK_FILE, 'utf8'));
      for (const [key, value] of Object.entries(serializedMap)) {
        linkMap.set(key, new Set(value));
      }
    }
  } catch (error) {
    console.error(`Failed to load link map: ${error.message}`);
  }
  return linkMap;
}

// Initialize or load the link map
let linkMap = loadLinkMap();

// Remark plugin
function remarkWikiLinks() {
  // Clear the link map at the start of each build
  linkMap = new Map();
  
  return (tree, file) => {
    // Get source document id from the file path
    const filePath = file.path || '';
    const sourceId = path.basename(filePath, path.extname(filePath));
    
    // Skip if we can't determine the source id
    if (!sourceId) return;
    
    console.log(`Processing wiki links in ${sourceId}`);
    
    // Initialize links for this document if it doesn't exist
    if (!linkMap.has(sourceId)) {
      linkMap.set(sourceId, new Set());
    }
    
    // Transform double-bracket links to standard markdown links
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value || !node.value.includes('[[')) return;
      
      let newValue = node.value;
      const matches = [...node.value.matchAll(doubleBracketRegex)];
      
      // If no matches, return without replacing
      if (matches.length === 0) return;
      
      // Keep track of the replacement nodes
      const replacementNodes = [];
      let lastIndex = 0;
      
      // Process each match
      for (const match of matches) {
        const [fullMatch, linkPath, displayText] = match;
        const { nodeId, isSubdirectoryPath } = getTargetInfo(linkPath);
        const linkText = displayText || (isSubdirectoryPath ? path.basename(linkPath) : linkPath);
        
        // Handle paths with or without subdirectories
        const linkUrl = isSubdirectoryPath 
          ? `/docs/${linkPath}`
          : `/docs/${linkPath}`;
        
        // Add the text before the match
        if (match.index > lastIndex) {
          const textBefore = newValue.substring(lastIndex, match.index);
          if (textBefore) {
            replacementNodes.push({ type: 'text', value: textBefore });
          }
        }
        
        // Add the link node
        replacementNodes.push({
          type: 'link',
          url: linkUrl,
          children: [{ type: 'text', value: linkText }]
        });
        
        // Update the last index
        lastIndex = match.index + fullMatch.length;
        
        // Record this link for the graph
        linkMap.get(sourceId).add(nodeId);
        console.log(`Added link: ${sourceId} -> ${nodeId}`);
      }
      
      // Add any remaining text after the last match
      if (lastIndex < newValue.length) {
        const textAfter = newValue.substring(lastIndex);
        if (textAfter) {
          replacementNodes.push({ type: 'text', value: textAfter });
        }
      }
      
      // Replace the node with our new nodes if we have replacements
      if (replacementNodes.length > 0) {
        parent.children.splice(index, 1, ...replacementNodes);
        return index + replacementNodes.length - 1; // Skip the nodes we just added
      }
    });
    
    // Process regular markdown links
    visit(tree, 'link', (node) => {
      if (!node.url) return;
      
      const url = node.url;
      
      // Process docs links
      if (url.startsWith('/docs/')) {
        const { nodeId } = getTargetInfo(url);
        linkMap.get(sourceId).add(nodeId);
        console.log(`Added link: ${sourceId} -> ${nodeId}`);
      } 
      // Process wiki-style links (no protocol or domain)
      else if (!url.includes('://') && !url.startsWith('/')) {
        const { nodeId, isSubdirectoryPath } = getTargetInfo(url);
        linkMap.get(sourceId).add(nodeId);
        console.log(`Added link: ${sourceId} -> ${nodeId}`);
        
        // Transform wiki-style links to proper docs links
        if (isSubdirectoryPath) {
          node.url = `/docs/${url}`;
        } else {
          node.url = `/docs/${url}`;
        }
      }
    });
    
    // Save the link map to persist between builds
    saveLinkMap(linkMap);
  };
}

// Export the plugin and utilities
module.exports = {
  remarkPlugin: remarkWikiLinks,
  getLinkMap: () => {
    // Always load from disk to ensure we have the latest data
    return loadLinkMap();
  }
};