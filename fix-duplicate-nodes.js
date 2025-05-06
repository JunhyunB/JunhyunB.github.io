/**
 * This script processes the generated docusaurus-graph.json file
 * to fix the issue with duplicate nodes for the same document.
 */

const fs = require('fs');
const path = require('path');

// Path to the docusaurus-graph.json file
const graphFilePath = path.join(__dirname, 'build', 'docusaurus-graph.json');

console.log(`Processing graph file: ${graphFilePath}`);

// Read the current graph data
let graphData;
try {
  const graphFileContent = fs.readFileSync(graphFilePath, 'utf8');
  graphData = JSON.parse(graphFileContent);
  console.log(`Loaded graph with ${graphData.length} nodes`);
} catch (error) {
  console.error(`Error reading graph file: ${error.message}`);
  process.exit(1);
}

// Find nodes that need to be merged
function deduplicateNodes(nodes) {
  // Find short node IDs that have a corresponding full path version
  const nodesToMerge = [];
  const nodeById = {};
  
  // Index nodes by ID
  nodes.forEach(node => {
    nodeById[node.id] = node;
  });
  
  // Specifically check for "towards-undersating-cross-and-self-attention"
  const shortId = "towards-undersating-cross-and-self-attention";
  const fullPathId = "trustworthy-ai/diffusion-based/towards-undersating-cross-and-self-attention";
  
  if (nodeById[shortId] && nodeById[fullPathId]) {
    console.log(`Found duplicate nodes: ${shortId} and ${fullPathId}`);
    nodesToMerge.push({
      shortId: shortId,
      fullPathId: fullPathId
    });
  }
  
  // If we found nodes to merge, process the graph
  if (nodesToMerge.length > 0) {
    console.log(`Found ${nodesToMerge.length} pairs of nodes to merge`);
    
    // Create ID mapping for redirects
    const idMapping = {};
    nodesToMerge.forEach(merge => {
      idMapping[merge.shortId] = merge.fullPathId;
    });
    
    // Filter out the short versions
    const filteredNodes = nodes.filter(node => 
      !nodesToMerge.some(merge => merge.shortId === node.id)
    );
    
    console.log(`Filtered ${nodes.length - filteredNodes.length} nodes`);
    
    // Update references in linkTo and referencedBy arrays
    filteredNodes.forEach(node => {
      // Update linkTo
      if (node.linkTo && Array.isArray(node.linkTo)) {
        node.linkTo = node.linkTo.map(link => 
          idMapping[link] || link
        );
      }
      
      // Update referencedBy
      if (node.referencedBy && Array.isArray(node.referencedBy)) {
        node.referencedBy = node.referencedBy.map(ref => 
          idMapping[ref] || ref
        );
      }
    });
    
    return filteredNodes;
  }
  
  // If no nodes to merge, return the original data
  console.log("No duplicate nodes found");
  return nodes;
}

// Function to remove deleted or non-existent pages
function removeDeletedPages(nodes) {
  // List of known deleted or non-existent page IDs to remove
  const deletedPageIds = [
    "paper title 1",
    "paper title 2", 
    "paper title 3",
    "Paper title 1",
    "Paper title 2", 
    "Paper title 3",
    "category/paper-title-1",
    "category/paper-title-2",
    "category/paper-title-3",
    // Add any other known deleted pages here
  ];
  
  // Filter out the deleted pages
  const filteredNodes = nodes.filter(node => 
    !deletedPageIds.includes(node.id)
  );
  
  console.log(`Removed ${nodes.length - filteredNodes.length} deleted pages`);
  
  // Also remove references to deleted pages in other nodes
  filteredNodes.forEach(node => {
    // Remove references in linkTo
    if (node.linkTo && Array.isArray(node.linkTo)) {
      const originalLinkCount = node.linkTo.length;
      node.linkTo = node.linkTo.filter(link => 
        !deletedPageIds.includes(link)
      );
      if (originalLinkCount !== node.linkTo.length) {
        console.log(`Removed references to deleted pages from linkTo in ${node.id}`);
      }
    }
    
    // Remove references in referencedBy
    if (node.referencedBy && Array.isArray(node.referencedBy)) {
      const originalRefCount = node.referencedBy.length;
      node.referencedBy = node.referencedBy.filter(ref => 
        !deletedPageIds.includes(ref)
      );
      if (originalRefCount !== node.referencedBy.length) {
        console.log(`Removed references to deleted pages from referencedBy in ${node.id}`);
      }
    }
  });
  
  return filteredNodes;
}

// Process the graph data
let processedGraphData = deduplicateNodes(graphData);
// Also remove any deleted pages
processedGraphData = removeDeletedPages(processedGraphData);

// Write the processed data back to the file
try {
  fs.writeFileSync(graphFilePath, JSON.stringify(processedGraphData, null, 2));
  console.log(`Successfully updated graph file with ${processedGraphData.length} nodes`);
} catch (error) {
  console.error(`Error writing graph file: ${error.message}`);
  process.exit(1);
}