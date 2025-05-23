import React, { useState, useEffect, useMemo } from 'react';
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
import ZoomInIcon from '@site/static/img/zoom-in-icon.svg';
import { normalizeId } from './graphUtils';

// Modal component for expanded graph view
function GraphModal({ graphData, currentDocId, onClose }) {
  const [showFullGraph, setShowFullGraph] = useState(false);
  
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
            <div className={styles.fullGraphContainer}>
              <DocGraphView graphData={graphData} currentDocId={currentDocId} isContextual={false} />
            </div>
          ) : (
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
          </div>
          <div className={styles.graphInstructions}>
            Drag nodes • Scroll to zoom • Click nodes to navigate • Hover for details
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
  const [isGraphLoading, setIsGraphLoading] = useState(true);
  
  // Extract the document ID from metadata
  const currentDocId = useMemo(() => {
    if (!metadata) return '';
    
    // Try different sources for the document ID
    const frontMatterId = metadata.frontMatter?.id;
    const permalink = metadata.permalink;
    const source = metadata.source;
    
    // Get ID from permalink (most reliable)
    if (permalink) {
      const id = permalink
        .replace(/^\/docs\//, '')
        .replace(/\/$/, '');
      return normalizeId(id);
    }
    
    // Fallback to frontmatter ID
    if (frontMatterId) {
      return normalizeId(frontMatterId);
    }
    
    // Fallback to source path
    if (source) {
      const id = source
        .replace(/^@site\/docs\//, '')
        .replace(/\.(md|mdx)$/, '');
      return normalizeId(id);
    }
    
    return '';
  }, [metadata]);
  
  // Fetch graph data with proper error handling
  useEffect(() => {
    let isMounted = true;
    
    async function fetchGraphData() {
      try {
        setIsGraphLoading(true);
        
        // Cache busting for development
        const isDevelopment = process.env.NODE_ENV === 'development';
        const cacheBuster = isDevelopment ? `?t=${Date.now()}` : '';
        
        const response = await fetch(`/docusaurus-graph.json${cacheBuster}`, {
          headers: isDevelopment ? {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } : {}
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch graph data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted && Array.isArray(data)) {
          setGraphData(data);
        }
      } catch (error) {
        console.error('Error loading graph data:', error);
        if (isMounted) {
          setGraphData([]); // Set empty array on error
        }
      } finally {
        if (isMounted) {
          setIsGraphLoading(false);
        }
      }
    }
    
    fetchGraphData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExpandGraph = () => {
    setIsGraphExpanded(true);
  };

  const handleCloseGraph = () => {
    setIsGraphExpanded(false);
  };

  // Only render graph on desktop when data is loaded
  const shouldRenderGraphSection = !isGraphLoading && 
                                  graphData && 
                                  graphData.length > 0 && 
                                  (windowSize === 'desktop' || windowSize === 'ssr');

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
              <button 
                onClick={handleExpandGraph} 
                className={styles.expandButton} 
                aria-label="Expand graph"
                title="Expand graph view"
              >
                <ZoomInIcon />
              </button>
            </div>
            <div className={styles.graphBox}>
              {currentDocId ? (
                <SimpleGraphView 
                  graphData={graphData} 
                  currentDocId={currentDocId} 
                  isContextual={true} 
                />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--ifm-color-secondary)',
                  fontStyle: 'italic'
                }}>
                  No document ID found
                </div>
              )}
            </div>
          </div>
          {docTOC.desktop && docTOC.desktop}
        </div>
      )}
      {isGraphExpanded && graphData && currentDocId && (
        <GraphModal 
          graphData={graphData} 
          currentDocId={currentDocId} 
          onClose={handleCloseGraph} 
        />
      )}
    </div>
  );
}