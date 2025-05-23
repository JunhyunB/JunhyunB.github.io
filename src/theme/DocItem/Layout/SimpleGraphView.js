import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  normalizeId, 
  generateDocUrl, 
  deduplicateGraphData, 
  findCurrentDocument,
  getNodeType,
  hasBidirectionalRelationship,
  safeGet
} from './graphUtils';

// Node appearance configuration
const NODE_CONFIG = {
  colors: {
    current: '#E63946',
    outgoing: '#457B9D',
    incoming: '#2A9D8F',
    both: '#F4A261',
    unrelated: '#A8DADC',
    placeholder: '#C0C0C0'
  },
  sizes: {
    current: 12,
    outgoing: 8,
    incoming: 8,
    both: 10,
    unrelated: 6,
    placeholder: 6
  }
};

export default function SimpleGraphView({ graphData, currentDocId, isContextual }) {
  const graphRef = useRef(null);
  const tooltipRef = useRef(null);
  const simulationRef = useRef(null);
  
  // Preprocess and deduplicate graph data
  const processedGraphData = useMemo(() => {
    if (!graphData || !Array.isArray(graphData)) return [];
    return deduplicateGraphData(graphData);
  }, [graphData]);
  
  // Find the current document with robust matching
  const currentDocument = useMemo(() => {
    return findCurrentDocument(currentDocId, processedGraphData);
  }, [currentDocId, processedGraphData]);
  
  // Find related documents
  const relatedDocs = useMemo(() => {
    if (!currentDocument || !processedGraphData.length) {
      return { current: null, outgoing: [], incoming: [] };
    }
    
    const outgoingIds = safeGet(currentDocument, 'linkTo', []);
    const incomingIds = safeGet(currentDocument, 'referencedBy', []);
    
    const outgoing = outgoingIds
      .map(id => processedGraphData.find(doc => doc.id === id))
      .filter(Boolean);
    
    const incoming = incomingIds
      .map(id => processedGraphData.find(doc => doc.id === id))
      .filter(Boolean);
    
    return { current: currentDocument, outgoing, incoming };
  }, [currentDocument, processedGraphData]);
  
  // Navigation handler
  const navigateToDocument = useCallback((docId) => {
    if (!docId || docId === currentDocId) return;
    
    const url = generateDocUrl(docId, processedGraphData);
    window.location.href = url;
  }, [currentDocId, processedGraphData]);
  
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
    if (!graphRef.current || !processedGraphData.length) return;
    
    // Clean up previous render
    cleanup();
    
    const container = graphRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    
    // If no current document found, show message
    if (!relatedDocs.current) {
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        text-align: center;
        padding: 20px;
        color: var(--ifm-color-secondary);
        font-style: italic;
      `;
      messageDiv.textContent = 'No document relationships found';
      container.appendChild(messageDiv);
      return;
    }
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width/2, -height/2, width, height])
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add zoom functionality
    const graphGroup = svg.append('g').attr('class', 'graph-container');
    
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        graphGroup.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Double-click to reset zoom
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });
    
    // Prepare nodes and links
    const nodes = [];
    const links = [];
    
    // Add current document
    nodes.push({
      ...relatedDocs.current,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      type: 'current'
    });
    
    // Calculate positions for related documents
    const radius = Math.min(width, height) * 0.25;
    
    // Add outgoing documents
    const outgoingCount = relatedDocs.outgoing.length;
    relatedDocs.outgoing.forEach((doc, i) => {
      const angle = (Math.PI / (outgoingCount + 1)) * (i + 1);
      const x = radius * Math.sin(angle);
      const y = -radius * Math.cos(angle);
      
      nodes.push({
        ...doc,
        x,
        y,
        type: getNodeType(doc.id, relatedDocs.current.id, links, processedGraphData)
      });
      
      links.push({
        source: relatedDocs.current.id,
        target: doc.id,
        type: 'outgoing'
      });
    });
    
    // Add incoming documents (avoiding duplicates)
    const incomingCount = relatedDocs.incoming.filter(
      doc => !relatedDocs.outgoing.some(out => out.id === doc.id)
    ).length;
    
    let incomingIndex = 0;
    relatedDocs.incoming.forEach((doc) => {
      // Skip if already added as outgoing
      if (nodes.some(n => n.id === doc.id)) {
        // Update type to 'both' if it's bidirectional
        const existingNode = nodes.find(n => n.id === doc.id);
        if (existingNode && existingNode.type === 'outgoing') {
          existingNode.type = 'both';
        }
        links.push({
          source: doc.id,
          target: relatedDocs.current.id,
          type: 'incoming'
        });
        return;
      }
      
      const angle = Math.PI + (Math.PI / (incomingCount + 1)) * (incomingIndex + 1);
      const x = radius * Math.sin(angle);
      const y = -radius * Math.cos(angle);
      
      nodes.push({
        ...doc,
        x,
        y,
        type: 'incoming'
      });
      
      links.push({
        source: doc.id,
        target: relatedDocs.current.id,
        type: 'incoming'
      });
      
      incomingIndex++;
    });
    
    // Add placeholder nodes if graph is empty
    if (nodes.length === 1 && processedGraphData.length > 1) {
      const placeholders = processedGraphData
        .filter(doc => doc.id !== relatedDocs.current.id)
        .slice(0, 4);
      
      placeholders.forEach((doc, i) => {
        const angle = (Math.PI * 2 / placeholders.length) * i;
        const x = radius * 0.8 * Math.cos(angle);
        const y = radius * 0.8 * Math.sin(angle);
        
        nodes.push({
          ...doc,
          x,
          y,
          type: 'placeholder',
          isPlaceholder: true
        });
      });
    }
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(50));
    
    simulationRef.current = simulation;
    
    // Draw links
    const linkGroup = graphGroup.append('g').attr('class', 'links');
    
    // Arrow markers
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
    
    const linkElements = linkGroup.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => {
        if (d.source.isPlaceholder || d.target.isPlaceholder) return NODE_CONFIG.colors.placeholder;
        return NODE_CONFIG.colors[d.type] || '#999';
      })
      .attr('stroke-width', d => (d.source.isPlaceholder || d.target.isPlaceholder) ? 1 : 1.5)
      .attr('stroke-opacity', d => (d.source.isPlaceholder || d.target.isPlaceholder) ? 0.4 : 0.6)
      .attr('stroke-dasharray', d => (d.source.isPlaceholder || d.target.isPlaceholder) ? '3,3' : null)
      .attr('marker-end', d => (d.source.isPlaceholder || d.target.isPlaceholder) ? null : 'url(#arrowhead)');
    
    // Create node group
    const nodeGroup = graphGroup.append('g').attr('class', 'nodes');
    
    const nodeElements = nodeGroup.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
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
    
    // Add circles
    nodeElements.append('circle')
      .attr('r', d => NODE_CONFIG.sizes[d.type] || NODE_CONFIG.sizes.unrelated)
      .attr('fill', d => NODE_CONFIG.colors[d.type] || NODE_CONFIG.colors.unrelated)
      .attr('stroke', d => d.type === 'placeholder' ? '#ddd' : '#fff')
      .attr('stroke-width', d => d.type === 'placeholder' ? 1 : 1.5)
      .attr('opacity', d => d.type === 'placeholder' ? 0.7 : 1);
    
    // Add labels with backgrounds
    const labelGroup = nodeElements.append('g')
      .attr('class', 'label-group');
    
    // Label backgrounds
    labelGroup.append('rect')
      .attr('class', 'label-bg')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', d => NODE_CONFIG.colors[d.type] || '#ddd')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 0.5);
    
    // Label text
    const labels = labelGroup.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 20)
      .style('font-size', isContextual ? '11px' : '12px')
      .style('font-weight', d => d.type === 'current' ? 'bold' : 'normal')
      .style('font-style', d => d.type === 'placeholder' ? 'italic' : 'normal')
      .style('fill', d => d.type === 'placeholder' ? 'var(--ifm-color-gray-600)' : 'var(--ifm-font-color-base)')
      .style('pointer-events', 'none')
      .text(d => {
        const title = d.title || d.id;
        const maxLength = isContextual ? 20 : 30;
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
      });
    
    // Size label backgrounds to fit text
    labels.each(function(d) {
      const bbox = this.getBBox();
      const padding = 6;
      
      d3.select(this.parentNode).select('.label-bg')
        .attr('width', bbox.width + padding * 2)
        .attr('height', bbox.height + padding)
        .attr('x', -bbox.width / 2 - padding)
        .attr('y', bbox.y - padding / 2);
    });
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '9999');
    
    tooltipRef.current = tooltip;
    
    // Node interactions
    nodeElements
      .on('click', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        if (d.type !== 'current' && !d.isPlaceholder) {
          navigateToDocument(d.id);
        }
      })
      .on('mouseenter', function(event, d) {
        // Scale up node
        d3.select(this).select('circle')
          .transition().duration(150)
          .attr('r', (NODE_CONFIG.sizes[d.type] || NODE_CONFIG.sizes.unrelated) * 1.2);
        
        // Show tooltip
        const typeLabel = {
          current: 'Current Document',
          incoming: 'Links to this',
          outgoing: 'This links to',
          both: 'Bidirectional link',
          placeholder: 'Other document'
        }[d.type] || 'Document';
        
        tooltip
          .style('visibility', 'visible')
          .html(`<strong>${d.title || d.id}</strong><br><small>${typeLabel}</small>`);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseleave', function(event, d) {
        // Scale down node
        d3.select(this).select('circle')
          .transition().duration(150)
          .attr('r', NODE_CONFIG.sizes[d.type] || NODE_CONFIG.sizes.unrelated);
        
        // Hide tooltip
        tooltip.style('visibility', 'hidden');
      });
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      nodeElements.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });
    
    // Cleanup on unmount
    return cleanup;
  }, [processedGraphData, currentDocument, relatedDocs, isContextual, navigateToDocument, cleanup]);
  
  return (
    <div 
      ref={graphRef} 
      style={{ 
        width: '100%', 
        height: isContextual ? '300px' : '100%',
        position: 'relative',
        borderRadius: '8px',
        backgroundColor: 'var(--ifm-background-surface-color)',
        overflow: 'hidden'
      }}
    />
  );
}