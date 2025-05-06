import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import {useWindowSize} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import DocItemPaginator from '@theme/DocItem/Paginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocItemFooter from '@theme/DocItem/Footer';
import DocItemTOCMobile from '@theme/DocItem/TOC/Mobile';
import DocItemTOCDesktop from '@theme/DocItem/TOC/Desktop';
import DocItemContent from '@theme/DocItem/Content';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import ContentVisibility from '@theme/ContentVisibility';
import DocGraphView from './DocGraphView';
import SimpleGraphView from './SimpleGraphView';
import styles from './styles.module.css';
import ZoomInIcon from '@site/static/img/zoom-in-icon.svg'; // 확대 아이콘 경로 (예시)

// Modal component with enhanced interactivity
function GraphModal({ graphData, currentDocId, onClose }) {
  const [showFullGraph, setShowFullGraph] = React.useState(false);
  
  const toggleFullGraph = () => {
    setShowFullGraph(!showFullGraph);
  };
  
  return (
    <div className={styles.graphModalBackdrop} onClick={onClose}>
      <div className={styles.graphModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.graphModalHeader}>
          <div className={styles.graphModalTitle}>
            {showFullGraph ? 'Complete Knowledge Graph' : 'Document Relationship Graph'}
          </div>
          <div className={styles.graphModalControls}>
            <button 
              className={styles.graphModeToggle} 
              onClick={toggleFullGraph}
              title={showFullGraph ? "Show only related documents" : "Show all documents"}
            >
              {showFullGraph ? "Show Related" : "Show All Documents"}
            </button>
            <button className={styles.graphModalCloseButton} onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className={styles.graphModalBody}>
          {showFullGraph ? (
            // 전체 그래프 보기 - DocGraphView 컴포넌트 사용
            <div className={styles.fullGraphContainer}>
              <DocGraphView graphData={graphData} currentDocId={currentDocId} isContextual={false} />
            </div>
          ) : (
            // 관련 문서만 보기 - SimpleGraphView 컴포넌트 사용
            <div className={styles.contextualGraphContainer}>
              <SimpleGraphView graphData={graphData} currentDocId={currentDocId} isContextual={false} />
            </div>
          )}
        </div>
        <div className={styles.graphModalFooter}>
          <div className={styles.graphLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{backgroundColor: '#E63946'}}></span>
              <span>Current Document</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{backgroundColor: '#457B9D'}}></span>
              <span>Linked from Current</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{backgroundColor: '#2A9D8F'}}></span>
              <span>Links to Current</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{backgroundColor: '#F4A261'}}></span>
              <span>Bidirectional Link</span>
            </div>
            {showFullGraph && (
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{backgroundColor: '#A8DADC'}}></span>
                <span>Unrelated Document</span>
              </div>
            )}
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{backgroundColor: '#C0C0C0'}}></span>
              <span>Placeholder Node</span>
            </div>
          </div>
          <div className={styles.graphInstructions}>
            Drag nodes • Scroll to zoom • Double-click to reset • Click to navigate
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Decide if the toc should be rendered, on mobile or desktop viewports
 */
function useDocTOC() {
  const {frontMatter, toc} = useDoc();
  const windowSize = useWindowSize();
  const hidden = frontMatter.hide_table_of_contents;
  const canRender = !hidden && toc.length > 0;
  const mobile = canRender ? <DocItemTOCMobile /> : undefined;
  const desktop =
    canRender && (windowSize === 'desktop' || windowSize === 'ssr') ? (
      <DocItemTOCDesktop />
    ) : undefined;
  return {
    hidden,
    mobile,
    desktop,
  };
}
export default function DocItemLayout({children}) {
  const docTOC = useDocTOC();
  const { metadata } = useDoc();
  const windowSize = useWindowSize();
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [graphData, setGraphData] = useState(null);
  // Extract the document ID from the route and metadata with enhanced error handling
  const currentDocRoute = metadata?.permalink?.replace(/^\/docs\//, '').replace(/\/$/, '') || '';
  
  // Get the ID from front matter if available
  const frontMatterId = metadata?.frontMatter?.id;
  
  // Sometimes the ID is in the route part after the last slash
  const routeBasedId = currentDocRoute.split('/').pop();
  
  // Sometimes the ID is in the last directory of the path
  const pathId = currentDocRoute.split('/').filter(Boolean).pop();
  
  // Extract a simple ID (filename without extension) from the route
  const simpleId = (() => {
    if (!currentDocRoute) return '';
    const parts = currentDocRoute.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/\.(md|mdx)$/, '');
  })();
  
  // Get the full path without trailing slash for matching
  const fullPath = currentDocRoute;
  
  // Handle index pages specially
  const isIndexPage = currentDocRoute.endsWith('/') || routeBasedId === 'index';
  const indexAdjustedPath = isIndexPage ? 
    (currentDocRoute.replace(/\/$/, '') + '/index') : 
    currentDocRoute;
  
  // Use the most specific ID available (prioritize front matter ID)
  // Try multiple ID formats to increase chance of matching with graph data
  const currentDocId = frontMatterId || indexAdjustedPath || fullPath || pathId || simpleId || currentDocRoute || routeBasedId || '';
  
  // Extra debugging for document identification
  console.log('EXTRA DEBUG - Document ID determination:', {
    frontMatterId,
    indexAdjustedPath,
    fullPath,
    pathId,
    simpleId,
    currentDocRoute,
    routeBasedId,
    finalId: currentDocId,
    safetyCheck: currentDocId === 'safety-guidance' ? 'CRITICAL NODE DETECTED!' : 'Not safety-guidance'
  });
  
  // Log for debugging
  console.log('Document info:', {
    route: currentDocRoute,
    frontMatterId,
    routeBasedId,
    pathId,
    simpleId,
    fullPath,
    isIndexPage,
    indexAdjustedPath,
    finalId: currentDocId,
    permalinkRaw: metadata?.permalink,
    source: metadata?.source
  });

  // Fetch graph data once with enhanced error handling and caching prevention
  useEffect(() => {
    async function fetchGraphData() {
      try {
        // Add a cache-busting timestamp for development to prevent stale data
        const isDevelopment = process.env.NODE_ENV === 'development';
        const cacheBuster = isDevelopment ? `?t=${Date.now()}` : '';
        const graphUrl = `/docusaurus-graph.json${cacheBuster}`;
        
        console.log(`Fetching graph data from ${graphUrl}`);
        const response = await fetch(graphUrl, {
          // Add cache control headers to prevent browser caching in development
          headers: isDevelopment ? {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } : {}
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch graph data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !Array.isArray(data)) {
          console.warn('Graph data is not in expected format:', data);
          setGraphData([]); // Use empty array as fallback
          return;
        }
        
        console.log(`Successfully loaded graph data with ${data.length} documents`);
        
        // Add timestamp to help track when the data was loaded
        const dataWithTimestamp = data.map(item => ({
          ...item,
          _loadTimestamp: Date.now()
        }));
        
        setGraphData(dataWithTimestamp);
        
      } catch (error) {
        console.error('Error loading graph data:', error);
        // Set empty array on error for graceful degradation
        setGraphData([]);
      }
    }
    fetchGraphData();
  }, []);

  const handleExpandGraph = () => {
    setIsGraphExpanded(true);
  };

  const handleCloseGraph = () => {
    setIsGraphExpanded(false);
  };

  // Don't render graph section if data hasn't loaded or on mobile
  const shouldRenderGraphSection = graphData && (windowSize === 'desktop' || windowSize === 'ssr');

  return (
    <div className="row">
      <div className={clsx('col', !docTOC.hidden && styles.docItemCol)}>
        <ContentVisibility metadata={metadata} />
        <DocVersionBanner />
        <div className={styles.docItemContainer}>
          <article>
            <DocBreadcrumbs />
            <DocVersionBadge />
            {docTOC.mobile}
            <DocItemContent>{children}</DocItemContent>
            <DocItemFooter />
          </article>
          <DocItemPaginator />
        </div>
      </div>
      {shouldRenderGraphSection && (
        <div className="col col--3">
          <div className={styles.graphContainer}>
            <div className={styles.graphHeader}>
              <div className={styles.graphTitle}>INTERACTIVE GRAPH</div>
              <button onClick={handleExpandGraph} className={styles.expandButton} aria-label="Expand graph">
                 <ZoomInIcon />
              </button>
            </div>
            <div className={styles.graphBox}>
              <SimpleGraphView graphData={graphData} currentDocId={currentDocId} isContextual={true} />
            </div>
          </div>
          {docTOC.desktop && docTOC.desktop}
        </div>
      )}
      {isGraphExpanded && graphData && (
        <GraphModal 
          graphData={graphData} 
          currentDocId={currentDocId} 
          onClose={handleCloseGraph} 
        />
      )}
    </div>
  );
}
