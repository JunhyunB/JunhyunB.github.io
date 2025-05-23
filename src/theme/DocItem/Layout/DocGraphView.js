import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  normalizeId, 
  generateDocUrl, 
  deduplicateGraphData, 
  findCurrentDocument,
  getNodeType,
  createSafeNode,
  createSafeLink,
  safeGet
} from './graphUtils';

// Configuration constants
const CONFIG = {
  nodeColors: {
    current: '#E63946',
    outgoing: '#457B9D',
    incoming: '#2A9D8F',
    both: '#F4A261',
    unrelated: '#A8DADC',
    placeholder: '#C0C0C0'
  },
  contextual: {
    linkDistance: 140,
    chargeStrength: -500,
    nodeSize: 16,
    labelSize: '13px'
  },
  full: {
    linkDistance: 220,
    chargeStrength: -1000,
    nodeSize: 20,
    labelSize: '14px',
    maxNodes: 150
  }
};

export default function DocGraphView({ graphData, currentDocId, isContextual }) {
  const graphRef = useRef(null);
  const tooltipRef = useRef(null);
  const simulationRef = useRef(null);
  
  // Preprocess and deduplicate graph data
  const processedGraphData = useMemo(() => {
    if (!graphData || !Array.isArray(graphData)) return [];
    return deduplicateGraphData(graphData);
  }, [graphData]);
  
  // Find the current document
  const effectiveDocId = useMemo(() => {
    const doc = findCurrentDocument(currentDocId, processedGraphData);
    return doc ? doc.id : null;
  }, [currentDocId, processedGraphData]);
  
  // Process data for visualization
  const processedData = useMemo(() => {
    if (!processedGraphData.length || !effectiveDocId) {
      return { nodes: [], links: [] };
    }
    
    try {
      // For contextual view, show only related documents
      if (isContextual) {
        const currentDoc = processedGraphData.find(d => d.id === effectiveDocId);
        if (!currentDoc) return { nodes: [], links: [] };
        
        // Get related node IDs
        const relatedIds = new Set([effectiveDocId]);
        
        // Add outgoing links
        const outgoingIds = safeGet(currentDoc, 'linkTo', []);
        outgoingIds.forEach(id => relatedIds.add(id));
        
        // Add incoming links
        const incomingIds = safeGet(currentDoc, 'referencedBy', []);
        incomingIds.forEach(id => relatedIds.add(id));
        
        // Add second-degree connections for richer context
        [...relatedIds].forEach(nodeId => {
          if (nodeId === effectiveDocId) return;
          const node = processedGraphData.find(d => d.id === nodeId);
          if (node) {
            // Add some of their connections
            safeGet(node, 'linkTo', []).slice(0, 3).forEach(id => relatedIds.add(id));
            safeGet(node, 'referencedBy', []).slice(0, 3).forEach(id => relatedIds.add(id));
          }
        });
        
        // Create nodes
        const nodes = Array.from(relatedIds)
          .map(id => processedGraphData.find(d => d.id === id))
          .filter(Boolean)
          .map(node => ({
            ...node,
            type: getNodeType(node.id, effectiveDocId, [], processedGraphData)
          }));
        
        // Create links
        const links = [];
        nodes.forEach(node => {
          const linkTo = safeGet(node, 'linkTo', []);
          linkTo.forEach(targetId => {
            if (relatedIds.has(targetId)) {
              links.push({ source: node.id, target: targetId });
            }
          });
        });
        
        return { nodes, links };
      }
      
      // For full view, show all documents with performance limits
      let nodes = processedGraphData.map(node => ({
        ...node,
        type: getNodeType(node.id, effectiveDocId, [], processedGraphData)
      }));
      
      // Limit nodes for performance
      if (nodes.length > CONFIG.full.maxNodes) {
        // Keep current node and its immediate connections
        const importantIds = new Set([effectiveDocId]);
        const currentNode = nodes.find(n => n.id === effectiveDocId);
        
        if (currentNode) {
          safeGet(currentNode, 'linkTo', []).forEach(id => importantIds.add(id));
          safeGet(currentNode, 'referencedBy', []).forEach(id => importantIds.add(id));
        }
        
        // Add most connected nodes
        const sortedByConnections = nodes
          .filter(n => !importantIds.has(n.id))
          .map(n => ({
            ...n,
            connectionCount: safeGet(n, 'linkTo', []).length + safeGet(n, 'referencedBy', []).length
          }))
          .sort((a, b) => b.connectionCount - a.connectionCount);
        
        const additionalNodes = sortedByConnections.slice(0, CONFIG.full.maxNodes - importantIds.size);
        additionalNodes.forEach(n => importantIds.add(n.id));
        
        nodes = nodes.filter(n => importantIds.has(n.id));
      }
      
      // Create links
      const links = [];
      nodes.forEach(node => {
        const linkTo = safeGet(node, 'linkTo', []);
        linkTo.forEach(targetId => {
          if (nodes.some(n => n.id === targetId)) {
            links.push({ source: node.id, target: targetId });
          }
        });
      });
      
      return { nodes, links };
      
    } catch (error) {
      console.error('Error processing graph data:', error);
      return { nodes: [], links: [] };
    }
  }, [processedGraphData, effectiveDocId, isContextual]);
  
  // Navigation handler
  const navigateToDocument = useCallback((docId) => {
    if (!docId || docId === effectiveDocId) return;
    
    const url = generateDocUrl(docId, processedGraphData);
    window.location.href = url;
  }, [effectiveDocId, processedGraphData]);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    
    // Remove tooltip
    if (tooltipRef.current) {
      tooltipRef.current.remove();
      tooltipRef.current = null;
    }
    
    // Clear graph container
    if (graphRef.current) {
      d3.select(graphRef.current).selectAll('*').remove();
    }
  }, []);
  
  // Main rendering effect
  useEffect(() => {
    if (!graphRef.current || !processedData.nodes.length) return cleanup;
    
    const container = graphRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    const config = isContextual ? CONFIG.contextual : CONFIG.full;
    
    // Clear previous content
    cleanup();
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width/2, -height/2, width, height])
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add main group for zoom
    const g = svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Add zoom controls
    const controls = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('top', '10px')
      .style('right', '10px')
      .style('z-index', '10');
    
    controls.append('button')
      .text('Reset')
      .style('padding', '6px 12px')
      .style('border', '1px solid var(--ifm-color-emphasis-300)')
      .style('border-radius', '6px')
      .style('background', 'var(--ifm-background-color)')
      .style('color', 'var(--ifm-color-emphasis-800)')
      .style('font-size', '12px')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      });
    
    // Prepare nodes for D3
    const nodeMap = new Map();
    processedData.nodes.forEach(node => {
      const safeNode = createSafeNode(node);
      if (safeNode) {
        nodeMap.set(node.id, safeNode);
      }
    });
    
    // Prepare links for D3
    const validLinks = processedData.links
      .map(link => createSafeLink(link, nodeMap))
      .filter(Boolean);
    
    const validNodes = Array.from(nodeMap.values());
    
    // Create force simulation
    const simulation = d3.forceSimulation(validNodes)
      .force('link', d3.forceLink(validLinks)
        .distance(config.linkDistance)
        .strength(0.4))
      .force('charge', d3.forceManyBody()
        .strength(config.chargeStrength)
        .distanceMax(300))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide()
        .radius(d => config.nodeSize * 2)
        .strength(0.7));
    
    simulationRef.current = simulation;
    
    // Define arrow markers
    const markerTypes = ['outgoing', 'incoming', 'bidirectional', 'default'];
    const markerColors = {
      outgoing: CONFIG.nodeColors.outgoing,
      incoming: CONFIG.nodeColors.incoming,
      bidirectional: CONFIG.nodeColors.both,
      default: '#999'
    };
    
    markerTypes.forEach(type => {
      g.append('defs').append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', config.nodeSize + 10)
        .attr('refY', 0)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', markerColors[type])
        .style('opacity', 0.8);
    });
    
    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(validLinks)
      .enter()
      .append('line')
      .attr('stroke', d => {
        if (d.isPlaceholder) return CONFIG.nodeColors.placeholder;
        
        const sourceId = safeGet(d, 'source.id');
        const targetId = safeGet(d, 'target.id');
        
        if (sourceId === effectiveDocId) return CONFIG.nodeColors.outgoing;
        if (targetId === effectiveDocId) return CONFIG.nodeColors.incoming;
        
        return '#999';
      })
      .attr('stroke-opacity', d => d.isPlaceholder ? 0.3 : 0.6)
      .attr('stroke-width', d => d.isPlaceholder ? 1 : 2)
      .attr('stroke-dasharray', d => d.isPlaceholder ? '5,5' : null)
      .attr('marker-end', d => d.isPlaceholder ? null : 'url(#arrow-default)');
    
    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(validNodes)
      .enter()
      .append('circle')
      .attr('r', d => d.type === 'current' ? config.nodeSize * 1.5 : config.nodeSize)
      .attr('fill', d => CONFIG.nodeColors[d.type] || CONFIG.nodeColors.unrelated)
      .attr('stroke', d => d.type === 'placeholder' ? '#ddd' : '#fff')
      .attr('stroke-width', d => d.type === 'placeholder' ? 1 : 1.5)
      .attr('opacity', d => d.type === 'placeholder' ? 0.7 : 1)
      .style('cursor', d => d.type === 'current' ? 'default' : 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (d.type !== 'current') {
            d.fx = null;
            d.fy = null;
          }
        }));
    
    // Add labels
    const labelGroup = g.append('g');
    
    const labels = labelGroup.selectAll('text')
      .data(validNodes)
      .enter()
      .append('text')
      .text(d => {
        const title = d.title || d.id;
        const maxLength = isContextual ? 20 : 30;
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
      })
      .attr('dx', 0)
      .attr('dy', config.nodeSize + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', config.labelSize)
      .style('font-weight', d => d.type === 'current' ? 'bold' : 'normal')
      .style('fill', d => d.type === 'placeholder' ? 'var(--ifm-color-gray-600)' : 'var(--ifm-font-color-base)')
      .style('pointer-events', 'none')
      .style('user-select', 'none');
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '9999');
    
    tooltipRef.current = tooltip;
    
    // Node interactions
    node
      .on('click', (event, d) => {
        event.preventDefault();
        if (d.type !== 'current' && !d.isPlaceholder) {
          navigateToDocument(d.id);
        }
      })
      .on('mouseover', function(event, d) {
        // Highlight node
        d3.select(this)
          .transition().duration(200)
          .attr('r', d.type === 'current' ? config.nodeSize * 1.8 : config.nodeSize * 1.5);
        
        // Show tooltip
        const typeLabel = {
          current: 'Current Document',
          incoming: 'Links to this',
          outgoing: 'This links to',
          both: 'Bidirectional link',
          placeholder: 'Related document'
        }[d.type] || 'Document';
        
        tooltip
          .style('visibility', 'visible')
          .html(`<strong>${d.title || d.id}</strong><br><small>${typeLabel}</small>`);
        
        // Highlight connections
        link.style('opacity', l => {
          const sourceId = safeGet(l, 'source.id');
          const targetId = safeGet(l, 'target.id');
          return (sourceId === d.id || targetId === d.id) ? 1 : 0.2;
        });
        
        node.style('opacity', n => {
          if (n.id === d.id) return 1;
          
          const isConnected = validLinks.some(l => {
            const sourceId = safeGet(l, 'source.id');
            const targetId = safeGet(l, 'target.id');
            return (sourceId === d.id && targetId === n.id) || 
                   (sourceId === n.id && targetId === d.id);
          });
          
          return isConnected ? 1 : 0.3;
        });
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        // Restore node size
        d3.select(this)
          .transition().duration(200)
          .attr('r', d.type === 'current' ? config.nodeSize * 1.5 : config.nodeSize);
        
        // Hide tooltip
        tooltip.style('visibility', 'hidden');
        
        // Restore opacity
        link.style('opacity', 0.6);
        node.style('opacity', 1);
      });
    
    // Update positions on tick
    simulation.on('tick', () => {
      // Keep nodes within bounds
      validNodes.forEach(d => {
        d.x = Math.max(-width/2 + 50, Math.min(width/2 - 50, d.x));
        d.y = Math.max(-height/2 + 50, Math.min(height/2 - 50, d.y));
      });
      
      link
        .attr('x1', d => safeGet(d, 'source.x', 0))
        .attr('y1', d => safeGet(d, 'source.y', 0))
        .attr('x2', d => safeGet(d, 'target.x', 0))
        .attr('y2', d => safeGet(d, 'target.y', 0));
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
    
    // Auto-fit for full view
    if (!isContextual) {
      simulation.on('end', () => {
        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        validNodes.forEach(n => {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x);
          maxY = Math.max(maxY, n.y);
        });
        
        // Add padding
        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        // Calculate scale and translation
        const dx = maxX - minX;
        const dy = maxY - minY;
        const scale = 0.8 / Math.max(dx / width, dy / height);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Apply transform
        const transform = d3.zoomIdentity
          .translate(width/2, height/2)
          .scale(scale)
          .translate(-centerX, -centerY);
        
        svg.transition().duration(750).call(zoom.transform, transform);
      });
    }
    
    return cleanup;
  }, [processedData, effectiveDocId, isContextual, navigateToDocument, cleanup]);
  
  // Error boundary
  if (!processedGraphData.length) {
    return (
      <div style={{ 
        width: '100%', 
        height: isContextual ? '300px' : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ifm-color-secondary)'
      }}>
        <p>Loading graph data...</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={graphRef} 
      style={{ 
        width: '100%', 
        height: isContextual ? '300px' : '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: 'var(--ifm-background-surface-color)'
      }}
    />
  );
}