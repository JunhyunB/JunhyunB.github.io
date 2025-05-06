/**
 * Wiki Link Extractor Plugin
 * 
 * This plugin directly scans markdown files to extract wiki-style links
 * and generates a graph JSON file for visualization.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');

// Regular expressions for different link formats
const DOUBLE_BRACKET_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const WIKI_LINK_REGEX = /\[([^\]]+)\]\(([^):/]+(?:\/[^):/]+)*)\)/g;
const DOCS_LINK_REGEX = /\[([^\]]+)\]\((?:\/docs\/)?([^)/:]+(?:\/[^)/:]+)*)\)/g;

class WikiLinkExtractor {
  constructor(options) {
    this.docsDir = options.docsDir || 'docs';
    this.outputFileName = options.outputFileName || 'docusaurus-graph.json';
    this.buildDir = options.buildDir || 'build';
    this.linkMap = new Map();
  }

  // Normalize path to create consistent IDs
  normalizePath(filePath) {
    // Handle absolute paths
    if (filePath.startsWith(this.docsDir)) {
      filePath = path.relative(this.docsDir, filePath);
    }
    
    // Remove file extensions
    filePath = filePath.replace(/\.(md|mdx)$/, '');
    
    // Normalize slashes for consistency
    filePath = filePath.replace(/\\/g, '/');
    
    // Remove "./" from the beginning if present
    filePath = filePath.replace(/^\.\//, '');
    
    // Handle relative paths by resolving them
    if (filePath.startsWith('./')) {
      filePath = filePath.substring(2);
    }
    
    return filePath;
  }

  // Get document display title (for the graph)
  getDisplayTitle(docPath, content) {
    // If it's an index file, use directory name
    if (path.basename(docPath, path.extname(docPath)).toLowerCase() === 'index') {
      const dirName = path.basename(path.dirname(docPath));
      return dirName.charAt(0).toUpperCase() + dirName.slice(1).replace(/-/g, ' ');
    }

    // Try to get title from frontmatter
    try {
      const { data } = matter(content);
      if (data.title) return data.title;
    } catch (error) {
      console.warn(`Error parsing frontmatter for ${docPath}: ${error.message}`);
    }

    // Try to get title from first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].trim();

    // Use filename as fallback
    const baseName = path.basename(docPath, path.extname(docPath));
    return baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/-/g, ' ');
  }

  // Process a single markdown file to extract links
  processFile(filePath) {
    try {
      console.log(`Processing file: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceId = this.normalizePath(filePath);
      
      console.log(`Normalized source ID: ${sourceId}`);
      
      // Initialize the node for this document
      if (!this.linkMap.has(sourceId)) {
        this.linkMap.set(sourceId, {
          id: sourceId,
          title: this.getDisplayTitle(filePath, content),
          linkTo: new Set(),
          referencedBy: new Set()
        });
      } else {
        // Update title if we already have this node
        this.linkMap.get(sourceId).title = this.getDisplayTitle(filePath, content);
      }

      // Extract double bracket links: [[some-note]] or [[some-note|Link text]]
      const doubleBracketMatches = [...content.matchAll(DOUBLE_BRACKET_REGEX)];
      console.log(`Found ${doubleBracketMatches.length} double bracket links`);
      for (const match of doubleBracketMatches) {
        const targetPath = match[1].trim();
        // Skip external links, fragments, or image files
        if (targetPath.includes('://') || 
            targetPath.startsWith('#') || 
            targetPath.toLowerCase().endsWith('.png') ||
            targetPath.toLowerCase().endsWith('.jpg') ||
            targetPath.toLowerCase().endsWith('.jpeg') ||
            targetPath.toLowerCase().endsWith('.gif') ||
            targetPath.toLowerCase().endsWith('.svg') ||
            targetPath.toLowerCase().includes('figures/') || // Skip figures directory
            targetPath.startsWith('</figures/')) { // Skip markdown image syntax with figures
          console.log(`  Skipping image link: ${targetPath}`);
          continue;
        }
        const targetId = this.normalizePath(targetPath);
        console.log(`  Double bracket link: ${match[1]} -> ${targetId}`);
        this.addLink(sourceId, targetId);
      }
      
      // Extract wiki-style links: [Link text](some-note)
      const wikiLinkMatches = [...content.matchAll(WIKI_LINK_REGEX)];
      console.log(`Found ${wikiLinkMatches.length} wiki-style links`);
      for (const match of wikiLinkMatches) {
        const targetPath = match[2].trim();
        // Skip external links, fragments, or image files
        if (targetPath.includes('://') || 
            targetPath.startsWith('#') || 
            targetPath.toLowerCase().endsWith('.png') ||
            targetPath.toLowerCase().endsWith('.jpg') ||
            targetPath.toLowerCase().endsWith('.jpeg') ||
            targetPath.toLowerCase().endsWith('.gif') ||
            targetPath.toLowerCase().endsWith('.svg') ||
            targetPath.toLowerCase().includes('figures/') || // Skip figures directory
            targetPath.startsWith('</figures/')) { // Skip markdown image syntax with figures
          console.log(`  Skipping external/fragment/image link: ${targetPath}`);
          continue;
        }
        const targetId = this.normalizePath(targetPath);
        console.log(`  Wiki link: ${match[2]} -> ${targetId}`);
        this.addLink(sourceId, targetId);
      }
      
      // Extract standard docs links: [Link text](/docs/some-note)
      const docsLinkMatches = [...content.matchAll(DOCS_LINK_REGEX)];
      console.log(`Found ${docsLinkMatches.length} docs links`);
      for (const match of docsLinkMatches) {
        const targetPath = match[2].trim();
        // Skip external links, fragments, or image files
        if (targetPath.includes('://') || 
            targetPath.startsWith('#') || 
            targetPath.toLowerCase().endsWith('.png') ||
            targetPath.toLowerCase().endsWith('.jpg') ||
            targetPath.toLowerCase().endsWith('.jpeg') ||
            targetPath.toLowerCase().endsWith('.gif') ||
            targetPath.toLowerCase().endsWith('.svg') ||
            targetPath.toLowerCase().includes('figures/') || // Skip figures directory
            targetPath.startsWith('</figures/')) { // Skip markdown image syntax with figures
          console.log(`  Skipping external/fragment/image link: ${targetPath}`);
          continue;
        }
        const targetId = this.normalizePath(targetPath);
        console.log(`  Docs link: ${match[2]} -> ${targetId}`);
        this.addLink(sourceId, targetId);
      }
      
      // Log the final links
      const currentNode = this.linkMap.get(sourceId);
      console.log(`Links for ${sourceId}: ${Array.from(currentNode.linkTo).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error(`Error processing file ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Add a link between source and target
  addLink(sourceId, targetId) {
    // Get or create source node
    if (!this.linkMap.has(sourceId)) {
      this.linkMap.set(sourceId, {
        id: sourceId,
        title: this.getTitleFromId(sourceId),
        linkTo: new Set(),
        referencedBy: new Set()
      });
    }
    
    // Add the link
    this.linkMap.get(sourceId).linkTo.add(targetId);
    
    // Get or create target node
    if (!this.linkMap.has(targetId)) {
      this.linkMap.set(targetId, {
        id: targetId,
        title: this.getTitleFromId(targetId),
        linkTo: new Set(),
        referencedBy: new Set()
      });
    }
    
    // Add the backlink
    this.linkMap.get(targetId).referencedBy.add(sourceId);
  }

  // Get a display title from a node ID when we don't have the file
  getTitleFromId(id) {
    // If it's a path with subdirectories, show only the basename
    if (id.includes('/')) {
      return path.basename(id).charAt(0).toUpperCase() 
        + path.basename(id).slice(1).replace(/-/g, ' ');
    }
    // Otherwise, just use the ID with first letter capitalized
    return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
  }

  // Convert the link map to the final graph format
  generateGraphData() {
    const nodes = [];
    
    for (const [id, node] of this.linkMap.entries()) {
      nodes.push({
        id: id,
        title: node.title,
        linkTo: Array.from(node.linkTo),
        referencedBy: Array.from(node.referencedBy)
      });
    }
    
    return nodes;
  }

  // Process all markdown files in the docs directory
  processAllFiles() {
    const globPattern = path.join(this.docsDir, '**/*.{md,mdx}');
    const files = glob.sync(globPattern);
    
    console.log(`Found ${files.length} markdown files to process`);
    
    let processedCount = 0;
    for (const file of files) {
      const success = this.processFile(file);
      if (success) {
        processedCount++;
        const normalizedId = this.normalizePath(file);
        console.log(`Processed: ${normalizedId}`);
      }
    }
    
    console.log(`Successfully processed ${processedCount} of ${files.length} files`);
    
    // Debug output of extracted links
    for (const [id, node] of this.linkMap.entries()) {
      if (node.linkTo.size > 0 || node.referencedBy.size > 0) {
        console.log(`Node ${id}:`);
        console.log(`  Links to: ${Array.from(node.linkTo).join(', ')}`);
        console.log(`  Referenced by: ${Array.from(node.referencedBy).join(', ')}`);
      }
    }
    
    return this.generateGraphData();
  }

  // Save the graph data to a JSON file
  saveGraphData(graphData, outDir) {
    // Handle the specific case of duplicate nodes
    const processedData = this.deduplicateNodes(graphData);
    
    const outputPath = path.join(outDir, this.outputFileName);
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
    console.log(`Wiki link graph generated: ${outputPath}`);
  }
  
  // Process graph data to deduplicate nodes with same basename
  deduplicateNodes(graphData) {
    // Find short node IDs that have a corresponding full path version
    // For our specific issue: "towards-undersating-cross-and-self-attention" vs "trustworthy-ai/diffusion-based/towards-undersating-cross-and-self-attention"
    const nodesToMerge = [];
    const nodeById = {};
    
    // Index nodes by ID
    graphData.forEach(node => {
      nodeById[node.id] = node;
      
      // Check if this is a short ID that might have a full path version
      if (!node.id.includes('/')) {
        const basename = node.id;
        // Look for full path versions
        const fullPathMatch = graphData.find(n => 
          n.id !== basename && n.id.endsWith('/' + basename)
        );
        
        if (fullPathMatch) {
          nodesToMerge.push({
            shortId: basename,
            fullPathId: fullPathMatch.id
          });
        }
      }
    });
    
    // If we found nodes to merge, process the graph
    if (nodesToMerge.length > 0) {
      // Create ID mapping for redirects
      const idMapping = {};
      nodesToMerge.forEach(merge => {
        idMapping[merge.shortId] = merge.fullPathId;
      });
      
      // Filter out the short versions
      const filteredNodes = graphData.filter(node => 
        !nodesToMerge.some(merge => merge.shortId === node.id)
      );
      
      // Update references in linkTo and referencedBy arrays
      filteredNodes.forEach(node => {
        // Update linkTo
        if (node.linkTo) {
          node.linkTo = node.linkTo.map(link => 
            idMapping[link] || link
          );
        }
        
        // Update referencedBy
        if (node.referencedBy) {
          node.referencedBy = node.referencedBy.map(ref => 
            idMapping[ref] || ref
          );
        }
      });
      
      return filteredNodes;
    }
    
    // If no nodes to merge, return the original data
    return graphData;
  }
}

module.exports = function(context, options) {
  const { siteDir } = context;
  const docsDir = path.join(siteDir, options.docsDir || 'docs');
  const outputFileName = options.outputFileName || 'docusaurus-graph.json';
  
  return {
    name: 'wiki-link-extractor',
    
    async loadContent() {
      console.log('Loading content and extracting wiki links...');
      const extractor = new WikiLinkExtractor({
        docsDir: docsDir,
        outputFileName: outputFileName
      });
      
      return {
        graphData: extractor.processAllFiles()
      };
    },
    
    async contentLoaded({ content, actions }) {
      console.log(`Content loaded, extracted ${content.graphData.length} nodes`);
    },
    
    async postBuild({ outDir, content }) {
      if (!content || !content.graphData) {
        console.error('No graph data available. This should not happen.');
        return;
      }
      
      try {
        // Copy graph data to the build directory
        const outputPath = path.join(outDir, outputFileName);
        fs.writeFileSync(outputPath, JSON.stringify(content.graphData, null, 2));
        console.log(`Wiki link graph saved to: ${outputPath}`);
      } catch (error) {
        console.error(`Error saving wiki link graph: ${error.message}`);
      }
    }
  };
};