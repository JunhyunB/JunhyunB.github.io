import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// Helper function to preprocess graph data and merge index/non-index variants
function preprocessGraphData(graphData) {
  if (!graphData || !Array.isArray(graphData)) return graphData;
  
  // Create a map to collect nodes that should be merged
  const nodeMap = new Map();
  const processedNodes = [];
  
  // Normalize an ID by removing /index suffix
  const normalizeId = (id) => {
    if (!id) return '';
    return id.replace(/\/index$/, '');
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
        referencedBy: new Set()
      });
    }
    
    // Add this node to the group
    const group = nodeMap.get(normalizedId);
    group.nodes.push(node);
    
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
    // Use the most specific node as the primary one (usually the one with /index)
    const primaryNode = group.nodes.sort((a, b) => b.id.length - a.id.length)[0];
    
    // Create a merged node
    const mergedNode = {
      ...primaryNode,
      id: normalizedId, // Use the normalized ID
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
  
  console.log(`SimpleGraphView - Preprocessed graph data: ${graphData.length} nodes -> ${processedNodes.length} nodes`);
  
  // Debug log to help identify bidirectional links
  processedNodes.forEach(node => {
    if (Array.isArray(node.linkTo) && Array.isArray(node.referencedBy)) {
      const bidirectionalNodes = node.linkTo.filter(target => 
        node.referencedBy.includes(target)
      );
      
      if (bidirectionalNodes.length > 0) {
        console.log(`SimpleGraphView - Node ${node.id} has bidirectional links with:`, bidirectionalNodes);
      }
    }
  });
  
  return processedNodes;
}

export default function SimpleGraphView({ graphData, currentDocId, isContextual }) {
  const graphRef = useRef(null);
  
  // Preprocess graph data to merge index/non-index variants
  const processedGraphData = useMemo(() => preprocessGraphData(graphData), [graphData]);
  
  // Helper to extract simple ID from full path
  const getSimpleId = (id) => {
    // Extract just the filename part without extension
    const parts = id.split('/');
    return parts[parts.length - 1].replace(/\.(md|mdx)$/, '');
  };
  
  // Helper to normalize paths consistently with DocGraphView.js
  const normalizePath = (path) => {
    if (!path) return '';
    
    console.log("SimpleGraphView - Normalizing path:", path);
    
    // Remove leading/trailing slashes
    let normalized = path.replace(/^\/+|\/+$/g, '');
    
    // Remove /docs/ prefix if present
    normalized = normalized.replace(/^docs\//, '');
    
    // Handle index path variants
    if (normalized.endsWith('/index')) {
      normalized = normalized.replace(/\/index$/, '');
    }
    
    console.log("SimpleGraphView - After normalization:", normalized);
    return normalized;
  };

  // Find related documents with robust error handling
  const findRelatedDocs = () => {
    // Check for missing data
    if (!processedGraphData || !Array.isArray(processedGraphData) || processedGraphData.length === 0) {
      console.warn('No graph data available');
      return { current: null, outgoing: [], incoming: [] };
    }
    
    if (!currentDocId) {
      console.warn('No current document ID provided');
      return { current: null, outgoing: [], incoming: [] };
    }
    
    console.log("SimpleGraphView - Finding match for:", currentDocId);
    console.log("SimpleGraphView - Current URL (for detection):", window.location.pathname);
    
    // Try different matching strategies
    let currentDoc = null;
    
    // Normalize the current docId for consistent comparison
    const normalizedDocId = normalizePath(currentDocId);
    console.log("SimpleGraphView - Normalized current docId:", normalizedDocId);
    
    // Create index variants for better matching
    const indexVariants = [
      normalizedDocId,
      normalizedDocId + '/index',
      normalizedDocId.replace(/\/index$/, '')
    ];
    
    // Track candidate matches with scores
    const candidateMatches = [];
    
    // PASS 1: Try exact matches
    for (const doc of graphData) {
      const normalizedItemId = normalizePath(doc.id);
      
      // Check exact match
      if (normalizedItemId === normalizedDocId) {
        console.log("SimpleGraphView - Found exact match:", doc.id);
        candidateMatches.push({ doc, score: 100 });
      }
      
      // Check index variants
      for (const variant of indexVariants) {
        if (variant !== normalizedDocId && normalizedItemId === variant) {
          console.log(`SimpleGraphView - Found match with index variant "${variant}":`, doc.id);
          candidateMatches.push({ doc, score: 90 });
        }
      }
    }
    
    // PASS 2: Try with simple ID if no exact match
    if (candidateMatches.length === 0) {
      const simpleCurrentId = getSimpleId(currentDocId);
      console.log("SimpleGraphView - Trying simple ID match with:", simpleCurrentId);
      
      for (const doc of graphData) {
        if (getSimpleId(doc.id) === simpleCurrentId) {
          console.log("SimpleGraphView - Found match by simple ID:", doc.id);
          candidateMatches.push({ doc, score: 80 });
        }
      }
    }
    
    // PASS 3: Try substring matching as last resort
    if (candidateMatches.length === 0) {
      for (const doc of graphData) {
        const normalizedItemId = normalizePath(doc.id);
        
        // Check if one contains the other
        if (normalizedDocId.includes(normalizedItemId)) {
          console.log("SimpleGraphView - Found container match (doc contains item):", doc.id);
          candidateMatches.push({ 
            doc, 
            score: 60 + (normalizedItemId.length / normalizedDocId.length) * 10 
          });
        } 
        else if (normalizedItemId.includes(normalizedDocId)) {
          console.log("SimpleGraphView - Found contained match (item contains doc):", doc.id);
          candidateMatches.push({ 
            doc, 
            score: 50 + (normalizedDocId.length / normalizedItemId.length) * 10 
          });
        }
      }
    }
    
    // Use the best match
    if (candidateMatches.length > 0) {
      candidateMatches.sort((a, b) => b.score - a.score);
      currentDoc = candidateMatches[0].doc;
      console.log('SimpleGraphView - Using best match:', currentDoc.id, 'with score:', candidateMatches[0].score);
    } else {
      console.warn(`SimpleGraphView - Current document "${currentDocId}" not found in graph using any matching method`);
      return { current: null, outgoing: [], incoming: [] };
    }
    
    console.log('SimpleGraphView - Found matching document in graph:', currentDoc.id);
    
    // Get outgoing links with null safety
    const outgoing = Array.isArray(currentDoc.linkTo) ? currentDoc.linkTo : [];
    
    // Get incoming links (referenced by) with null safety
    const incoming = Array.isArray(currentDoc.referencedBy) ? currentDoc.referencedBy : [];
    
    // Find the actual docs for these links with null safety
    const relatedDocs = {
      current: currentDoc,
      outgoing: outgoing
        .map(id => graphData.find(doc => doc.id === id))
        .filter(doc => doc !== null && doc !== undefined),
      incoming: incoming
        .map(id => graphData.find(doc => doc.id === id))
        .filter(doc => doc !== null && doc !== undefined)
    };
    
    return relatedDocs;
  };
  
  useEffect(() => {
    // Safety check for DOM element
    if (!graphRef.current) {
      console.warn('Graph container ref not available');
      return;
    }
    
    // Safety check for graph data
    if (!processedGraphData || !Array.isArray(processedGraphData)) {
      console.warn('Graph data not available or not an array');
      displayFallbackMessage('Loading graph data...');
      return;
    }
    
    // Clear previous graph
    const container = graphRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Get related documents with error handling
    const relatedDocs = findRelatedDocs();
    
    // Handle no current document case
    if (!relatedDocs || !relatedDocs.current) {
      console.warn('No matching document found in processed graph data for:', currentDocId);
      displayFallbackMessage('No document relationships found');
      return;
    }
    
    // Handle no relationships case
    if (relatedDocs.outgoing.length === 0 && relatedDocs.incoming.length === 0) {
      console.log('Document found but has no relationships:', relatedDocs.current.id);
      displayFallbackMessage('This document has no connections to other documents');
      return;
    }
    
    // Get container dimensions with safety fallbacks
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;
    
    // Helper function to display fallback message
    function displayFallbackMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.innerText = message;
      messageDiv.style.textAlign = 'center';
      messageDiv.style.padding = '20px';
      messageDiv.style.color = 'var(--ifm-color-primary)';
      messageDiv.style.fontStyle = 'italic';
      container.appendChild(messageDiv);
    }
    
    // Helper function to navigate to document page when clicked
    function navigateToDocument(docId) {
      if (!docId) return;
      
      console.log("SimpleGraphView - Generating URL for node:", docId);
      
      // If already on this page, don't navigate
      if (docId === currentDocId) {
        console.log('SimpleGraphView - Already on this page, not navigating');
        return;
      }
      
      // First check if this is a graph data node ID (which may need adjustment)
      const isGraphDataId = graphData.some(node => node.id === docId);
      console.log("SimpleGraphView - Is this a graph data node ID?", isGraphDataId);
      
      // General approach to handle nested paths correctly
      let fullDocPath = docId;
      
      // Debug log - print detailed info about what we're trying to match
      console.log("SimpleGraphView - DEBUG - MATCHING NODE:", {
        docId,
        graphDataSize: processedGraphData.length,
        graphDataSample: processedGraphData.slice(0, 3).map(n => n.id),
        availableNodes: processedGraphData.map(n => n.id),
        sampleNodeDetail: processedGraphData[0]
      });
      
      // Look for the node in the processed graph data to get its full path
      // This is more reliable than hardcoding specific paths
      const exactNode = processedGraphData.find(node => node.id === docId);
      if (exactNode) {
        // If we find an exact match, use that ID
        fullDocPath = exactNode.id;
        console.log("SimpleGraphView - Found exact node match, using path:", fullDocPath);
      } else {
        console.log("SimpleGraphView - No exact match found, trying partial matches");
        
        // Apply a systematic path resolution approach
        {
          // Enhanced path resolution algorithm - aligned with DocGraphView.js
          console.log("SimpleGraphView - Starting enhanced path resolution for:", docId);
          
          // 1. Direct parent-child relationship matches
          const directPathMatches = processedGraphData.filter(node => {
            // Check if node is a potential parent directory of our target
            const isParentOf = node.id.endsWith('/') && docId.startsWith(node.id);
            
            // Check if node is a child of our target
            const isChildOf = node.id.includes('/') && 
                             node.id.startsWith(docId + '/');
            
            // Check if node contains the target as a leaf segment
            const containsAsLeaf = node.id.endsWith('/' + docId);
            
            // Check if node is part of the same section with target
            const sameSection = docId.includes('/') && node.id.includes('/') &&
                               node.id.split('/')[0] === docId.split('/')[0];
            
            const match = isParentOf || isChildOf || containsAsLeaf || sameSection;
            
            if (match) {
              console.log("SimpleGraphView - Found direct relationship match:", node.id);
            }
            
            return match;
          });
          
          // 2. Content-based section detection
          // Look for nodes that have similar path prefixes
          const sectionMatches = [];
          if (docId.includes('/')) {
            const sectionPrefix = docId.split('/')[0];
            const sectionMembers = processedGraphData.filter(node => 
              node.id.startsWith(sectionPrefix + '/') && node.id !== docId
            );
            
            if (sectionMembers.length > 0) {
              console.log(`SimpleGraphView - Found ${sectionMembers.length} nodes in section "${sectionPrefix}"`);
              sectionMatches.push(...sectionMembers);
            }
          }
          
          // 3. Use graph link relationships
          // Find nodes that have direct links with our target node in the graph
          const linkBasedMatches = processedGraphData.filter(node => {
            // Check if this node links to our target
            const linksToTarget = Array.isArray(node.linkTo) && 
                                 node.linkTo.some(id => id === docId || id.endsWith('/' + docId));
            
            // Check if our target links to this node
            const targetLinksToThis = Array.isArray(node.referencedBy) && 
                                     node.referencedBy.some(id => id === docId || id.endsWith('/' + docId));
            
            const match = linksToTarget || targetLinksToThis;
            
            if (match) {
              console.log("SimpleGraphView - Found link-based match:", node.id);
            }
            
            return match;
          });
          
          // 4. Partial string matching as fallback
          const partialMatches = processedGraphData.filter(node => {
            if (node.id === docId) return false; // Skip exact match (already handled)
            
            // More sophisticated matching than before
            const match = node.id.endsWith('/' + docId) || 
                        node.id.includes('/' + docId + '/') ||
                        (docId.includes('/') && node.id.includes('/') && 
                         docId.endsWith('/' + node.id.split('/').pop())) ||
                        (node.id.split('/').some(segment => 
                          docId.split('/').includes(segment) && segment.length > 3));
            
            if (match) {
              console.log("SimpleGraphView - Found partial string match:", node.id);
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
          
          console.log("SimpleGraphView - Found", uniqueMatches.length, "total potential matches");
          
          if (uniqueMatches.length > 0) {
            const bestMatch = uniqueMatches[0].node;
            
            // Path reconstruction based on match type
            if (bestMatch.id.endsWith('/' + docId)) {
              // Match is a parent containing the target as leaf segment
              fullDocPath = bestMatch.id;
            } else if (docId.includes('/') && bestMatch.id.includes('/') &&
                      bestMatch.id.split('/')[0] === docId.split('/')[0]) {
              // They share the same root section
              if (bestMatch.id.split('/').length > docId.split('/').length) {
                // Best match has more segments, likely a more specific path
                const segments = bestMatch.id.split('/');
                const targetSegment = docId.split('/').pop();
                // Replace the last segment with our target
                segments[segments.length - 1] = targetSegment;
                fullDocPath = segments.join('/');
              } else {
                // Use the best match as a template but keep our docId
                fullDocPath = docId;
              }
            } else {
              // Default case - use the best match's path
              fullDocPath = bestMatch.id;
            }
            
            console.log("SimpleGraphView - Using best match:", bestMatch.id);
            console.log("SimpleGraphView - Resolved to path:", fullDocPath);
          }
        }
      }
      
      // Always preserve the full path structure
      let url = '/docs/' + fullDocPath;
      
      // Debug log the path transformation
      console.log(`SimpleGraphView - Path transformation: ${docId} -> ${fullDocPath} -> ${url}`);
      
      // Handle index pages - remove the trailing "index" for cleaner URLs
      if (url.endsWith('/index')) {
        console.log("SimpleGraphView - Index page detected, adjusting URL");
        url = url.replace(/\/index$/, '');
        url += '/'; // Add trailing slash for index pages
      }
      
      // Check for section indices where we need a trailing slash
      if (isGraphDataId && !url.endsWith('/') && !url.endsWith('.md') && !url.endsWith('.mdx')) {
        // Check if it's potentially a section index (has children)
        const node = graphData.find(n => n.id === docId);
        if (node && node.linkTo && node.linkTo.length > 0) {
          const childrenIds = node.linkTo;
          const isParentNode = childrenIds.some(childId => 
            childId.startsWith(docId + '/') || childId === docId + '/index'
          );
          
          if (isParentNode) {
            console.log("SimpleGraphView - Section index detected, adding trailing slash");
            url += '/';
          }
        }
      }
      
      console.log(`SimpleGraphView - Navigating to document: ${docId} with URL: ${url}`);
      
      // For greater reliability in handling navigation, create a real anchor element
      const a = document.createElement('a');
      a.href = url;
      a.target = '_self';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    // Create SVG with zoom functionality
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
      
    // Add a group for zoom transformation
    const graphGroup = svg.append('g')
      .attr('class', 'graph-container');
      
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4]) // Allow zooming from 0.5x to 4x
      .on('zoom', (event) => {
        graphGroup.attr('transform', event.transform);
      });
    
    // Apply zoom behavior to SVG
    svg.call(zoom);
    
    // Add double-click to reset zoom
    svg.on('dblclick.zoom', () => {
      svg.transition()
        .duration(300)
        .call(zoom.transform, d3.zoomIdentity);
    });
    
    // Define node colors with improved visual hierarchy
    const nodeColors = {
      current: '#E63946', // Current doc - bright red
      outgoing: '#457B9D', // Outgoing links - blue
      incoming: '#2A9D8F', // Incoming links - teal
      both: '#F4A261',    // Both outgoing and incoming - orange
      unrelated: '#A8DADC', // Other nodes - light blue
      placeholder: '#C0C0C0' // Placeholder nodes - gray
    };
    
    // Custom node sizes for different types (larger for current document)
    const nodeSizes = {
      current: 12,
      outgoing: 8,
      incoming: 8,
      both: 10,
      unrelated: 6,
      placeholder: 6 // Placeholder nodes - same as unrelated but with different appearance
    };
    
    // Calculate positions
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    // Helper to check if a doc is in both incoming and outgoing with null safety
    const isInBoth = (doc) => {
      // Check if doc and doc.id exist
      if (!doc || !doc.id) {
        return false;
      }
      
      // Check if doc is a placeholder
      if (doc.isPlaceholder) {
        return false; // Placeholder nodes are never considered "both"
      }
      
      // Normalize doc ID to compare with normalized IDs
      const normalizeId = (id) => id ? id.replace(/\/index$/, '') : '';
      const normalizedDocId = normalizeId(doc.id);
      
      // Check if outgoing array has this doc (using normalized ID comparison)
      const isInOutgoing = Array.isArray(relatedDocs.outgoing) && 
        relatedDocs.outgoing.some(d => d && normalizeId(d.id) === normalizedDocId && !d.isPlaceholder);
      
      // Check if incoming array has this doc (using normalized ID comparison)
      const isInIncoming = Array.isArray(relatedDocs.incoming) && 
        relatedDocs.incoming.some(d => d && normalizeId(d.id) === normalizedDocId && !d.isPlaceholder);
      
      // Explicitly log bidirectional link detection
      if (isInOutgoing && isInIncoming) {
        console.log(`SimpleGraphView - Detected bidirectional link for node: ${doc.id}`);
      }
      
      // Must be in both
      return isInOutgoing && isInIncoming;
    };
    
    // Helper to check if a doc is a placeholder
    const isPlaceholder = (doc) => {
      return doc && doc.isPlaceholder === true;
    };
    
    // Create nodes array with positioning info
    const nodes = [];
    
    // Calculate initial positions for better label placement 
    // with more space to avoid clipping
    const graphCenterX = width / 2;
    const graphCenterY = height / 2;
    // 그래프 반지름을 컨테이너의 80%로 설정하되, 노드가 잘리지 않도록 약간 줄임
    const graphRadius = Math.min(width, height) * 0.32;
    
    // Add current document with safety checks
    if (relatedDocs.current && relatedDocs.current.id) {
      nodes.push({
        ...relatedDocs.current,
        x: graphCenterX,
        y: graphCenterY,
        originalX: graphCenterX,
        originalY: graphCenterY,
        type: 'current',
        // Ensure title is available
        title: relatedDocs.current.title || relatedDocs.current.id || 'Current Document'
      });
    } else {
      console.warn('Missing current document data, creating placeholder');
      // Create placeholder node if needed
      nodes.push({
        id: currentDocId || 'current',
        title: 'Current Document',
        type: 'current',
        x: graphCenterX,
        y: graphCenterY,
        originalX: graphCenterX,
        originalY: graphCenterY
      });
    }
    
    // 일관성 있는 그래프 렌더링을 위해 outgoingDocs와 incomingDocs를 항상 표시
    const outgoingDocs = Array.isArray(relatedDocs.outgoing) ? relatedDocs.outgoing : [];
    const incomingDocs = Array.isArray(relatedDocs.incoming) ? relatedDocs.incoming : [];
    
    // 링크가 아예 없는 경우 가짜 노드 추가 (첫 페이지 로드 시 빈 그래프 방지)
    if (outgoingDocs.length === 0 && incomingDocs.length === 0) {
      console.log('No connections found, adding placeholder nodes for visualization');
      
      // graphData에서 다른 노드들을 샘플로 가져와 표시
      if (Array.isArray(graphData) && graphData.length > 1) {
        // 현재 문서가 아닌 다른 문서 중 최대 4개 선택
        const otherDocs = graphData
          .filter(doc => doc.id !== currentDocId)
          .slice(0, 4);
          
        console.log(`Adding ${otherDocs.length} placeholder nodes for visualization`);
        
        // 가짜 연결 정보 추가
        otherDocs.forEach(doc => {
          // 임의로 반은 outgoing, 반은 incoming으로 설정
          const idx = otherDocs.indexOf(doc);
          
          // 플레이스홀더 속성 추가
          const docWithPlaceholder = {
            ...doc,
            isPlaceholder: true
          };
          
          if (idx % 2 === 0) {
            if (!relatedDocs.outgoing) relatedDocs.outgoing = [];
            relatedDocs.outgoing.push(docWithPlaceholder);
          } else {
            if (!relatedDocs.incoming) relatedDocs.incoming = [];
            relatedDocs.incoming.push(docWithPlaceholder);
          }
        });
      }
    }
    
    // 업데이트된 컬렉션으로 다시 가져오기
    const updatedOutgoingDocs = Array.isArray(relatedDocs.outgoing) ? relatedDocs.outgoing : [];
    const outgoingCount = updatedOutgoingDocs.length;
    
    updatedOutgoingDocs.forEach((doc, i) => {
      if (!doc || !doc.id) {
        console.warn('Invalid outgoing document found, skipping', doc);
        return;
      }
      
      // Determine node type
      let type;
      if (isPlaceholder(doc)) {
        type = 'placeholder';
      } else if (isInBoth(doc)) {
        type = 'both';
      } else {
        type = 'outgoing';
      }
      
      // Calculate position in a half-circle on the right
      const angle = (Math.PI / (outgoingCount + 1)) * (i + 1);
      // Add small variation for placeholder nodes to avoid perfect alignment
      const radiusAdjustment = isPlaceholder(doc) ? 0.9 + Math.random() * 0.2 : 1;
      const x = graphCenterX + graphRadius * radiusAdjustment * Math.sin(angle);
      const y = graphCenterY - graphRadius * radiusAdjustment * Math.cos(angle);
      
      // Only add if not already in the nodes array
      if (!nodes.some(n => n.id === doc.id)) {
        nodes.push({
          ...doc,
          x,
          y,
          originalX: x,
          originalY: y,
          type,
          // Ensure these properties exist for display
          title: doc.title || doc.id || 'Unnamed Document'
        });
      }
    });
    
    // Add incoming documents (left side half-circle)
    // incomingDocs는 위에서 이미 정의됨
    const updatedIncomingDocs = Array.isArray(relatedDocs.incoming) ? relatedDocs.incoming : [];
    const incomingCount = updatedIncomingDocs.length;
    
    updatedIncomingDocs.forEach((doc, i) => {
      if (!doc || !doc.id) {
        console.warn('Invalid incoming document found, skipping', doc);
        return;
      }
      
      // Skip if already added
      if (nodes.some(n => n.id === doc.id)) {
        return;
      }
      
      // Determine type - placeholder takes precedence
      const type = isPlaceholder(doc) ? 'placeholder' : 'incoming';
      
      // Calculate position in a half-circle on the left
      const angle = (Math.PI / (incomingCount + 1)) * (i + 1);
      // Add small variation for placeholder nodes to avoid perfect alignment
      const radiusAdjustment = isPlaceholder(doc) ? 0.9 + Math.random() * 0.2 : 1;
      const x = graphCenterX - graphRadius * radiusAdjustment * Math.sin(angle);
      const y = graphCenterY - graphRadius * radiusAdjustment * Math.cos(angle);
      
      nodes.push({
        ...doc,
        x,
        y,
        originalX: x,
        originalY: y,
        type,
        // Ensure these properties exist for display
        title: doc.title || doc.id || 'Unnamed Document'
      });
    });
    
    // Normalize ID helper function - consistent with preprocessing
    const normalizeId = (id) => id ? id.replace(/\/index$/, '') : '';
    
    // Create links between nodes with robust error handling
    const links = [];
    
    // Safety check for current node
    const currentNode = nodes.length > 0 ? nodes[0] : null;
    if (!currentNode) {
      console.warn('Current document node not available for creating links');
      return; // Early return if we don't have a current node
    }
    
    // Links from current to outgoing with validation
    if (Array.isArray(relatedDocs.outgoing)) {
      relatedDocs.outgoing.forEach(doc => {
        if (!doc || !doc.id) {
          console.warn('Invalid outgoing document, skipping link creation', doc);
          return;
        }
        
        // Use normalized ID for matching to handle index variants
        const normalizedDocId = normalizeId(doc.id);
        // Find the target node by normalized ID
        const target = nodes.find(n => normalizeId(n.id) === normalizedDocId);
        
        if (target) {
          links.push({
            source: currentNode,
            target,
            type: 'outgoing'
          });
          console.log(`SimpleGraphView - Created outgoing link: ${currentNode.id} -> ${target.id}`);
        } else {
          console.warn(`Target node not found in visualization for outgoing link: ${doc.id} (normalized: ${normalizedDocId})`);
        }
      });
    }
    
    // Links from incoming to current with validation
    if (Array.isArray(relatedDocs.incoming)) {
      relatedDocs.incoming.forEach(doc => {
        if (!doc || !doc.id) {
          console.warn('Invalid incoming document, skipping link creation', doc);
          return;
        }
        
        // Use normalized ID for matching to handle index variants
        const normalizedDocId = normalizeId(doc.id);
        // Find the source node by normalized ID
        const source = nodes.find(n => normalizeId(n.id) === normalizedDocId);
        
        if (source) {
          links.push({
            source,
            target: currentNode,
            type: 'incoming'
          });
          console.log(`SimpleGraphView - Created incoming link: ${source.id} -> ${currentNode.id}`);
        } else {
          console.warn(`Source node not found in visualization for incoming link: ${doc.id} (normalized: ${normalizedDocId})`);
        }
      });
    }
    
    // Draw links (arrow markers)
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');
      
    // Draw the links inside the graph group with improved styling
    const linkGroup = graphGroup.append('g')
      .attr('class', 'links');
    
    // Define link colors
    const linkColors = {
      outgoing: '#457B9D', // Same as outgoing node color
      incoming: '#2A9D8F', // Same as incoming node color
      both: '#F4A261',     // Same as bidirectional node color
      placeholder: '#C0C0C0' // Gray for placeholder links
    };
    
    linkGroup.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', d => {
        // Check if source or target is a placeholder
        if (d.source.isPlaceholder || d.target.isPlaceholder) {
          return linkColors.placeholder;
        }
        return linkColors[d.type] || '#999';
      })
      .attr('stroke-width', d => {
        // Thinner lines for placeholder links
        return (d.source.isPlaceholder || d.target.isPlaceholder) ? 1 : 1.5;
      })
      .attr('stroke-opacity', d => {
        // More transparent for placeholder links
        return (d.source.isPlaceholder || d.target.isPlaceholder) ? 0.4 : 0.6;
      })
      .attr('stroke-dasharray', d => {
        // Dashed line for placeholders
        return (d.source.isPlaceholder || d.target.isPlaceholder) ? '3,3' : null;
      })
      .attr('marker-end', d => {
        // No arrow for placeholder links
        return (d.source.isPlaceholder || d.target.isPlaceholder) ? null : 'url(#arrowhead)';
      })
      .on('mouseover', function() {
        d3.select(this)
          .attr('stroke-width', 2.5)
          .attr('stroke-opacity', 1)
          .transition()
          .duration(150);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.6)
          .transition()
          .duration(150);
      });
      
    // Create drag behavior for nodes
    const drag = simulation => {
      
      function dragstarted(event, d) {
        // Prevent drag from triggering clicks
        event.sourceEvent.stopPropagation();
        
        // Energize the simulation
        if (!event.active) simulation.alphaTarget(0.3).restart();
        
        // Store original position
        d.fx = d.x;
        d.fy = d.y;
        d.isDragged = true;
        
        // Highlight the node being dragged
        d3.select(this).raise().classed('active', true);
        d3.select(this).select('circle')
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
      }
      
      function dragged(event, d) {
        // Update position during drag
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event, d) {
        // Stop energizing the simulation
        if (!event.active) simulation.alphaTarget(0);
        
        // For non-center nodes, allow them to float free again
        // Keep current node fixed unless in expanded view
        if (d.type !== 'current' || !isContextual) {
          d.fx = null;
          d.fy = null;
        }
        
        // Reset node appearance
        d3.select(this).classed('active', false);
        d3.select(this).select('circle')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
      
    // Set up force simulation with optimized parameters for better label spacing
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          // Customize distances based on relationship type
          if (d.source.type === 'current' || d.target.type === 'current') {
            return 150; // 더 큰 거리로 현재 노드에서 분리
          }
          return 120; // 다른 노드 간 거리도 증가
        })
        .strength(0.6)) // 약간 더 약한 링크 강도로 더 잘 퍼지도록
      .force("charge", d3.forceManyBody()
        .strength(d => {
          // Customize repulsion based on node type
          if (d.type === 'current') {
            return -600; // 현재 노드에서 더 강한 반발력
          }
          return -300; // 다른 노드도 더 강한 반발력
        })
        .distanceMax(400)) // 더 넓은 힘 적용 범위
      .force("center", d3.forceCenter(graphCenterX, graphCenterY))
      .force("collision", d3.forceCollide()
        .radius(d => {
          // 훨씬 더 큰 충돌 반경으로 레이블 사이 공간 확보
          const textLength = d.title ? d.title.length * 5 : 80;
          return Math.max(textLength, d.type === 'current' ? 80 : 60);
        })
        .strength(0.9) // 충돌 강도 증가
        .iterations(3)) // 더 많은 반복으로 충돌 감지 정확도 향상
      .force("x", d3.forceX(graphCenterX).strength(0.03)) // 중앙으로 약한 힘
      .force("y", d3.forceY(graphCenterY).strength(0.03)) // 중앙으로 약한 힘
      .alphaDecay(0.02) // 더 느린 감쇠로 시뮬레이션이 더 오래 계속되도록
      .alphaMin(0.0005); // 더 낮은 최소값으로 더 많은 반복 가능
      
    // Create a container for nodes in the graph group
    const nodesContainer = graphGroup.append('g')
      .attr('class', 'nodes');
      
    // Draw nodes with interactivity and proper force simulation
    const nodeGroup = nodesContainer.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(drag(simulation)) // Make nodes draggable with simulation
      .on('click', (event, d) => {
        // Prevent default action
        event.preventDefault();
        event.stopPropagation();
        
        // Don't navigate if it's the current page
        if (d.type === 'current') return;
        
        // Navigate to the document
        navigateToDocument(d.id);
      })
      .style('cursor', d => d.type === 'current' ? 'default' : 'pointer');
      
    // Add tick function to update positions
    simulation.on("tick", () => {
      // Update link positions
      linkGroup.selectAll('.link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      // Update node positions
      nodeGroup.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });
    
    // Pin the current document node to center
    if (nodes.length > 0) {
      // Find current node (should be first one)
      const currentNode = nodes.find(n => n.type === 'current');
      if (currentNode) {
        // Set fixed position for current document node
        currentNode.fx = graphCenterX;
        currentNode.fy = graphCenterY;
        
        // For non-contextual view (full graph), we might want to release this constraint
        if (!isContextual) {
          // Start with fixed position but allow some movement
          simulation.on("end", () => {
            // After initial positioning, allow the current node to move if dragged
            setTimeout(() => {
              if (!currentNode.isDragged) {
                currentNode.fx = null;
                currentNode.fy = null;
                // But keep it near center with a light force
                simulation.force("centerCurrentNode", d3.forceRadial(0, graphCenterX, graphCenterY)
                  .strength(d => d.type === 'current' ? 0.5 : 0)
                );
                simulation.alpha(0.3).restart(); // Gently restart simulation
              }
            }, 1500); // Wait for initial settling
          });
        }
      }
    }
    
    // Run the simulation with a short warmup
    simulation.alpha(1).restart();
      
    // Node circles with safety, improved sizing, and hover effects
    nodeGroup.append('circle')
      .attr('r', d => {
        // Use the size table for different node types
        if (!d || !d.type || !nodeSizes[d.type]) {
          return nodeSizes.unrelated || 6;
        }
        return nodeSizes[d.type];
      })
      .attr('fill', d => {
        // Default color if type is missing or invalid
        if (!d || !d.type || !nodeColors[d.type]) {
          return nodeColors.unrelated || '#cccccc';
        }
        return nodeColors[d.type];
      })
      .attr('stroke', d => d.type === 'placeholder' ? '#ddd' : '#fff') // Different stroke for placeholders
      .attr('stroke-width', d => d.type === 'placeholder' ? 1 : 1.5) // Thinner stroke for placeholders
      .attr('opacity', d => d.type === 'placeholder' ? 0.7 : 1) // More transparent for placeholders
      .style('filter', d => d.type === 'placeholder' ? 
        'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))' : 
        'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))') // Less shadow for placeholders
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', d.type === 'placeholder' ? '#bbb' : '#333')
          .attr('stroke-width', d.type === 'placeholder' ? 1.5 : 2)
          .attr('opacity', d.type === 'placeholder' ? 0.85 : 1) // Slightly increased opacity on hover
          .attr('r', r => {
            // Increase radius on hover - less for placeholders
            const currentR = d && d.type && nodeSizes[d.type] ? 
              nodeSizes[d.type] : nodeSizes.unrelated || 6;
            return currentR + (d.type === 'placeholder' ? 1 : 2);
          })
          .style('filter', d.type === 'placeholder' ? 
            'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))' :
            'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))')
          .transition()
          .duration(150);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('stroke', d.type === 'placeholder' ? '#ddd' : '#fff')
          .attr('stroke-width', d.type === 'placeholder' ? 1 : 1.5)
          .attr('opacity', d.type === 'placeholder' ? 0.7 : 1) // Reset opacity
          .attr('r', () => {
            // Restore original radius
            return d && d.type && nodeSizes[d.type] ? 
              nodeSizes[d.type] : nodeSizes.unrelated || 6;
          })
          .style('filter', d.type === 'placeholder' ? 
            'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))' : 
            'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))')
          .transition()
          .duration(150);
      });
      
    // Calculate label positions to avoid overlaps
    // First create a simulation just for label positioning
    const labelPositionSimulation = d3.forceSimulation(nodes)
      .force('collide', d3.forceCollide().radius(50).strength(0.5))
      .force('x', d3.forceX(d => d.x).strength(0.2))
      .force('y', d3.forceY(d => d.y).strength(0.2))
      .stop();
    
    // Run the simulation a bit
    for (let i = 0; i < 30; i++) {
      labelPositionSimulation.tick();
    }
    
    // Create background for text labels (improves readability)
    nodeGroup.append('rect')
      .attr('class', 'label-background')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', d => {
        // Different background colors for different node types
        switch(d.type) {
          case 'current': return 'rgba(255, 245, 245, 0.9)'; // Light red tint
          case 'incoming': return 'rgba(240, 255, 250, 0.9)'; // Light teal tint
          case 'outgoing': return 'rgba(240, 250, 255, 0.9)'; // Light blue tint
          case 'both': return 'rgba(255, 250, 240, 0.9)'; // Light orange tint
          case 'placeholder': return 'rgba(245, 245, 245, 0.8)'; // Very light gray for placeholders
          default: return 'rgba(255, 255, 255, 0.9)';
        }
      })
      .attr('stroke', d => {
        // Subtle border matching node color
        switch(d.type) {
          case 'current': return '#E63946';
          case 'incoming': return '#2A9D8F';
          case 'outgoing': return '#457B9D';
          case 'both': return '#F4A261';
          case 'placeholder': return '#C0C0C0'; // Light gray for placeholders
          default: return '#ddd';
        }
      })
      .attr('stroke-opacity', d => d.type === 'placeholder' ? 0.2 : 0.3) // Even lighter stroke for placeholders
      .attr('stroke-width', d => d.type === 'placeholder' ? 0.5 : 1) // Thinner stroke for placeholders
      .attr('width', 0)  // Will be set after text width is calculated
      .attr('height', d => d.type === 'placeholder' ? 20 : 22) // Slightly smaller for placeholders
      .attr('x', d => d.type === 'incoming' || d.type === 'placeholder' ? -15 : 15)
      .attr('y', -12) // Moved up slightly
      .style('visibility', 'hidden');
    
    // Improved node text labels with anti-collision
    const labels = nodeGroup.append('text')
      .attr('class', 'node-label')
      .attr('dx', d => {
        // Position based on node type and calculated collision-free position
        const baseOffset = d.type === 'incoming' || d.type === 'placeholder' ? -15 : 15;
        // Only apply small adjustments to avoid text jumping too far
        const adjustment = Math.min(10, Math.max(-10, (d.x - d.originalX) || 0));
        return baseOffset + adjustment;
      })
      .attr('dy', d => {
        // Small vertical adjustment based on simulation
        return 4 + (Math.min(5, Math.max(-5, (d.y - d.originalY) || 0)));
      })
      .attr('text-anchor', d => d.type === 'incoming' || d.type === 'placeholder' ? 'end' : 'start')
      .style('font-size', d => d.type === 'placeholder' ? '11px' : '12px') // Smaller font for placeholders
      .style('font-weight', d => d.type === 'current' ? 'bold' : 'normal')
      .style('font-style', d => d.type === 'placeholder' ? 'italic' : 'normal') // Italic for placeholders
      .style('fill', d => {
        if (d.type === 'placeholder') return 'var(--ifm-color-gray-600)'; // Lighter gray for placeholders
        if (d.type === 'current') return 'var(--ifm-font-color-base)'; 
        return 'var(--ifm-color-emphasis-700)';
      })
      .style('opacity', d => d.type === 'placeholder' ? 0.8 : 0.95) // More transparent for placeholders
      .style('pointer-events', 'none') // Make text not interfere with clicks
      .style('user-select', 'none') // Prevent text selection
      .style('text-shadow', '0 1px 1px rgba(255,255,255,0.7)') // Improve legibility
      .text(d => {
        // Ensure we have a valid label
        if (!d) return 'Unknown';
        // Use title, then try to format the ID nicely
        if (d.title) return d.title;
        if (d.id) {
          // Format the ID: remove file extension, convert dashes to spaces, capitalize
          const formattedId = d.id
            .replace(/\.(md|mdx)$/, '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          return formattedId;
        }
        return 'Unnamed';
      })
      .each(function(d) {
        // Truncate long labels
        const text = d3.select(this);
        const textLength = text.node().getComputedTextLength();
        const maxLength = 150; // Maximum text length in pixels
        
        if (textLength > maxLength) {
          // Get the text content
          let fullText = text.text();
          // Truncate and add ellipsis
          let truncatedText = fullText.substring(0, Math.floor(fullText.length * (maxLength / textLength) - 3)) + '...';
          text.text(truncatedText);
        }
        
        // Update the background rectangle to match text width
        const node = d3.select(text.node().parentNode);
        const newTextLength = text.node().getComputedTextLength();
        const padding = 8; // 패딩 증가
        
        node.select('.label-background')
          .attr('width', newTextLength + padding * 2)
          .attr('x', d.type === 'incoming' ? 
            -newTextLength - padding * 2 - 10 : // 왼쪽 텍스트는 더 많은 공간
            10) // 오른쪽 텍스트에도 더 많은 공간
          .style('visibility', 'visible');
          
        // 배경 사각형을 다시 맨 앞으로 가져오는 대신 레이어 순서를 조정
        node.selectAll('circle').raise(); // 원을 텍스트 배경 위로
        node.selectAll('text').raise(); // 텍스트를 맨 위로
      });
      
    // Add tooltips with improved translations
    nodeGroup.append('title')
      .text(d => {
        if (!d) return 'Unknown Document';
        
        const docName = d.title || d.id || 'Unnamed Document';
        let relationshipLabel = '';
        
        // Add relationship type description in both Korean and English
        switch(d.type) {
          case 'current':
            relationshipLabel = '(Current Document / 현재 문서)';
            break;
          case 'incoming':
            relationshipLabel = '(Links to Current Document / 현재 문서로 링크)';
            break;
          case 'outgoing':
            relationshipLabel = '(Linked from Current Document / 현재 문서가 링크)';
            break;
          case 'both':
            relationshipLabel = '(Bidirectional Link / 양방향 링크)';
            break;
          case 'placeholder':
            relationshipLabel = '(Placeholder - No actual connection / 플레이스홀더 - 실제 연결 없음)';
            break;
          default:
            relationshipLabel = '';
        }
        
        return `${docName} ${relationshipLabel}`;
      });
  }, [graphData, currentDocId, isContextual]);
  
  // useEffect hook to handle resize and cleanup
  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (graphRef.current) {
        // Simply re-render the component when window is resized
        setGraphKey(prevKey => prevKey + 1);
      }
    };
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // State to force re-render on resize
  const [graphKey, setGraphKey] = React.useState(0);
  
  return (
    <div 
      key={graphKey}
      ref={graphRef} 
      style={{ 
        width: '100%', 
        height: isContextual ? '250px' : '100%', 
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '8px',
        backgroundColor: 'var(--ifm-background-surface-color)'
      }}
    >
      {isContextual && (
        <div style={{
          position: 'absolute',
          bottom: '5px',
          right: '5px',
          padding: '3px 6px',
          fontSize: '10px',
          color: 'var(--ifm-color-gray-600)',
          backgroundColor: 'var(--ifm-color-gray-100)',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          Drag nodes • Scroll to zoom • Double-click to reset
        </div>
      )}
    </div>
  );
}