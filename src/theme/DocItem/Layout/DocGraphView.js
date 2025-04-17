import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// Helper function to get neighbors
function getNeighbors(data, docId) {
  const neighbors = new Set([docId]);
  const linksMap = new Map();

  // Build adjacency list (both directions)
  data.forEach(item => {
    const currentLinks = linksMap.get(item.id) || new Set();
    if (item.linkTo) {
      item.linkTo.forEach(targetId => {
        currentLinks.add(targetId);
        const targetLinks = linksMap.get(targetId) || new Set();
        targetLinks.add(item.id);
        linksMap.set(targetId, targetLinks);
      });
    }
    linksMap.set(item.id, currentLinks);
  });

  // Find direct neighbors
  const directLinks = linksMap.get(docId) || new Set();
  directLinks.forEach(neighborId => neighbors.add(neighborId));

  return neighbors;
}

export default function DocGraphView({ graphData, currentDocId, isContextual }) {
  const graphRef = useRef(null);

  // Filter data for contextual view if needed
  const processedData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    if (isContextual && currentDocId) {
      const neighborIds = getNeighbors(graphData, currentDocId);
      
      const contextualNodes = graphData
        .filter(item => neighborIds.has(item.id))
        .map(item => ({
          id: item.id,
          title: item.title || item.id
        }));

      const contextualLinks = [];
      graphData.forEach(item => {
        if (neighborIds.has(item.id) && item.linkTo) {
          item.linkTo.forEach(targetId => {
            if (neighborIds.has(targetId)) {
              contextualLinks.push({ source: item.id, target: targetId });
            }
          });
        }
      });
      return { nodes: contextualNodes, links: contextualLinks };

    } else {
      // Full graph view
      const nodes = graphData.map(item => ({
        id: item.id,
        title: item.title || item.id
      }));
      const links = [];
      graphData.forEach(item => {
        if (item.linkTo) {
          item.linkTo.forEach(targetId => {
            links.push({ source: item.id, target: targetId });
          });
        }
      });
      return { nodes, links };
    }
  }, [graphData, currentDocId, isContextual]);

  useEffect(() => {
    if (!graphRef.current || !processedData || processedData.nodes.length === 0) {
      if (graphRef.current) {
        d3.select(graphRef.current).selectAll('*').remove();
      }
      return;
    } 
      
    renderGraph(processedData.nodes, processedData.links);

    return () => {
      if (graphRef.current) {
        d3.select(graphRef.current).selectAll('*').remove();
      }
    };
  }, [processedData, currentDocId]);

  function renderGraph(nodes, links) {
    const container = graphRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) return;

    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);

    const distance = isContextual ? 50 : 80;
    const strength = isContextual ? -120 : -250;
    const nodeRadius = isContextual ? 4 : 6;
    const labelFontSize = isContextual ? '7px' : '9px';
    const labelDx = isContextual ? 5 : 8;

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(distance))
      .force('charge', d3.forceManyBody().strength(strength))
      .force('center', d3.forceCenter(0, 0));

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => d.id === currentDocId ? '#7582EB' : '#69b3a2')
      .call(drag(simulation));

    const label = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('dx', labelDx)
      .attr('dy', '.35em')
      .text(d => d.title)
      .style('font-size', labelFontSize)
      .style('fill', 'var(--ifm-font-color-base)')
      .style('opacity', 0.8)
      .attr('pointer-events', 'none');

    const zoomBehavior = d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        link.attr('transform', event.transform);
        node.attr('transform', event.transform);
        label.attr('transform', event.transform);
      });
    
    svg.call(zoomBehavior);
    
    simulation.on('end', () => {
      const targetNode = nodes.find(n => n.id === currentDocId);
      
      if (isContextual && targetNode) {
        const scale = 1.5;
        const x = targetNode.x;
        const y = targetNode.y;
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(scale)
          .translate(-x, -y);
        
        svg.transition().duration(300).call(zoomBehavior.transform, transform);

      } else if (nodes.length > 0) {
        const bounds = calculateBounds(nodes);
        const dx = bounds.x2 - bounds.x1 || 1;
        const dy = bounds.y2 - bounds.y1 || 1;
        const x = (bounds.x1 + bounds.x2) / 2;
        const y = (bounds.y1 + bounds.y2) / 2;
        const scale = Math.max(0.1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))); 
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition().duration(300).call(
          zoomBehavior.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
      }
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

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
      }
      
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    function calculateBounds(nodes) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        const x = node.x || 0;
        const y = node.y || 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
      if (minX === Infinity) return {x1: -width/2, y1: -height/2, x2: width/2, y2: height/2};
      return {x1: minX, y1: minY, x2: maxX, y2: maxY};
    }

  }

  return (
    <div 
      ref={graphRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden'
      }}
    />
  );
} 