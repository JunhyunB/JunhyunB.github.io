import React, { useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Custom Graph component
function GraphVisualization() {
  const graphRef = useRef(null);

  useEffect(() => {
    // Safety check for SSR
    if (typeof window === 'undefined') return;

    // We'll use D3.js for visualization
    const loadD3 = async () => {
      try {
        // Dynamically import D3
        const d3Module = await import('d3');
        const d3 = d3Module.default || d3Module;
        
        // Basic graph data
        const graphData = {
          nodes: [
            { id: 'ResNet', group: 1, label: 'ResNet', url: '/docs/computer-vision/example-paper' },
            { id: 'deep-learning', group: 2, label: 'Deep Learning', url: '/docs/machine-learning/deep-learning' },
            { id: 'neural-networks', group: 2, label: 'Neural Networks', url: '/docs/machine-learning/neural-networks' },
            { id: 'skip-connections', group: 3, label: 'Skip Connections', url: '/docs/computer-vision/skip-connections' },
            { id: 'ImageNet', group: 4, label: 'ImageNet', url: '#' },
            { id: 'VGG', group: 1, label: 'VGG', url: '#' },
            { id: 'GoogLeNet', group: 1, label: 'GoogLeNet', url: '#' },
            { id: 'AlexNet', group: 1, label: 'AlexNet', url: '#' },
          ],
          links: [
            { source: 'ResNet', target: 'neural-networks', value: 1, type: 'source' },
            { source: 'ResNet', target: 'deep-learning', value: 1, type: 'source' },
            { source: 'ResNet', target: 'skip-connections', value: 1, type: 'reference' },
            { source: 'ResNet', target: 'ImageNet', value: 1, type: 'reference' },
            { source: 'ResNet', target: 'VGG', value: 1, type: 'reference' },
            { source: 'ResNet', target: 'GoogLeNet', value: 1, type: 'reference' },
            { source: 'ResNet', target: 'AlexNet', value: 1, type: 'reference' },
            { source: 'neural-networks', target: 'deep-learning', value: 1, type: 'reference' },
            { source: 'skip-connections', target: 'neural-networks', value: 1, type: 'source' },
            { source: 'skip-connections', target: 'deep-learning', value: 1, type: 'source' },
          ]
        };

        // Clear previous graph
        if (graphRef.current) {
          while (graphRef.current.firstChild) {
            graphRef.current.removeChild(graphRef.current.firstChild);
          }
        }

        // Create SVG
        const width = graphRef.current.clientWidth;
        const height = 600;
        
        const svg = d3.select(graphRef.current)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', [0, 0, width, height])
          .attr('style', 'max-width: 100%; height: auto;');

        // Create a force simulation
        const simulation = d3.forceSimulation(graphData.nodes)
          .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
          .force('charge', d3.forceManyBody().strength(-400))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('x', d3.forceX())
          .force('y', d3.forceY());

        // Add links
        const link = svg.append('g')
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0.6)
          .selectAll('line')
          .data(graphData.links)
          .join('line')
          .attr('stroke-width', d => Math.sqrt(d.value))
          .attr('stroke', d => d.type === 'source' ? '#4CAF50' : '#2196F3');

        // Create node group
        const node = svg.append('g')
          .attr('class', 'nodes')
          .selectAll('g')
          .data(graphData.nodes)
          .join('g')
          .call(drag(simulation));

        // Add circles to nodes
        node.append('circle')
          .attr('r', 10)
          .attr('fill', d => {
            if (d.group === 1) return '#e41a1c'; // Computer Vision papers
            if (d.group === 2) return '#377eb8'; // ML concepts
            if (d.group === 3) return '#4daf4a'; // Techniques
            return '#984ea3'; // Others
          });

        // Add labels to nodes
        node.append('text')
          .text(d => d.label)
          .attr('x', 12)
          .attr('y', 3)
          .style('font-size', '12px')
          .style('font-family', 'sans-serif');

        // Add titles (tooltips)
        node.append('title')
          .text(d => d.label);

        // Add click behavior to navigate to page
        node.on('click', function(event, d) {
          if (d.url && d.url !== '#') {
            window.location.href = d.url;
          }
        });

        // Update positions on each tick
        simulation.on('tick', () => {
          link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

          node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Drag functionality
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
            event.subject.fx = null;
            event.subject.fy = null;
          }
          
          return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
        }

      } catch (error) {
        console.error('Failed to load D3 or render graph:', error);
      }
    };

    loadD3();
  }, []);

  return (
    <div 
      ref={graphRef} 
      className="graph-container"
      style={{ 
        width: '100%', 
        height: '600px', 
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '8px',
        cursor: 'grab',
        backgroundColor: 'var(--ifm-background-surface-color)'
      }}
    ></div>
  );
}

export default function GraphPage() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title="Knowledge Graph"
      description="Visualize the connections between paper summaries and research notes">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <div className="text--center margin-bottom--lg">
              <Heading as="h1">Paper Summaries Knowledge Graph</Heading>
              <p>
                This interactive graph shows the connections between various papers and research topics.
                Click on nodes to navigate to the related paper summary.
              </p>
            </div>
            
            {/* Use BrowserOnly to render the graph only in browser */}
            <BrowserOnly>
              {() => <GraphVisualization />}
            </BrowserOnly>
            
            <div className="margin-top--lg">
              <h2>How to Use the Graph</h2>
              <ul>
                <li><strong>Zoom:</strong> Use mouse wheel or pinch gesture to zoom in/out</li>
                <li><strong>Pan:</strong> Click and drag to move around</li>
                <li><strong>Select:</strong> Click on a node to navigate to that paper</li>
                <li><strong>Hover:</strong> Hover over nodes to see their connections highlighted</li>
              </ul>
              
              <h2>Node Types</h2>
              <ul>
                <li><span style={{color: '#e41a1c'}}>●</span> <strong>Red:</strong> Computer Vision papers</li>
                <li><span style={{color: '#377eb8'}}>●</span> <strong>Blue:</strong> Machine Learning concepts</li>
                <li><span style={{color: '#4daf4a'}}>●</span> <strong>Green:</strong> Techniques</li>
                <li><span style={{color: '#984ea3'}}>●</span> <strong>Purple:</strong> Others</li>
              </ul>
              
              <h2>Connection Types</h2>
              <ul>
                <li><span style={{color: '#4CAF50'}}>—</span> <strong>Green:</strong> Source relationship</li>
                <li><span style={{color: '#2196F3'}}>—</span> <strong>Blue:</strong> Reference relationship</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 