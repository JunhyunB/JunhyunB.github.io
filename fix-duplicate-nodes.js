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

// Process the graph data
const processedGraphData = deduplicateNodes(graphData);

// Write the processed data back to the file
try {
  fs.writeFileSync(graphFilePath, JSON.stringify(processedGraphData, null, 2));
  console.log(`Successfully updated graph file with ${processedGraphData.length} nodes`);
} catch (error) {
  console.error(`Error writing graph file: ${error.message}`);
  process.exit(1);
}