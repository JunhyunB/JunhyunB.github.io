import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// Helper function to get neighbors (both linkTo and referencedBy)
function getNeighbors(data, docId) {
  // Normalize IDs to handle index variations
  const normalizeId = (id) => id ? id.replace(/\/index$/, '') : '';
  const normalizedDocId = normalizeId(docId);
  
  const neighbors = new Set([docId]);
  
  // Find the current document node using normalized ID comparison
  const currentNode = data.find(item => normalizeId(item.id) === normalizedDocId);
  
  if (!currentNode) {
    console.warn(`Document with ID ${docId} (normalized: ${normalizedDocId}) not found in graph data`);
    // If current node is not found, add some popular nodes as fallback
    const popularNodes = data
      .sort((a, b) => {
        const aConnections = (a.linkTo?.length || 0) + (a.referencedBy?.length || 0);
        const bConnections = (b.linkTo?.length || 0) + (b.referencedBy?.length || 0);
        return bConnections - aConnections;
      })
      .slice(0, 5);
    
    popularNodes.forEach(node => neighbors.add(node.id));
    
    return neighbors;
  }
  
  console.log(`Found current node for ${docId}: ${currentNode.id}`);
  
  // Add outgoing links (documents this document links to)
  if (currentNode.linkTo && currentNode.linkTo.length > 0) {
    // Add all outgoing links, not just a subset
    currentNode.linkTo.forEach(targetId => {
      neighbors.add(targetId);
      
      // Also look for index variants of the target ID
      const normalizedTargetId = normalizeId(targetId);
      data.forEach(item => {
        if (normalizeId(item.id) === normalizedTargetId && !neighbors.has(item.id)) {
          console.log(`Added index variant for outgoing link: ${item.id} (variant of ${targetId})`);
          neighbors.add(item.id);
        }
      });
    });
  }
  
  // Add incoming links (documents that link to this document)
  if (currentNode.referencedBy && currentNode.referencedBy.length > 0) {
    // Add all incoming links, not just a subset
    currentNode.referencedBy.forEach(sourceId => {
      neighbors.add(sourceId);
      
      // Also look for index variants of the source ID
      const normalizedSourceId = normalizeId(sourceId);
      data.forEach(item => {
        if (normalizeId(item.id) === normalizedSourceId && !neighbors.has(item.id)) {
          console.log(`Added index variant for incoming link: ${item.id} (variant of ${sourceId})`);
          neighbors.add(item.id);
        }
      });
      
      // Also add the source document's links to the current document
      // This ensures we see relationships like "sourceId -> docId"
      const sourceNode = data.find(item => normalizeId(item.id) === normalizedSourceId);
      if (sourceNode && sourceNode.linkTo) {
        // Check if any of the linkTo targets match the current document (using normalized comparison)
        const hasLinkToCurrentDoc = sourceNode.linkTo.some(target => normalizeId(target) === normalizedDocId);
        if (hasLinkToCurrentDoc) {
          // We already have this sourceId in neighbors, but this confirms the bidirectional relationship
          console.log(`Confirmed bidirectional relationship between ${sourceId} and ${docId}`);
        }
      }
    });
  }
  
  // Find second degree connections for a richer graph
  // First collect first-degree neighbors
  const firstDegreeNeighbors = Array.from(neighbors).filter(id => normalizeId(id) !== normalizedDocId);
  
  // Always add second-degree connections to get a richer graph, but increased the number of links
  firstDegreeNeighbors.forEach(neighborId => {
    const normalizedNeighborId = normalizeId(neighborId);
    const neighborNode = data.find(item => normalizeId(item.id) === normalizedNeighborId);
    
    if (neighborNode) {
      // Add more outgoing links (increased from 3 to 5)
      if (neighborNode.linkTo && neighborNode.linkTo.length > 0) {
        neighborNode.linkTo.slice(0, 5).forEach(targetId => {
          neighbors.add(targetId);
        });
      }
      
      // Add more incoming links (increased from 3 to 5)
      if (neighborNode.referencedBy && neighborNode.referencedBy.length > 0) {
        neighborNode.referencedBy.slice(0, 5).forEach(sourceId => {
          neighbors.add(sourceId);
        });
      }
    }
  });
  
  // If we still have very few neighbors, add some of the most connected nodes in the graph
  if (neighbors.size < 5) {
    // Find popular nodes (nodes with most connections)
    const popularNodes = data
      .filter(item => !neighbors.has(item.id)) // Exclude already added nodes
      .sort((a, b) => {
        const aConnections = (a.linkTo?.length || 0) + (a.referencedBy?.length || 0);
        const bConnections = (b.linkTo?.length || 0) + (b.referencedBy?.length || 0);
        return bConnections - aConnections;
      })
      .slice(0, 5);
    
    // Add these popular nodes to provide more context
    popularNodes.forEach(node => {
      if (node && node.id) {
        neighbors.add(node.id);
        console.log(`Added popular node for context: ${node.id}`);
      }
    });
  }
  
  // As a fallback, add random nodes if we still have very few
  if (neighbors.size < 4) {
    // Add a few random nodes from the dataset
    const randomNodes = data
      .filter(item => !neighbors.has(item.id)) // Exclude already added nodes
      .sort(() => 0.5 - Math.random()) // Random shuffle
      .slice(0, 4 - neighbors.size);
    
    randomNodes.forEach(node => {
      if (node && node.id) {
        neighbors.add(node.id);
        console.log(`Added random node for visualization: ${node.id}`);
      }
    });
  }
  
  console.log(`Found ${neighbors.size} neighbors for ${docId}`);
  return neighbors;
}

// Helper function to preprocess graph data and merge index/non-index variants
function preprocessGraphData(graphData) {
  if (!graphData || !Array.isArray(graphData)) return graphData;
  
  // Create a map to collect nodes that should be merged
  const nodeMap = new Map();
  const processedNodes = [];
  
  // Normalize an ID by removing /index suffix and handling special cases
  const normalizeId = (id) => {
    if (!id) return '';
    
    // First normalize by removing index suffix
    let normalizedId = id.replace(/\/index$/, '');
    
    // Handle special case where we have both "path" and "path/index" as separate items
    // In this case, we want to treat them as the same node
    if (normalizedId.includes('/')) {
      const basePath = normalizedId.split('/')[0];
      if (basePath === normalizedId) {
        // This might be a case where we have both "section" and "section/index"
        console.log(`Found potential base path: ${basePath} that might need special handling`);
      }
    }
    
    // Special case for trustworthy-ai and trustworthy-ai/index - need to be treated as same node
    if (normalizedId === 'trustworthy-ai' || normalizedId === 'trustworthy-ai/index') {
      normalizedId = 'trustworthy-ai';
    }
    
    return normalizedId;
  };
  
  // First pass: group nodes by their normalized ID (without /index)
  graphData.forEach(node => {
    if (!node || !node.id) return;
    
    // Normalize the ID by removing /index suffix
    const normalizedId = normalizeId(node.id);
    
    if (!nodeMap.has(normalizedId)) {
      nodeMap.set(normalizedId, {
        nodes: [],
        linkTo: new Set(),
        referencedBy: new Set(),
        titles: new Set() // Track all possible titles
      });
    }
    
    // Add this node to the group
    const group = nodeMap.get(normalizedId);
    group.nodes.push(node);
    if (node.title) {
      group.titles.add(node.title);
    }
    
    // Collect all links, but normalize target IDs too
    if (Array.isArray(node.linkTo)) {
      node.linkTo.forEach(target => {
        const normalizedTarget = normalizeId(target);
        group.linkTo.add(normalizedTarget);
      });
    }
    
    if (Array.isArray(node.referencedBy)) {
      node.referencedBy.forEach(source => {
        const normalizedSource = normalizeId(source);
        group.referencedBy.add(normalizedSource);
      });
    }
  });
  
  // Second pass: create merged nodes
  for (const [normalizedId, group] of nodeMap.entries()) {
    // Get the most meaningful node as the primary one
    const primaryNode = group.nodes.sort((a, b) => {
      // Prefer nodes with index in the ID (they're usually more complete)
      const aHasIndex = a.id.endsWith('/index') ? 1 : 0;
      const bHasIndex = b.id.endsWith('/index') ? 1 : 0;
      
      if (aHasIndex !== bHasIndex) return bHasIndex - aHasIndex;
      
      // Otherwise prefer the one with the longer ID
      return b.id.length - a.id.length;
    })[0];
    
    // Pick the most descriptive title from all available options
    const allTitles = Array.from(group.titles);
    let bestTitle = primaryNode.title || normalizedId;
    
    // Prefer title with proper capitalization and longer descriptive titles
    if (allTitles.length > 1) {
      bestTitle = allTitles.sort((a, b) => {
        // Prefer titles with capital letters (more likely to be properly formatted)
        const aHasCaps = /[A-Z]/.test(a) ? 1 : 0;
        const bHasCaps = /[A-Z]/.test(b) ? 1 : 0;
        
        if (aHasCaps !== bHasCaps) return bHasCaps - aHasCaps;
        
        // Then prefer longer titles as they're often more descriptive
        return b.length - a.length;
      })[0];
    }
    
    // Create a merged node with the best title
    const mergedNode = {
      ...primaryNode,
      id: normalizedId, // Use the normalized ID
      title: bestTitle, // Use the best title we found
      linkTo: Array.from(group.linkTo),
      referencedBy: Array.from(group.referencedBy)
    };
    
    processedNodes.push(mergedNode);
  }
  
  // Third pass: normalize linkTo and referencedBy references for all nodes
  processedNodes.forEach(node => {
    // Replace any /index references in linkTo with the normalized version
    if (Array.isArray(node.linkTo)) {
      node.linkTo = node.linkTo.map(target => normalizeId(target));
      // Remove self-references that might have been created during normalization
      node.linkTo = node.linkTo.filter(target => target !== node.id);
      // Remove duplicates
      node.linkTo = [...new Set(node.linkTo)];
    }
    
    // Do the same for referencedBy
    if (Array.isArray(node.referencedBy)) {
      node.referencedBy = node.referencedBy.map(source => normalizeId(source));
      // Remove self-references that might have been created during normalization
      node.referencedBy = node.referencedBy.filter(source => source !== node.id);
      // Remove duplicates
      node.referencedBy = [...new Set(node.referencedBy)];
    }
  });
  
  console.log(`Preprocessed graph data: ${graphData.length} nodes -> ${processedNodes.length} nodes`);
  
  // Debug log to help identify bidirectional links
  processedNodes.forEach(node => {
    if (Array.isArray(node.linkTo) && Array.isArray(node.referencedBy)) {
      const bidirectionalNodes = node.linkTo.filter(target => 
        node.referencedBy.includes(target)
      );
      
      if (bidirectionalNodes.length > 0) {
        console.log(`Node ${node.id} has bidirectional links with:`, bidirectionalNodes);
      }
    }
  });
  
  return processedNodes;
}

export default function DocGraphView({ graphData, currentDocId, isContextual }) {
  const graphRef = useRef(null);
  // Create a normalization cache to avoid repeated computation
  const normalizationCache = useRef(new Map());
  
  // Preprocess graph data to merge index/non-index variants with error handling
  const processedGraphData = useMemo(() => {
    try {
      if (!graphData || !Array.isArray(graphData) || graphData.length === 0) {
        console.warn("No valid graph data available");
        return [];
      }

      // Special case for trustworthy-ai nodes - fix at runtime before preprocessing
      // This is a targeted fix for the specific issue with duplicate trustworthy-ai nodes
      if (graphData.some(node => node.id === 'trustworthy-ai') && 
          graphData.some(node => node.id === 'trustworthy-ai/index')) {
        
        console.log("Found duplicate trustworthy-ai nodes, merging them...");
        
        // Get the nodes
        const basicNode = graphData.find(node => node.id === 'trustworthy-ai');
        const indexNode = graphData.find(node => node.id === 'trustworthy-ai/index');
        
        if (basicNode && indexNode) {
          // Merge linkTo arrays
          const allLinkTo = [...(basicNode.linkTo || []), ...(indexNode.linkTo || [])];
          basicNode.linkTo = [...new Set(allLinkTo)]; // Remove duplicates
          
          // Merge referencedBy arrays
          const allReferencedBy = [...(basicNode.referencedBy || []), ...(indexNode.referencedBy || [])];
          basicNode.referencedBy = [...new Set(allReferencedBy)]; // Remove duplicates
          
          // Use the better title 
          if (indexNode.title && (!basicNode.title || basicNode.title.toLowerCase() === basicNode.title)) {
            basicNode.title = indexNode.title;
          }
          
          // Remove the index node from graphData
          const filteredGraphData = graphData.filter(node => node.id !== 'trustworthy-ai/index');
          console.log(`Removed duplicate node: trustworthy-ai/index, new count: ${filteredGraphData.length}`);
          
          // Process the filtered data
          return preprocessGraphData(filteredGraphData);
        }
      }
      
      return preprocessGraphData(graphData);
    } catch (error) {
      console.error("Error preprocessing graph data:", error);
      return [];
    }
  }, [graphData]);
  
  // Helper to extract simple ID from full path
  const getSimpleId = (id) => {
    // Extract just the filename part without extension
    const parts = id.split('/');
    return parts[parts.length - 1].replace(/\.(md|mdx)$/, '');
  };
  
  // Helper to normalize paths for comparison with caching
  const normalizePath = (path) => {
    if (!path) return '';
    
    // Check cache first
    if (normalizationCache.current.has(path)) {
      return normalizationCache.current.get(path);
    }
    
    console.log("Normalizing path:", path);
    
    // Remove leading/trailing slashes
    let normalized = path.replace(/^\/+|\/+$/g, '');
    
    // Remove /docs/ prefix if present
    normalized = normalized.replace(/^docs\//, '');
    
    // Handle index path variants
    if (normalized.endsWith('/index')) {
      normalized = normalized.replace(/\/index$/, '');
    }
    
    console.log("After normalization:", normalized);
    
    // Store in cache for future use
    normalizationCache.current.set(path, normalized);
    return normalized;
  };
  
  // Find a matching node for the current doc id
  const findMatchingNode = (docId) => {
    if (!graphData || !docId) return null;
    
    console.log("Finding match for:", docId);
    console.log("Current URL (for detection):", window.location.pathname);
    
    // Advanced normalization and matching strategy
    const isIndexPage = window.location.pathname.endsWith('/');
    console.log("Is this an index page based on URL?", isIndexPage);
    
    // Normalize the current docId to handle various path formats
    const normalizedDocId = normalizePath(docId);
    console.log("Normalized current docId:", normalizedDocId);
    
    // Create index variants for better matching
    const indexVariants = [
      normalizedDocId,
      normalizedDocId + '/index',
      normalizedDocId.replace(/\/index$/, '')
    ];
    console.log("Trying to match with variants:", indexVariants);
    
    // Track all potential matches with their score (higher is better)
    const candidateMatches = [];
    
    // PASS 1: Look for exact matches (highest priority)
    for (const item of graphData) {
      // Normalize the graph node id as well
      const normalizedItemId = normalizePath(item.id);
      
      // Check for exact match after normalization
      if (normalizedItemId === normalizedDocId) {
        console.log("Found exact match after normalization:", item.id);
        candidateMatches.push({id: item.id, score: 100}); // Highest score
      }
      
      // Also check index variants
      for (const variant of indexVariants) {
        if (variant !== normalizedDocId && normalizedItemId === variant) {
          console.log(`Found match with index variant "${variant}":`, item.id);
          candidateMatches.push({id: item.id, score: 90}); // Very high score
        }
      }
    }
    
    // If we have exact matches from PASS 1, use the highest scoring one
    if (candidateMatches.length > 0) {
      const bestMatch = candidateMatches.sort((a, b) => b.score - a.score)[0];
      console.log("Using best exact match:", bestMatch.id, "with score:", bestMatch.score);
      return bestMatch.id;
    }
    
    // PASS 2: Try to match by path components
    const docIdParts = normalizedDocId.split('/');
    
    // Try to match the last segment (usually most specific)
    if (docIdParts.length > 0) {
      const lastSegment = docIdParts[docIdParts.length - 1];
      
      // Special handling for index pages
      const parentSegment = docIdParts.length > 1 ? docIdParts[docIdParts.length - 2] : null;
      
      for (const item of graphData) {
        const normalizedItemId = normalizePath(item.id);
        const itemParts = normalizedItemId.split('/');
        
        // If last segments match (but not a common word like "index")
        if (itemParts.length > 0) {
          const itemLastSegment = itemParts[itemParts.length - 1];
          
          if (itemLastSegment === lastSegment && lastSegment !== 'index') {
            console.log("Found match by last segment:", item.id);
            const matchDepth = Math.min(docIdParts.length, itemParts.length);
            const matchScore = 80 - (Math.abs(docIdParts.length - itemParts.length) * 5);
            candidateMatches.push({id: item.id, score: matchScore});
          }
          
          // For index pages, check if parent segments match
          if (lastSegment === 'index' && parentSegment && itemParts.length > 0) {
            const itemParentSegment = itemParts[itemParts.length - 1];
            if (itemParentSegment === parentSegment) {
              console.log("Found match by parent segment for index page:", item.id);
              candidateMatches.push({id: item.id, score: 75});
            }
          }
        }
      }
    }
    
    // PASS 3: Partial path matching (less specific)
    for (const item of graphData) {
      const normalizedItemId = normalizePath(item.id);
      
      // Check if one contains the other
      if (normalizedDocId.includes(normalizedItemId)) {
        console.log("Found container path match (doc contains item):", item.id);
        // Score based on how much of the path matches (longer matches are better)
        const matchScore = 60 + (normalizedItemId.length / normalizedDocId.length) * 10;
        candidateMatches.push({id: item.id, score: matchScore});
      } 
      else if (normalizedItemId.includes(normalizedDocId)) {
        console.log("Found contained path match (item contains doc):", item.id);
        // Score based on how much of the path matches (longer matches are better)
        const matchScore = 50 + (normalizedDocId.length / normalizedItemId.length) * 10;
        candidateMatches.push({id: item.id, score: matchScore});
      }
    }
    
    // PASS 4: Section matching for hierarchical structures
    if (docIdParts.length > 1) {
      const sectionPrefix = docIdParts.slice(0, -1).join('/');
      
      for (const item of graphData) {
        const normalizedItemId = normalizePath(item.id);
        if (normalizedItemId.startsWith(sectionPrefix + '/') || normalizedItemId === sectionPrefix) {
          console.log("Found section hierarchy match:", item.id);
          // Score based on how specific this section match is
          const itemParts = normalizedItemId.split('/');
          const prefixParts = sectionPrefix.split('/');
          const matchDepth = Math.min(prefixParts.length, itemParts.length);
          const matchScore = 40 + (matchDepth * 5);
          candidateMatches.push({id: item.id, score: matchScore});
        }
      }
    }
    
    // If we have any matches from all passes, use the highest scoring one
    if (candidateMatches.length > 0) {
      // Sort by score descending and pick the highest
      candidateMatches.sort((a, b) => b.score - a.score);
      console.log("All candidate matches:", candidateMatches);
      console.log("Using best overall match:", candidateMatches[0].id, "with score:", candidateMatches[0].score);
      return candidateMatches[0].id;
    }
    
    // FALLBACK - If everything else failed, check URL pathname
    // This catches edge cases where the URL structure might not match the ID exactly
    const currentPath = window.location.pathname;
    console.log("Last resort - using current pathname for matching:", currentPath);
    
    if (currentPath.startsWith('/docs/')) {
      const pathWithoutPrefix = currentPath.replace(/^\/docs\//, '').replace(/\/$/, '');
      
      for (const item of graphData) {
        if (pathWithoutPrefix.includes(item.id) || item.id.includes(pathWithoutPrefix)) {
          console.log("Found URL pathname based match:", item.id);
          return item.id;
        }
      }
    }
    
    console.log("No matching node found for:", docId);
    return null;
  };
  
  // Get the effective current doc ID (matching graph node)
  const effectiveDocId = useMemo(() => {
    const matchedId = findMatchingNode(currentDocId);
    console.log("Current Doc ID:", currentDocId);
    console.log("Effective Doc ID:", matchedId);
    return matchedId;
  }, [currentDocId, graphData]);

  // Filter data for contextual view if needed
  const processedData = useMemo(() => {
    if (!graphData || !Array.isArray(graphData)) {
      console.warn("No valid graph data available for processing");
      return { nodes: [], links: [] };
    }
    
    // Maximum number of nodes to render for performance reasons
    const MAX_NODES_FOR_PERFORMANCE = 150;

    // Additional runtime deduplication of nodes - specifically targeting trustworthy-ai
    // Check for duplicate nodes by ID with special handling for trustworthy-ai
    const seenIds = new Set();
    const dedupedData = [];
    
    for (const node of processedGraphData) {
      if (!node || !node.id) continue;
      
      // Normalize IDs for comparison
      let normalizedId = node.id;
      if (normalizedId === 'trustworthy-ai/index') {
        normalizedId = 'trustworthy-ai';
      }
      
      // If we've seen this node before (in its normalized form), skip it
      if (seenIds.has(normalizedId)) {
        console.log(`Skipping duplicate node: ${node.id}`);
        continue;
      }
      
      // Mark this node as seen and add it to the unique nodes list
      seenIds.add(normalizedId);
      dedupedData.push(node);
    }
    
    console.log(`Deduplicated nodes: ${processedGraphData.length} -> ${dedupedData.length}`);
    
    // Contextual view with error handling
    if (isContextual && effectiveDocId) {
      try {
        // Get neighbor IDs including referenced docs
        const neighborIds = getNeighbors(dedupedData, effectiveDocId);
        
        const contextualNodes = dedupedData
          .filter(item => item && item.id && neighborIds.has(item.id))
          .map(item => ({
            id: item.id,
            title: item.title || item.id
          }));

        const contextualLinks = [];
      
        // First, add all normal links (A -> B)
        dedupedData.forEach(item => {
          if (item && item.id && neighborIds.has(item.id) && item.linkTo && Array.isArray(item.linkTo)) {
            item.linkTo.forEach(targetId => {
              if (targetId && neighborIds.has(targetId)) {
                contextualLinks.push({ source: item.id, target: targetId });
              }
            });
          }
        });
        
        // Special handling for incoming links
        // First collect all nodes that reference the current doc
        const incomingNodes = [];
        const currentNode = dedupedData.find(item => item && item.id === effectiveDocId);
        if (currentNode && Array.isArray(currentNode.referencedBy) && currentNode.referencedBy.length > 0) {
          incomingNodes.push(...currentNode.referencedBy);
        }
        
        // Then ensure we have links showing "incoming -> current"
        incomingNodes.forEach(sourceId => {
          if (sourceId && !contextualLinks.some(link => {
            const source = typeof link.source === 'object' ? (link.source ? link.source.id : null) : link.source;
            const target = typeof link.target === 'object' ? (link.target ? link.target.id : null) : link.target;
            return source === sourceId && target === effectiveDocId;
          })) {
            contextualLinks.push({ source: sourceId, target: effectiveDocId });
          }
        });
        
        // Also include other backlinks (referencedBy) for completeness
        dedupedData.forEach(item => {
          if (item && item.id && neighborIds.has(item.id) && Array.isArray(item.referencedBy) && item.referencedBy.length > 0) {
            item.referencedBy.forEach(sourceId => {
              if (sourceId && neighborIds.has(sourceId)) {
                // Only add if not already added
                const linkExists = contextualLinks.some(
                  link => (link.source === sourceId && link.target === item.id)
                );
                if (!linkExists) {
                  contextualLinks.push({ source: sourceId, target: item.id });
                }
              }
            });
          }
        });
      
      // If there are no links, add placeholder nodes for visualization
      if (contextualLinks.length === 0 && contextualNodes.length <= 1) {
        // Find a few sample nodes from the graph data
        const placeholderCount = Math.min(4, dedupedData.length - 1);
        if (placeholderCount > 0) {
          const placeholders = dedupedData
            .filter(item => item && item.id && item.id !== effectiveDocId)
            .slice(0, placeholderCount);
            
          placeholders.forEach((item, index) => {
            // Add nodes if they don't already exist
            if (!contextualNodes.some(node => node.id === item.id)) {
              contextualNodes.push({
                id: item.id,
                title: item.title || item.id,
                isPlaceholder: true
              });
            }
            
            // Create alternating incoming/outgoing placeholder links
            if (index % 2 === 0) {
              contextualLinks.push({ 
                source: effectiveDocId, 
                target: item.id,
                isPlaceholder: true 
              });
            } else {
              contextualLinks.push({ 
                source: item.id, 
                target: effectiveDocId,
                isPlaceholder: true 
              });
            }
          });
        }
      }
      
      return { nodes: contextualNodes, links: contextualLinks };
      
      } catch (error) {
        console.error("Error in contextual graph processing:", error);
        return { nodes: [], links: [] };
      }
    } else {
      // Full graph view with error handling
      try {
        // Transform raw data to nodes with potential node limiting for performance
        let filteredData = dedupedData.filter(item => item && typeof item === 'object' && item.id);
        
        // Still filter out paper title nodes
        filteredData = filteredData.filter(item => {
          if (!item || !item.id) return true;
          return !item.id.includes('paper-title') && !item.id.includes('category/paper-title');
        });
        
        // Check if we need to limit nodes for performance
        if (filteredData.length > MAX_NODES_FOR_PERFORMANCE && !isContextual) {
          console.log(`Large graph detected (${filteredData.length} nodes) - limiting to ${MAX_NODES_FOR_PERFORMANCE} nodes for performance`);
          
          // Always include current node and its direct connections
          const currentNodeId = effectiveDocId;
          const currentNode = filteredData.find(item => item.id === currentNodeId);
          
          // Create a set of important node IDs to keep - start with the current node
          const importantNodeIds = new Set();
          if (currentNode) {
            importantNodeIds.add(currentNode.id);
            
            // Add direct connections (both incoming and outgoing)
            if (Array.isArray(currentNode.linkTo)) {
              currentNode.linkTo.forEach(id => importantNodeIds.add(id));
            }
            if (Array.isArray(currentNode.referencedBy)) {
              currentNode.referencedBy.forEach(id => importantNodeIds.add(id));
            }
          }
          
          // If we still have room, add nodes based on connection count (most connected nodes)
          const remainingCount = MAX_NODES_FOR_PERFORMANCE - importantNodeIds.size;
          if (remainingCount > 0) {
            // Sort by connection count (descending)
            const sortedByConnections = filteredData
              .filter(item => !importantNodeIds.has(item.id))
              .map(item => {
                const connectionCount = (Array.isArray(item.linkTo) ? item.linkTo.length : 0) + 
                                       (Array.isArray(item.referencedBy) ? item.referencedBy.length : 0);
                return { ...item, connectionCount };
              })
              .sort((a, b) => b.connectionCount - a.connectionCount)
              .slice(0, remainingCount);
              
            // Add these to our important nodes set
            sortedByConnections.forEach(item => importantNodeIds.add(item.id));
          }
          
          // Filter data to only include important nodes
          filteredData = filteredData.filter(item => importantNodeIds.has(item.id));
          console.log(`Reduced to ${filteredData.length} important nodes for better performance`);
        }
        
        // Create node objects
        const nodes = filteredData.map(item => ({
          id: item.id,
          title: item.title || item.id
        }));
        
        const links = [];
        
        // Include direct links with safety checks
        dedupedData.forEach(item => {
          if (item && item.id && Array.isArray(item.linkTo) && item.linkTo.length > 0) {
            item.linkTo.forEach(targetId => {
              if (targetId) {
                // Check if target exists in the dedupedData
                const targetExists = dedupedData.some(node => node && node.id === targetId);
                if (targetExists) {
                  links.push({ source: item.id, target: targetId });
                }
              }
            });
          }
        });
        
        // For visual purpose, also include the back references
        dedupedData.forEach(item => {
          if (item && item.id && Array.isArray(item.referencedBy) && item.referencedBy.length > 0) {
            item.referencedBy.forEach(sourceId => {
              if (sourceId) {
                // Check if source exists in dedupedData
                const sourceExists = dedupedData.some(node => node && node.id === sourceId);
                if (sourceExists) {
                  // Only add if not already added (avoid duplicates)
                  const linkExists = links.some(
                    link => (link.source === sourceId && link.target === item.id)
                  );
                  if (!linkExists) {
                    links.push({ source: sourceId, target: item.id });
                  }
                }
              }
            });
          }
        });
        
        // Handle the case where the current node has no connections in full view
        if (effectiveDocId && nodes.some(node => node.id === effectiveDocId)) {
          const currentNodeHasLinks = links.some(link => {
            try {
              const sourceId = typeof link.source === 'object' ? 
                (link.source && link.source.id ? link.source.id : null) : link.source;
              const targetId = typeof link.target === 'object' ? 
                (link.target && link.target.id ? link.target.id : null) : link.target;
                
              return sourceId === effectiveDocId || targetId === effectiveDocId;
            } catch (e) {
              console.error("Error in link check:", e);
              return false;
            }
          });
          
          // If current node has no connections, add placeholder connections
          if (!currentNodeHasLinks && nodes.length > 1) {
            // Add up to 4 placeholder connections
            const placeholderCount = Math.min(4, nodes.length - 1);
            const otherNodes = nodes
              .filter(node => node && node.id && node.id !== effectiveDocId)
              .slice(0, placeholderCount);
              
            otherNodes.forEach((node, index) => {
              // Create alternating incoming/outgoing placeholder links
              if (index % 2 === 0) {
                links.push({ 
                  source: effectiveDocId, 
                  target: node.id,
                  isPlaceholder: true 
                });
              } else {
                links.push({ 
                  source: node.id, 
                  target: effectiveDocId,
                  isPlaceholder: true 
                });
              }
            });
          }
        }
        
        return { nodes, links };
      } catch (error) {
        console.error("Error in full graph processing:", error);
        return { nodes: [], links: [] };
      }
    }
  }, [graphData, effectiveDocId, isContextual]);

  // Main rendering effect
  useEffect(() => {
    const renderGraph = () => {
      if (!graphRef.current || !processedData || !processedData.nodes) {
        return;
      }
      
      const container = graphRef.current;
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 200;
      
      // Clear existing content
      d3.select(container).selectAll('*').remove();
      
      // Create SVG element
      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-width / 2, -height / 2, width, height])
        .attr('style', 'max-width: 100%; height: auto;');
        
      // Define node colors
      const nodeColors = {
        current: '#E63946', // Current node (bright red)
        outgoing: '#457B9D', // Documents this links to (blue)
        incoming: '#2A9D8F', // Documents that link to this (teal)
        both: '#F4A261',     // Bidirectional links (orange)
        unrelated: '#A8DADC', // Other nodes (light blue)
        placeholder: '#C0C0C0' // Placeholder nodes (gray)
      };
      
      // Modify force simulation parameters based on contextual vs full view - with increased sizes for better readability
      const linkDistance = isContextual ? 100 : 180; // Increased for better spacing
      const chargeStrength = isContextual ? -200 : -500; // Stronger repulsion to prevent overlap
      const nodeSize = isContextual ? 12 : 16; // Significantly larger nodes for better visibility
      const labelSize = isContextual ? '13px' : '15px'; // Larger text size for better readability
      
      // Analyze link relationships
      processedData.nodes.forEach(node => {
        // Always mark the current document clearly, even in full view
        if (node.id === effectiveDocId) {
          node.type = 'current';
          console.log("Setting current node:", node.id);
          return;
        }
        
        if (node.isPlaceholder) {
          node.type = 'placeholder';
          return;
        }
        
        // Handle bidirectional relationships in a generic way
        const hasBidirectionalLink = (() => {
          // Normalize IDs for comparison, handling index variants too
          const normalizeId = (id) => id ? id.replace(/\/index$/, '') : '';
          const normalizedEffectiveDocId = normalizeId(effectiveDocId);
          const normalizedNodeId = normalizeId(node.id);
          
          // Check for outgoing link from current doc to this node
          const outgoingLink = processedData.links.some(link => {
            const sourceId = normalizeId(typeof link.source === 'object' ? link.source.id : link.source);
            const targetId = normalizeId(typeof link.target === 'object' ? link.target.id : link.target);
            return sourceId === normalizedEffectiveDocId && targetId === normalizedNodeId;
          });
          
          // Check for incoming link from this node to current doc
          const incomingLink = processedData.links.some(link => {
            const sourceId = normalizeId(typeof link.source === 'object' ? link.source.id : link.source);
            const targetId = normalizeId(typeof link.target === 'object' ? link.target.id : link.target);
            return sourceId === normalizedNodeId && targetId === normalizedEffectiveDocId;
          });
          
          const isBidirectional = outgoingLink && incomingLink;
          if (isBidirectional) {
            console.log(`DocGraphView - Detected bidirectional link between ${effectiveDocId} and ${node.id}`);
          }
          
          return isBidirectional;
        })();
        
        if (hasBidirectionalLink) {
          console.log("Bidirectional relationship detected between", effectiveDocId, "and", node.id);
          node.type = 'both';
          return;
        }
        
        // Check if current doc links to this node
        const outgoing = processedData.links.some(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return sourceId === effectiveDocId && targetId === node.id;
        });
        
        // Check if this node links to current doc
        const incoming = processedData.links.some(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return sourceId === node.id && targetId === effectiveDocId;
        });
        
        if (outgoing && incoming) {
          node.type = 'both';
        } else if (outgoing) {
          node.type = 'outgoing';
        } else if (incoming) {
          node.type = 'incoming';
        } else {
          node.type = 'unrelated';
        }
      });
      
      // For full knowledge graph view (non-contextual), use a different layout
      if (!isContextual) {
        // Group nodes by relationship type for better organization
        const currentNodes = processedData.nodes.filter(n => n.type === 'current');
        const incomingNodes = processedData.nodes.filter(n => n.type === 'incoming');
        const outgoingNodes = processedData.nodes.filter(n => n.type === 'outgoing');
        const bidirectionalNodes = processedData.nodes.filter(n => n.type === 'both');
        const otherNodes = processedData.nodes.filter(n => 
          n.type !== 'current' && n.type !== 'incoming' && 
          n.type !== 'outgoing' && n.type !== 'both');
        
        // Place current node at center
        currentNodes.forEach(node => {
          node.x = 0;
          node.y = 0;
          node.fx = 0; // Pin current node in place
          node.fy = 0;
        });
        
        // Use a simpler, more spaced-out layout that's less susceptible to overlap
        
        // Place incoming nodes on the top-right area
        incomingNodes.forEach((node, i) => {
          const baseAngle = -Math.PI/8; // Slightly toward right from top
          const spread = Math.min(Math.PI/3, 0.4 * Math.PI / Math.max(incomingNodes.length, 1));
          const angle = baseAngle - (spread * i);
          const distance = 200 + (i * 20); // Increasing distance with index
          node.x = Math.cos(angle) * distance;
          node.y = Math.sin(angle) * distance;
        });
        
        // Place outgoing nodes on the right area
        outgoingNodes.forEach((node, i) => {
          const baseAngle = Math.PI/8; // Slightly down from right
          const spread = Math.min(Math.PI/3, 0.4 * Math.PI / Math.max(outgoingNodes.length, 1));
          const angle = baseAngle + (spread * i);
          const distance = 200 + (i * 20); // Increasing distance with index
          node.x = Math.cos(angle) * distance;
          node.y = Math.sin(angle) * distance;
        });
        
        // Place bidirectional nodes on the left area
        bidirectionalNodes.forEach((node, i) => {
          const baseAngle = Math.PI - Math.PI/8; // Slightly up from left
          const spread = Math.min(Math.PI/3, 0.4 * Math.PI / Math.max(bidirectionalNodes.length, 1));
          const angle = baseAngle - (spread * i);
          const distance = 200 + (i * 20); // Increasing distance with index
          node.x = Math.cos(angle) * distance;
          node.y = Math.sin(angle) * distance;
        });
        
        // Distribute other nodes around the bottom in a wider arc
        otherNodes.forEach((node, i) => {
          const nodeCount = Math.max(otherNodes.length, 1);
          const arcLength = Math.min(Math.PI, 0.8 * Math.PI); // Limit the arc length
          const baseAngle = Math.PI + Math.PI/2 - arcLength/2; // Start from bottom-right
          const angle = baseAngle + (arcLength * i / nodeCount);
          const distance = 260 + (i % 3) * 40; // Three levels of distances
          node.x = Math.cos(angle) * distance;
          node.y = Math.sin(angle) * distance;
        });
      }
      
      // Ensure both source and target are strings in the links data
      const safeLinks = [];
      if (processedData.links && Array.isArray(processedData.links)) {
        processedData.links.forEach(link => {
          try {
            if (!link) return;
            
            // Create new link objects with source/target as strings only
            const sourceId = typeof link.source === 'object' && link.source && link.source.id ? 
              link.source.id : (typeof link.source === 'string' ? link.source : null);
            
            const targetId = typeof link.target === 'object' && link.target && link.target.id ? 
              link.target.id : (typeof link.target === 'string' ? link.target : null);
              
            if (sourceId && targetId) {
              safeLinks.push({
                source: sourceId,
                target: targetId,
                isPlaceholder: link.isPlaceholder || false
              });
            }
          } catch (e) {
            console.error('Error processing link:', e);
          }
        });
      }
      
      // Create safe nodes array with required properties
      const safeNodes = [];
      if (processedData.nodes && Array.isArray(processedData.nodes)) {
        processedData.nodes.forEach(node => {
          try {
            if (!node || !node.id) return;
            
            // Create a clean node object with only required properties
            safeNodes.push({
              id: node.id,
              title: node.title || node.id,
              type: node.type || 'unrelated',
              isPlaceholder: node.isPlaceholder || false
            });
          } catch (e) {
            console.error('Error processing node:', e);
          }
        });
      }
      
      // Set up forces for the graph with clean data
      // First ensure we're using pristine data objects without circular references
      const nodeMap = new Map();
      
      // Create proper node objects first to ensure they're valid for D3
      safeNodes.forEach(node => {
        if (!node || typeof node !== 'object' || !node.id) return;
        
        // Create a clean copy for D3 use
        nodeMap.set(node.id, {
          id: node.id,
          title: node.title || node.id,
          type: node.type || 'unrelated',
          isPlaceholder: Boolean(node.isPlaceholder),
          // Initial positions if specified
          x: node.x || Math.random() * width - width/2,
          y: node.y || Math.random() * height - height/2,
          // Fixed positions for current node
          ...(node.type === 'current' ? { fx: 0, fy: 0 } : {})
        });
      });
      
      // Create link objects with references to actual node objects
      const validLinks = [];
      safeLinks.forEach(link => {
        if (!link || !link.source || !link.target) return;
        
        // Convert source/target to actual node references 
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        // Skip if we don't have valid nodes for both ends
        if (!nodeMap.has(sourceId) || !nodeMap.has(targetId)) return;
        
        validLinks.push({
          source: nodeMap.get(sourceId),
          target: nodeMap.get(targetId),
          isPlaceholder: Boolean(link.isPlaceholder)
        });
      });
      
      // Use our validated node and link arrays for the simulation
      const validNodes = Array.from(nodeMap.values());
      
      // Create D3 force simulation with validated data and enhanced spacing parameters
      const simulation = d3.forceSimulation(validNodes)
        .force('link', d3.forceLink(validLinks)
          .distance(d => {
            // Enhanced distance calculation with significantly increased values
            try {
              if (!d) return linkDistance * 1.3;
              if (d.isPlaceholder) return linkDistance * 1.1;
              
              const sourceId = d.source && d.source.id;
              const targetId = d.target && d.target.id;
              
              if (sourceId === effectiveDocId || targetId === effectiveDocId) {
                return linkDistance * 1.5; // Much longer connections to current node
              }
              
              // Check if this is a bidirectional link
              const isBidirectional = validLinks.some(otherLink => {
                try {
                  if (!otherLink || !otherLink.source || !otherLink.target) return false;
                  
                  const otherSourceId = otherLink.source.id;
                  const otherTargetId = otherLink.target.id;
                  
                  return otherSourceId === targetId && otherTargetId === sourceId;
                } catch (e) {
                  return false;
                }
              });
              
              // Give bidirectional links a different length
              if (isBidirectional) {
                return linkDistance * 1.4;
              }
              
              return linkDistance * 1.3; // Generally longer links for better spacing
            } catch (e) {
              console.error('Error in link distance calculation:', e);
              return linkDistance * 1.3;
            }
          })
          .strength(0.6)) // Slightly weaker link strength for better spacing
        .force('charge', d3.forceManyBody()
          .strength(d => {
            // Enhanced repulsion strength based on node type
            try {
              if (!d || typeof d !== 'object') return chargeStrength * 1.2;
              
              // Stronger repulsion for current node and its direct connections
              if (d.type === 'current') return chargeStrength * 1.5;
              if (d.type === 'incoming' || d.type === 'outgoing' || d.type === 'both') {
                return chargeStrength * 1.3;
              }
              
              return chargeStrength * 1.2; // Generally stronger repulsion overall
            } catch (e) {
              console.error('Error in charge strength calculation:', e);
              return chargeStrength * 1.2;
            }
          })
          .distanceMax(400)) // Extended force range
        .force('center', d3.forceCenter(0, 0))
        .force('collision', d3.forceCollide()
          .radius(d => {
            try {
              // Much larger collision radius based on node type and text length
              if (!d || typeof d !== 'object') return nodeSize * 5;
              
              // Estimate text length for better spacing around labels
              const labelLength = () => {
                try {
                  if (!d.title) return 8;
                  return Math.min(d.title.length, 30); // Cap at 30 chars
                } catch (e) {
                  return 8;
                }
              };
              
              // Scale collision radius by node type and label length
              if (d.type === 'current') return nodeSize * 6 + labelLength() * 2;
              if (d.type === 'both') return nodeSize * 5 + labelLength() * 1.8;
              if (d.type === 'incoming' || d.type === 'outgoing') {
                return nodeSize * 4.5 + labelLength() * 1.6;
              }
              
              return nodeSize * 4 + labelLength() * 1.4;
            } catch (e) {
              console.error('Error calculating collision radius:', e);
              return nodeSize * 5;
            }
          })
          .strength(0.9) // Stronger collision prevention
          .iterations(3)) // More iterations for better collision detection
        .force('x', d3.forceX(0).strength(0.02)) // Very weak centering force
        .force('y', d3.forceY(0).strength(0.02)); // Very weak centering force
      
      // If it's the full knowledge graph, reduce the alpha decay to allow more time for layout
      if (!isContextual) {
        simulation.alphaDecay(0.01);
      }
      
      // Define arrow marker for directed links with suitable size
      svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10") // Reduced viewBox for smaller arrow
        .attr("refX", nodeSize + 12) // Position slightly further from node
        .attr("refY", 0)
        .attr("markerWidth", 6) // Smaller marker
        .attr("markerHeight", 6) // Smaller marker
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5") // Smaller arrow path
        .attr("fill", "#666"); // Keep darker color for visibility
        
      // Create links with safety checks - use validLinks array with enhanced styling
      const link = svg.append('g')
        .selectAll('line')
        .data(validLinks)
        .enter()
        .append('line')
        .attr('stroke', d => {
          try {
            // Enhanced link colors based on relationship
            if (!d || !d.source || !d.target) return '#777';
            
            const sourceId = d.source.id;
            const targetId = d.target.id;
            
            // Check if this is a bidirectional link
            const isBidirectional = validLinks.some(otherLink => 
              otherLink.source.id === targetId && otherLink.target.id === sourceId
            );
            
            if (isBidirectional) return '#E08E46'; // Bidirectional link color (orange)
            
            // Check if source or target is current node
            if (sourceId === effectiveDocId) return '#3D6E8F'; // Outgoing link color (blue)
            if (targetId === effectiveDocId) return '#1F8A7E'; // Incoming link color (teal)
            
            return '#777'; // Default color for other links
          } catch (e) {
            return '#777';
          }
        })
        .attr('stroke-opacity', d => {
          try {
            return d && d.isPlaceholder ? 0.5 : 0.7; // Increased opacity for better visibility
          } catch (e) {
            return 0.7;
          }
        })
        .attr('stroke-width', d => {
          try {
            return d && d.isPlaceholder ? 1.5 : 2.5; // Thicker lines for better visibility
          } catch (e) {
            return 2.5;
          }
        })
        .attr('stroke-dasharray', d => {
          try {
            return null; // Remove dashed pattern for all links, including placeholders
          } catch (e) {
            return null;
          }
        })
        .attr('marker-end', d => {
          try {
            return d && d.isPlaceholder ? null : 'url(#arrow)';
          } catch (e) {
            return 'url(#arrow)';
          }
        })
        .style('filter', d => {
          try {
            // Add subtle glow effect to important links
            if (d.isPlaceholder) return 'none';
            
            const sourceId = d.source.id;
            const targetId = d.target.id;
            
            // Add shadow to links connected to current node
            if (sourceId === effectiveDocId || targetId === effectiveDocId) {
              return 'drop-shadow(0 0 1px rgba(0,0,0,0.3))';
            }
            
            return 'none';
          } catch (e) {
            return 'none';
          }
        })
        // Add hover effects for links
        .on('mouseover', function(event, d) {
          try {
            if (!d) return;
            
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', d.isPlaceholder ? 2 : 3.5) // Even thicker on hover
              .attr('stroke-opacity', 1)
              .style('filter', 'drop-shadow(0 0 2px rgba(0,0,0,0.5))');
          } catch (e) {
            console.error('Error in link mouseover:', e);
          }
        })
        .on('mouseout', function(event, d) {
          try {
            if (!d) return;
            
            // Restore original appearance
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', d.isPlaceholder ? 1.5 : 2.5)
              .attr('stroke-opacity', d.isPlaceholder ? 0.5 : 0.7)
              .style('filter', () => {
                if (d.isPlaceholder) return 'none';
                
                // Check if connected to current node to restore correct shadow
                const sourceId = d.source.id;
                const targetId = d.target.id;
                
                if (sourceId === effectiveDocId || targetId === effectiveDocId) {
                  return 'drop-shadow(0 0 1px rgba(0,0,0,0.3))';
                }
                
                return 'none';
              });
          } catch (e) {
            console.error('Error in link mouseout:', e);
          }
        });
      
      // Calculate connection count for each node
      const getConnectionCount = (nodeId) => {
        try {
          // Count both incoming and outgoing connections
          let count = 0;
          
          // Count outgoing connections
          const outgoingLinks = validLinks.filter(link => 
            link.source && link.source.id === nodeId
          ).length;
          
          // Count incoming connections
          const incomingLinks = validLinks.filter(link => 
            link.target && link.target.id === nodeId
          ).length;
          
          count = outgoingLinks + incomingLinks;
          return count > 0 ? count : 1; // Ensure minimum count of 1
        } catch (e) {
          console.error('Error counting connections:', e);
          return 1;
        }
      };
      
      // Add connection counts to each node
      validNodes.forEach(node => {
        if (node && node.id) {
          node.connectionCount = getConnectionCount(node.id);
        }
      });
      
      // Find the maximum connection count for scaling
      const maxConnections = Math.max(
        3, // Minimum to avoid division by near-zero
        ...validNodes.map(d => d && d.connectionCount ? d.connectionCount : 0)
      );
      
      // Create nodes with safety checks - use validNodes array with uniform sizing
      const node = svg.append('g')
        .selectAll('circle')
        .data(validNodes)
        .enter()
        .append('circle')
        .attr('r', d => {
          try {
            if (!d || typeof d !== 'object' || !d.id) return nodeSize;
            
            // Use consistent node sizes regardless of connection count
            if (d.type === 'current') {
              // Only the current node is slightly larger
              return nodeSize * 1.5;
            } else {
              // All other nodes have the same size
              return nodeSize;
            }
          } catch (e) {
            console.error('Error setting node radius:', e);
            return nodeSize;
          }
        })
        .attr('fill', d => {
          try {
            if (!d || typeof d !== 'object' || !d.id) return nodeColors.unrelated;
            // Force current document to always be highlighted
            if (d.id === effectiveDocId) {
              return nodeColors.current;
            }
            return nodeColors[d.type] || nodeColors.unrelated;
          } catch (e) {
            console.error('Error setting node fill:', e);
            return nodeColors.unrelated;
          }
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', d => {
          try {
            return d && d.id === effectiveDocId ? 2 : 1;
          } catch (e) {
            return 1;
          }
        })
        .attr('filter', d => {
          try {
            return d && d.id === effectiveDocId ? 'drop-shadow(0px 0px 3px rgba(230, 57, 70, 0.5))' : 'none';
          } catch (e) {
            return 'none';
          }
        })
        .call(drag(simulation));
      
      // Add labels with background for better readability
      const labelGroup = svg.append('g');
      
      // First add label backgrounds (only in full view) with improved Obsidian-style
      if (!isContextual) {
        labelGroup.selectAll('.label-bg')
          .data(validNodes)
          .enter()
          .append('rect')
          .attr('class', 'label-bg')
          .attr('rx', 8) // More rounded corners (Obsidian-style)
          .attr('ry', 8) 
          .attr('fill', d => {
            try {
              // Enhanced background colors based on node type with better contrast
              if (!d || !d.type) return 'rgba(255, 255, 255, 0.97)';
              
              switch(d.type) {
                case 'current': return 'rgba(255, 245, 245, 0.97)'; // Light red tint
                case 'incoming': return 'rgba(240, 255, 250, 0.97)'; // Light teal tint
                case 'outgoing': return 'rgba(240, 250, 255, 0.97)'; // Light blue tint
                case 'both': return 'rgba(255, 250, 240, 0.97)'; // Light orange tint
                case 'placeholder': return 'rgba(245, 245, 245, 0.95)'; // Light gray
                default: return 'rgba(250, 250, 250, 0.97)';
              }
            } catch (e) {
              console.error('Error setting label background:', e);
              return 'rgba(255, 255, 255, 0.97)';
            }
          })
          .attr('width', 0) // Will be updated after text is measured
          .attr('height', d => {
            // Dynamic height based on node type
            try {
              if (!d || !d.type) return 30;
              
              switch(d.type) {
                case 'current': return 34; // Tallest for current node
                case 'placeholder': return 26; // Smallest for placeholders
                default: return 30; // Standard height for other nodes
              }
            } catch (e) {
              return 30;
            }
          })
          .attr('pointer-events', 'auto') // 텍스트 배경도 클릭 가능하게 설정
          .style('cursor', 'pointer') // 마우스 커서를 포인터로 변경
          // 노드 클릭과 동일한 이벤트 핸들러 추가
          .on('click', (event, d) => {
            // Prevent default action
            event.preventDefault();
            event.stopPropagation();
            
            // Don't navigate if it's the current page
            if (d.type === 'current') return;
            
            // Navigate to the document using the same function as node click
            const nodeId = d.id;
            navigateToDocument(nodeId);
          })
          .attr('y', d => {
            // Vertical position based on node type
            try {
              if (!d || !d.type) return -15;
              
              switch(d.type) {
                case 'current': return -17; // Higher for current node
                case 'placeholder': return -13; // Lower for placeholders
                default: return -15;
              }
            } catch (e) {
              return -15;
            }
          })
          .attr('stroke', d => {
            try {
              // Enhanced border colors matching node colors
              if (!d || !d.type) return 'rgba(168, 218, 220, 0.5)';
              
              switch(d.type) {
                case 'current': return 'rgba(230, 57, 70, 0.5)';
                case 'incoming': return 'rgba(42, 157, 143, 0.5)';
                case 'outgoing': return 'rgba(69, 123, 157, 0.5)';
                case 'both': return 'rgba(244, 162, 97, 0.5)';
                case 'placeholder': return 'rgba(192, 192, 192, 0.4)'; // Lighter for placeholders
                default: return 'rgba(168, 218, 220, 0.5)';
              }
            } catch (e) {
              console.error('Error setting label stroke:', e);
              return 'rgba(168, 218, 220, 0.5)';
            }
          })
          .attr('stroke-width', d => {
            // Dynamic stroke width based on node type
            try {
              if (!d || !d.type) return 1.5;
              return d.type === 'placeholder' ? 0.5 : 1.5;
            } catch (e) {
              return 1.5;
            }
          })
          .style('filter', 'drop-shadow(0px 1px 2px rgba(0,0,0,0.15))'); // Add subtle shadow for depth
      }
        
      // Then add text labels with robust safety checks and Obsidian-style enhancements
      const label = labelGroup.selectAll('text')
        .data(validNodes)
        .enter()
        .append('text')
        .text(d => {
          try {
            // Safely extract and truncate title
            if (!d || typeof d !== 'object') return "";
            const title = d.title || d.id || "Unknown";
            const maxLength = isContextual ? 20 : 30; // Allow longer labels
            return title.length > maxLength ? 
                title.substring(0, maxLength) + '...' : 
                title;
          } catch (e) {
            console.error('Error setting label text:', e);
            return "";
          }
        })
        .attr('dx', d => {
          try {
            // Dynamic horizontal spacing based on node type
            if (!d || !d.type) return 20;
            
            // More space for important node labels
            return d.type === 'current' ? 23 : 20;
          } catch (e) {
            return 20;
          }
        })
        .attr('dy', d => {
          try {
            // Finer vertical alignment adjustments by node type
            if (!d || !d.type) return '.35em';
            
            switch(d.type) {
              case 'current': return '0.4em';
              case 'placeholder': return '0.3em';
              default: return '0.35em';
            }
          } catch (e) {
            return '.35em';
          }
        })
        .style('font-size', d => {
          try {
            // Dynamic font sizing based on node importance (Obsidian-style)
            if (!d || !d.type) return labelSize;
            
            switch(d.type) {
              case 'current': return isContextual ? '14px' : '16px'; // Larger for current
              case 'placeholder': return isContextual ? '12px' : '13px'; // Smaller for placeholder
              case 'both': return isContextual ? '13px' : '15px'; // Slightly larger for bidirectional
              default: return labelSize; // Default size
            }
          } catch (e) {
            return labelSize;
          }
        })
        .style('font-weight', d => {
          try {
            // Improved weight differentiation
            if (!d || !d.type) return 'normal';
            
            switch(d.type) {
              case 'current': return 'bold';
              case 'both': return '600'; // Semibold for bidirectional
              case 'incoming': 
              case 'outgoing': return '500'; // Medium for directly connected
              default: return 'normal';
            }
          } catch (e) {
            return 'normal';
          }
        })
        .style('font-family', '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .style('font-style', d => {
          try {
            return d && d.type === 'placeholder' ? 'italic' : 'normal';
          } catch (e) {
            return 'normal';
          }
        })
        .style('fill', d => {
          try {
            // Enhanced text colors matching SimpleGraphView (Obsidian-style)
            if (!d || !d.type) return 'var(--ifm-font-color-base)';
            
            switch(d.type) {
              case 'current': return '#D32F2F'; // Darker red for current node
              case 'incoming': return '#00796B'; // Darker teal
              case 'outgoing': return '#1565C0'; // Darker blue
              case 'both': return '#E65100'; // Darker orange
              case 'placeholder': return 'var(--ifm-color-gray-700)';
              default: return 'var(--ifm-font-color-base)';
            }
          } catch (e) {
            return 'var(--ifm-font-color-base)';
          }
        })
        .style('paint-order', 'stroke')
        .style('stroke', 'white')
        .style('stroke-width', '3px') // Thicker stroke for better text contrast
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round')
        .style('text-shadow', '0 1px 2px rgba(255,255,255,0.95)') // Enhanced text shadow
        .style('letter-spacing', '0.01em') // Improved letter spacing
        .style('text-rendering', 'optimizeLegibility') // Better text rendering
        .attr('pointer-events', 'auto') // 텍스트도 클릭 가능하게 변경
        .style('cursor', 'pointer') // 마우스 커서를 포인터로 변경
        // 텍스트에도 클릭 이벤트 추가
        .on('click', (event, d) => {
          // Prevent default action
          event.preventDefault();
          event.stopPropagation();
          
          // Don't navigate if it's the current page
          if (d.type === 'current') return;
          
          // Navigate to the document
          navigateToDocument(d.id);
        })
        .each(function(d) {
          // If in full view, adjust label background based on text width
          if (!isContextual) {
            const textWidth = this.getComputedTextLength();
            d.labelWidth = textWidth;
            
            // Apply Obsidian-style padding to labels
            const padding = 14; // More generous padding 
            
            labelGroup.selectAll('.label-bg')
              .filter(bg => bg.id === d.id)
              .attr('width', textWidth + padding * 2) // Double padding (left and right)
              .attr('x', -padding); // Offset by padding
          }
        });
      
      // Helper function to get the correct doc URL from node ID
      const getDocUrl = (nodeId) => {
        // Universal path construction algorithm
        console.log("Generating URL for node:", nodeId);
        
        if (!nodeId) return '/docs';
        
        // First check if this is a graph data node ID (which may need adjustment)
        const isGraphDataId = graphData.some(node => node.id === nodeId);
        console.log("Is this a graph data node ID?", isGraphDataId);
        
        // Universal algorithm for all document paths
        // Analyze the path structure to determine if it's a nested document
        const pathParts = nodeId.split('/');
        
        // Base path always starts with /docs/
        let url = '/docs/';
        
        // Check the graph data to see if this ID exists directly or needs path resolution
        const nodeExists = graphData.some(item => item.id === nodeId);
        
        if (nodeExists) {
          // The node ID is valid, use it directly
          console.log("Using direct node ID for URL - exists in graph data");
          url += nodeId;
        } else {
          // The node might be using a different path format, try to find the most appropriate URL
          console.log("Node ID not found directly, performing path resolution");
          
          // Look for any related nodes in the graph data
          const similarNodes = graphData.filter(item => {
            // Check if this item is related to our nodeId
            return item.id.includes(pathParts[pathParts.length - 1]) || 
                   nodeId.includes(item.id) || 
                   (pathParts.length > 1 && item.id.includes(pathParts[0]));
          });
          
          if (similarNodes.length > 0) {
            // Sort by most specific/longest match
            similarNodes.sort((a, b) => b.id.length - a.id.length);
            console.log("Found similar nodes:", similarNodes.map(n => n.id));
            
            // Use the most specific match
            url += similarNodes[0].id;
          } else {
            // If no good match, just use the original nodeId
            console.log("No similar nodes found, using original ID");
            url += nodeId;
          }
        }
        
        // Handle index pages - remove the trailing "index" for cleaner URLs
        if (url.endsWith('/index')) {
          console.log("Index page detected, adjusting URL");
          url = url.replace(/\/index$/, '');
          url += '/'; // Add trailing slash for index pages
        }
        
        // Check for section indices where we need a trailing slash
        if (isGraphDataId && !url.endsWith('/') && !url.endsWith('.md') && !url.endsWith('.mdx')) {
          // Check if it's potentially a section index (has children)
          const node = graphData.find(n => n.id === nodeId);
          if (node && node.linkTo && node.linkTo.length > 0) {
            const childrenIds = node.linkTo;
            const isParentNode = childrenIds.some(childId => 
              childId.startsWith(nodeId + '/') || childId === nodeId + '/index'
            );
            
            if (isParentNode) {
              console.log("Section index detected, adding trailing slash");
              url += '/';
            }
          }
        }
        
        console.log("Generated URL:", url);
        return url;
      };
      
      // Add interactivity - hover effects and click navigation
      node.on('mouseover', function(event, d) {
        // Safety check for undefined data
        if (!d || typeof d !== 'object' || !d.id) {
          console.error("Invalid node data:", d);
          return;
        }
        
        // Add cursor pointer to indicate clickability
        d3.select(this).style('cursor', 'pointer');
        
        // Highlight the node
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.type === 'current' ? nodeSize * 1.8 : nodeSize * 1.5)
          .attr('stroke-width', 2.5)
          .attr('filter', 'drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.3))');
          
        // Highlight connected links - using validLinks for safety
        link.filter(l => {
          try {
            if (!l || !l.source || !l.target) return false;
            
            // Links use direct object references in our validated data
            const sourceId = l.source.id;
            const targetId = l.target.id;
            
            return sourceId === d.id || targetId === d.id;
          } catch (e) {
            console.error("Error in link filter:", e);
            return false;
          }
        })
        .transition()
        .duration(200)
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 2.5)
        .attr('stroke', '#666');
          
        // Highlight connected nodes - using validLinks for safety
        node.filter(n => {
          if (!n || !n.id) return false;
          if (n.id === d.id) return false; // Skip self
          
          try {
            // Find direct connections in our validated links
            return validLinks.some(l => {
              if (!l || !l.source || !l.target) return false;
              
              const sourceId = l.source.id;
              const targetId = l.target.id;
              
              return (sourceId === d.id && targetId === n.id) || 
                     (sourceId === n.id && targetId === d.id);
            });
          } catch (e) {
            console.error("Error in node filter:", e);
            return false;
          }
        })
        .transition()
        .duration(200)
        .attr('r', n => n.type === 'current' ? nodeSize * 1.6 : nodeSize * 1.4)
        .attr('stroke-width', 2);
        
        // Highlight corresponding label
        label.filter(l => l && l.id === d.id)
          .transition()
          .duration(200)
          .style('font-weight', 'bold')
          .style('font-size', parseInt(labelSize) + 1 + 'px');
          
        // Highlight label background if in full view
        if (!isContextual) {
          labelGroup.selectAll('.label-bg')
            .filter(bg => bg && bg.id === d.id)
            .transition()
            .duration(200)
            .attr('fill-opacity', 1)
            .attr('stroke-width', 1.5);
        }
      })
      .on('click', function(event, d) {
        // Prevent default behavior
        event.preventDefault();
        
        // Don't navigate if we're already on this page
        if (d.id === effectiveDocId) {
          console.log("Already on current page, not navigating");
          return;
        }
        
        // For extra safety, create a reference to all needed data before async operation
        // Fixes potential closure memory issues
        const nodeId = d.id;
        const currentEffectiveDocId = effectiveDocId;
        
        // DEBUGGING - Log everything important about this node
        console.log("===== NODE CLICK DEBUG INFO =====");
        console.log("Node ID:", nodeId);
        console.log("Node Title:", d.title);
        console.log("Current page ID:", currentEffectiveDocId);
        console.log("Current URL:", window.location.pathname);
        
        // Universal path resolution algorithm for all document nodes
        // This avoids any hardcoding and provides a general solution
        
        console.log("Starting universal path resolution algorithm");
        
        // Phase 1: First attempt - direct match based on ID
        const isGraphNode = graphData.some(item => item.id === nodeId);
        if (isGraphNode) {
          console.log(`Found exact match in graph data: ${nodeId}`);
        } else {
          console.log(`No exact match found for: ${nodeId}`);
        }
        
        // Phase 2: Relationship analysis to infer the full path structure
        const possibleParents = [];
        
        // Step 1: Check all nodes that might be parents of this node
        graphData.forEach(item => {
          // A parent node links to the current node
          if (item.linkTo && item.linkTo.some(link => 
              link === nodeId || 
              link.endsWith('/' + nodeId) || 
              nodeId.includes(link + '/'))) {
            possibleParents.push({
              id: item.id, 
              confidence: 'high', 
              relation: 'parent'
            });
          }
          
          // A child node is linked from the current node
          if (nodeId.includes('/') && item.id.includes(nodeId + '/')) {
            possibleParents.push({
              id: item.id, 
              confidence: 'medium', 
              relation: 'child'
            });
          }
          
          // Sibling nodes share a common parent path
          if (nodeId.includes('/') && item.id.includes('/')) {
            const nodePath = nodeId.substring(0, nodeId.lastIndexOf('/'));
            const itemPath = item.id.substring(0, item.id.lastIndexOf('/'));
            
            if (nodePath === itemPath) {
              possibleParents.push({
                id: item.id, 
                confidence: 'medium', 
                relation: 'sibling',
                commonPath: nodePath
              });
            }
          }
        });
        
        // Step 2: Look at graph structure to find potential containing folder paths
        if (nodeId.includes('/')) {
          const pathPrefix = nodeId.substring(0, nodeId.lastIndexOf('/'));
          
          // Check if any nodes have this path as prefix (we're in a folder)
          const nodesInSameFolder = graphData.filter(item => 
            item.id.startsWith(pathPrefix + '/') && item.id !== nodeId
          );
          
          if (nodesInSameFolder.length > 0) {
            console.log(`Found ${nodesInSameFolder.length} nodes in same folder: ${pathPrefix}`);
          }
        }
        
        console.log("Relationship analysis results:", possibleParents);
        
        // Phase 3: Construct the full path based on our analysis
        let fullDocPath = nodeId;
        
        // If the node ID doesn't contain a path separator but has relationships,
        // we need to reconstruct the full path
        if (!nodeId.includes('/') && possibleParents.length > 0) {
          // Sort by confidence level
          possibleParents.sort((a, b) => {
            const confidenceMap = { high: 3, medium: 2, low: 1 };
            return confidenceMap[b.confidence] - confidenceMap[a.confidence];
          });
          
          // Use the highest confidence parent to reconstruct path
          const bestParent = possibleParents[0];
          
          if (bestParent.relation === 'sibling' && bestParent.commonPath) {
            fullDocPath = bestParent.commonPath + '/' + nodeId;
            console.log(`Reconstructed path from sibling relationship: ${fullDocPath}`);
          } else if (bestParent.id.includes('/')) {
            const parentPath = bestParent.id.substring(0, bestParent.id.lastIndexOf('/'));
            fullDocPath = parentPath + '/' + nodeId;
            console.log(`Reconstructed path from parent relationship: ${fullDocPath}`);
          }
        }
        
        // Debug log - print detailed info about what we're trying to match
        console.log("DocGraphView - DEBUG - MATCHING NODE:", {
          nodeId,
          graphDataSize: graphData.length,
          graphDataSample: graphData.slice(0, 3).map(n => n.id),
          availableNodes: graphData.map(n => n.id)
        });
        
        // Check for index path variants that should be merged
        // This handles cases like "trustworthy-ai" and "trustworthy-ai/index" being treated as the same node
        const normalizedNodeId = nodeId.replace(/\/index$/, '');
        const indexVariant = nodeId.endsWith('/index') ? nodeId.replace(/\/index$/, '') : `${nodeId}/index`;
        
        console.log("DocGraphView - Looking for index variants:", {
          normalizedNodeId,
          indexVariant,
          hasIndexVariant: graphData.some(n => n.id === indexVariant)
        });

        // General approach to handle nested paths correctly
        // Look for the node in processed graph data to get its full path
        const exactNode = processedGraphData.find(node => node.id === nodeId);
        if (exactNode) {
          // If we find an exact match, use that ID
          fullDocPath = exactNode.id;
          console.log("Found exact node match, using path:", fullDocPath);
        } else {
          console.log("DocGraphView - No exact match found, trying alternate methods");
          
          // Apply a systematic path resolution approach based on document relationships
          {
            // Enhanced path resolution algorithm
            console.log("DocGraphView - Starting enhanced path resolution for:", nodeId);
            
            // 1. Direct parent-child relationship matches
            const directPathMatches = graphData.filter(node => {
              // Check if node is a potential parent directory of our target
              const isParentOf = node.id.endsWith('/') && nodeId.startsWith(node.id); 
              
              // Check if node is a child of our target
              const isChildOf = node.id.includes('/') && 
                               node.id.startsWith(nodeId + '/');
              
              // Check if node contains the target as a leaf segment
              const containsAsLeaf = node.id.endsWith('/' + nodeId);
              
              // Check if node is part of the same section with target
              const sameSection = nodeId.includes('/') && node.id.includes('/') &&
                                 node.id.split('/')[0] === nodeId.split('/')[0];
              
              const match = isParentOf || isChildOf || containsAsLeaf || sameSection;
              
              if (match) {
                console.log("DocGraphView - Found direct relationship match:", node.id);
              }
              
              return match;
            });
            
            // 2. Content-based section detection
            // Look for nodes that have similar path prefixes
            const sectionMatches = [];
            if (nodeId.includes('/')) {
              const sectionPrefix = nodeId.split('/')[0];
              const sectionMembers = graphData.filter(node => 
                node.id.startsWith(sectionPrefix + '/') && node.id !== nodeId
              );
              
              if (sectionMembers.length > 0) {
                console.log(`DocGraphView - Found ${sectionMembers.length} nodes in section "${sectionPrefix}"`);
                sectionMatches.push(...sectionMembers);
              }
            }
            
            // 3. Use graph link relationships
            // Find nodes that have direct links with our target node in the graph
            const linkBasedMatches = graphData.filter(node => {
              // Check if this node links to our target
              const linksToTarget = Array.isArray(node.linkTo) && 
                                   node.linkTo.some(id => id === nodeId || id.endsWith('/' + nodeId));
              
              // Check if our target links to this node
              const targetLinksToThis = Array.isArray(node.referencedBy) && 
                                       node.referencedBy.some(id => id === nodeId || id.endsWith('/' + nodeId));
              
              const match = linksToTarget || targetLinksToThis;
              
              if (match) {
                console.log("DocGraphView - Found link-based match:", node.id);
              }
              
              return match;
            });
            
            // 4. Partial string matching as fallback
            const partialMatches = graphData.filter(node => {
              if (node.id === nodeId) return false; // Skip exact match (already handled)
              
              // More sophisticated matching than before
              const match = node.id.endsWith('/' + nodeId) || 
                          node.id.includes('/' + nodeId + '/') ||
                          (nodeId.includes('/') && node.id.includes('/') && 
                           nodeId.endsWith('/' + node.id.split('/').pop())) ||
                          (node.id.split('/').some(segment => 
                            nodeId.split('/').includes(segment) && segment.length > 3));
              
              if (match) {
                console.log("DocGraphView - Found partial string match:", node.id);
              }
              
              return match;
            });
            
            // Combine all matches with scoring
            const allMatches = [
              ...directPathMatches.map(m => ({ node: m, score: 100 })),
              ...sectionMatches.map(m => ({ node: m, score: 80 })),
              ...linkBasedMatches.map(m => ({ node: m, score: 70 })),
              ...partialMatches.map(m => ({ node: m, score: 50 }))
            ];
            
            // Remove duplicates and sort by score
            const uniqueMatches = [];
            const seenIds = new Set();
            
            allMatches.forEach(match => {
              if (!seenIds.has(match.node.id)) {
                seenIds.add(match.node.id);
                uniqueMatches.push(match);
              }
            });
            
            uniqueMatches.sort((a, b) => b.score - a.score);
            
            console.log("DocGraphView - Found", uniqueMatches.length, "total potential matches");
            
            if (uniqueMatches.length > 0) {
              const bestMatch = uniqueMatches[0].node;
              
              // Path reconstruction based on match type
              if (bestMatch.id.endsWith('/' + nodeId)) {
                // Match is a parent containing the target as leaf segment
                fullDocPath = bestMatch.id;
              } else if (nodeId.includes('/') && bestMatch.id.includes('/') &&
                        bestMatch.id.split('/')[0] === nodeId.split('/')[0]) {
                // They share the same root section
                if (bestMatch.id.split('/').length > nodeId.split('/').length) {
                  // Best match has more segments, likely a more specific path
                  const segments = bestMatch.id.split('/');
                  const targetSegment = nodeId.split('/').pop();
                  // Replace the last segment with our target
                  segments[segments.length - 1] = targetSegment;
                  fullDocPath = segments.join('/');
                } else {
                  // Use the best match as a template but keep our nodeId
                  fullDocPath = nodeId;
                }
              } else {
                // Default case - use the best match's path
                fullDocPath = bestMatch.id;
              }
              
              console.log("DocGraphView - Using best match:", bestMatch.id);
              console.log("DocGraphView - Resolved to path:", fullDocPath);
            }
          }
        }
        
        console.log("Final resolved path:", fullDocPath);
        
        // Phase 4: Generate the correct URL
        let url = '/docs/' + fullDocPath;
        
        // Debug log the path transformation
        console.log(`DocGraphView - Path transformation: ${nodeId} -> ${fullDocPath} -> ${url}`);
        
        // Handle index pages specially
        if (url.endsWith('/index')) {
          url = url.replace(/\/index$/, '/');
        } else if (!url.endsWith('/') && fullDocPath.includes('/')) {
          // Check if this node has child nodes (might be a section)
          const hasChildren = graphData.some(item => 
            item.id.startsWith(fullDocPath + '/') || item.id === fullDocPath + '/index'
          );
          
          if (hasChildren) {
            url += '/';
          }
        }
        
        console.log("Final URL for navigation:", url);
        
        // Navigate to the resolved URL
        const a = document.createElement('a');
        a.href = url;
        a.target = '_self';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .on('mouseout', function(event, d) {
        // Safety check for undefined data
        if (!d || typeof d !== 'object' || !d.id) {
          return;
        }
        
        // Restore node appearance
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.type === 'current' ? nodeSize * 1.5 : nodeSize)
          .attr('stroke-width', d.type === 'current' ? 2 : 1)
          .attr('filter', d.id === effectiveDocId ? 'drop-shadow(0px 0px 3px rgba(230, 57, 70, 0.5))' : 'none');
          
        // Restore link appearance with safe defaults if data is missing
        link.transition()
          .duration(200)
          .attr('stroke-opacity', l => {
            try {
              return l && l.isPlaceholder ? 0.4 : 0.6;
            } catch (e) {
              return 0.6;
            }
          })
          .attr('stroke-width', l => {
            try {
              return l && l.isPlaceholder ? 1 : 1.5;
            } catch (e) {
              return 1.5;
            }
          })
          .attr('stroke', '#999');
          
        // Restore other nodes
        node.transition()
          .duration(200)
          .attr('r', n => {
            try {
              return n && n.type === 'current' ? nodeSize * 1.5 : nodeSize;
            } catch (e) {
              return nodeSize;
            }
          });
          
        // Restore label appearance with safety checks
        label.filter(l => l && l.id === d.id)
          .transition()
          .duration(200)
          .style('font-weight', d.type === 'current' ? 'bold' : 'normal')
          .style('font-size', labelSize);
          
        // Restore label background if in full view
        if (!isContextual) {
          labelGroup.selectAll('.label-bg')
            .filter(bg => bg && bg.id === d.id)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.95)
            .attr('stroke-width', 1);
        }
      });
      
      // Update positions on simulation tick with robust error handling
      simulation.on('tick', () => {
        try {
          // Add bounds checking to keep nodes within the container
          validNodes.forEach(d => {
            try {
              if (!d) return;
              
              // Ensure x and y exist
              d.x = d.x || 0;
              d.y = d.y || 0;
              
              // Apply bounds - keep nodes within the SVG viewport
              // Add some padding to prevent nodes from touching the edges
              const padding = nodeSize * 3;
              d.x = Math.max(-width/2 + padding, Math.min(width/2 - padding, d.x));
              d.y = Math.max(-height/2 + padding, Math.min(height/2 - padding, d.y));
              
              // If this is current node, try to keep it more centered
              if (d.type === 'current') {
                // Pull current node toward center with a damping factor
                const centeringFactor = 0.1;
                d.x += (0 - d.x) * centeringFactor;
                d.y += (0 - d.y) * centeringFactor;
              }
            } catch (e) {
              console.error('Error updating node position:', e);
            }
          });
          
          // Position links with safety checks
          link.attr('x1', d => {
              try {
                // All links are guaranteed to have source as objects
                return d && d.source ? d.source.x || 0 : 0;
              } catch (e) {
                console.error('Link x1 error:', e);
                return 0;
              }
            })
            .attr('y1', d => {
              try {
                return d && d.source ? d.source.y || 0 : 0;  
              } catch (e) {
                console.error('Link y1 error:', e);
                return 0;
              }
            })
            .attr('x2', d => {
              try {
                return d && d.target ? d.target.x || 0 : 0;
              } catch (e) {
                console.error('Link x2 error:', e);
                return 0;
              }
            })
            .attr('y2', d => {
              try {
                return d && d.target ? d.target.y || 0 : 0;
              } catch (e) {
                console.error('Link y2 error:', e);
                return 0;
              }
            });
          
          // Update node positions with safety checks
          node.attr('cx', d => {
              try {
                return d && typeof d === 'object' ? d.x || 0 : 0;
              } catch (e) {
                console.error('Node cx error:', e);
                return 0;
              }
            })
            .attr('cy', d => {
              try {
                return d && typeof d === 'object' ? d.y || 0 : 0;
              } catch (e) {
                console.error('Node cy error:', e);
                return 0;
              }
            });
          
          // Update label backgrounds with safety checks
          if (!isContextual) {
            labelGroup.selectAll('.label-bg')
              .attr('transform', d => {
                try {
                  return d && typeof d === 'object' ? `translate(${d.x || 0}, ${d.y || 0})` : 'translate(0, 0)';
                } catch (e) {
                  console.error('Label bg transform error:', e);
                  return 'translate(0, 0)';
                }
              });
          }
          
          // Update label positions with safety checks
          label.attr('x', d => {
              try {
                return d && typeof d === 'object' ? d.x || 0 : 0;
              } catch (e) {
                console.error('Label x error:', e);
                return 0;
              }
            })
            .attr('y', d => {
              try {
                return d && typeof d === 'object' ? d.y || 0 : 0;
              } catch (e) {
                console.error('Label y error:', e);
                return 0;
              }
            });
        } catch (e) {
          console.error('Error in simulation tick:', e);
        }
      });
      
      // Add zoom behavior (without visible controls)
      const zoom = d3.zoom()
        .scaleExtent([0.2, 5]) // Allow even more zoom range for wider initial view
        .on('zoom', (event) => {
          svg.selectAll('g').attr('transform', event.transform);
        });
        
      svg.call(zoom);
      
      // Set initial transform to show more of the graph by default - original Obsidian style
      svg.call(zoom.transform, d3.zoomIdentity.scale(0.6).translate(width/3, height/3));
      
      // For full knowledge graph, center and auto-zoom
      if (!isContextual) {
        simulation.on('end', () => {
          try {
            // Calculate visible graph bounds
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            // Ensure we have all node positions - use validNodes
            validNodes.forEach(n => {
              try {
                // Set 'current' type for the current document in both views
                if (n.id === effectiveDocId) {
                  console.log("In simulation end - setting current type for node:", n.id);
                  n.type = 'current';
                  // Update node appearance immediately for current document
                  svg.selectAll('circle')
                    .filter(d => d && d.id === effectiveDocId)
                    .attr('fill', nodeColors.current)
                    .attr('r', nodeSize * 1.5)
                    .attr('stroke-width', 2);
                }
                
                // Handle bidirectional relationships in a generic way
                if (n.id !== effectiveDocId) {
                  // Check if there's a bidirectional relationship using our validated links
                  const hasBidirectionalLink = (() => {
                    try {
                      // Check for outgoing link from current doc to this node
                      const outgoingLink = validLinks.some(link => 
                        link.source.id === effectiveDocId && link.target.id === n.id
                      );
                      
                      // Check for incoming link from this node to current doc
                      const incomingLink = validLinks.some(link => 
                        link.source.id === n.id && link.target.id === effectiveDocId
                      );
                      
                      return outgoingLink && incomingLink;
                    } catch (e) {
                      console.error("Error checking bidirectional links:", e);
                      return false;
                    }
                  })();
                  
                  // If bidirectional (both outgoing and incoming), style it accordingly
                  if (hasBidirectionalLink) {
                    console.log("Bidirectional relationship detected between", effectiveDocId, "and", n.id);
                    n.type = 'both';
                    svg.selectAll('circle')
                      .filter(d => d && d.id === n.id)
                      .attr('fill', nodeColors.both)
                      .attr('r', nodeSize * 1.1)
                      .attr('stroke-width', 1.5);
                  }
                }
                
                // Collect bounds
                if (n.x !== undefined && n.y !== undefined) {
                  if (n.x < minX) minX = n.x;
                  if (n.y < minY) minY = n.y;
                  if (n.x > maxX) maxX = n.x;
                  if (n.y > maxY) maxY = n.y;
                }
              } catch (e) {
                console.error("Error processing node on simulation end:", e);
              }
            });
            
            // Add padding
            const padding = 80;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
            
            // Find centroid - original Obsidian-style centering
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            
            // Determine safe zoom level with a much lower scale to show more of the graph
            const dx = maxX - minX;
            const dy = maxY - minY;
            // Lower scale value (0.6 instead of 0.9) to show much more of the graph
            const scale = 0.6 / Math.max(dx / width, dy / height);
            
            // Create center transform with original Obsidian-style positioning
            const transform = d3.zoomIdentity
              .translate(width/2, height/2)
              .scale(scale)
              .translate(-centerX, -centerY);
              
            // Apply transform with smooth transition
            svg.transition()
              .duration(750)
              .call(zoom.transform, transform);
          } catch (e) {
            console.error("Error in simulation end event:", e);
          }
        });
      }
    };
    
    renderGraph();

    // Cleanup function
    return () => {
      if (graphRef.current) {
        d3.select(graphRef.current).selectAll('*').remove();
      }
    };
  }, [processedData, effectiveDocId, isContextual]);
  
  // Define drag behavior for nodes
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      if (event.subject.id !== effectiveDocId) { // Don't unpin current node
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
    
    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  // Return just the container for the graph
  return (
    <div 
      ref={graphRef} 
      style={{ 
        width: '100%', 
        height: isContextual ? '300px' : '100%', 
        overflow: 'hidden',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}
    />
  );
}