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
import styles from './styles.module.css';
import ZoomInIcon from '@site/static/img/zoom-in-icon.svg'; // 확대 아이콘 경로 (예시)

// 모달 컴포넌트 (나중에 별도 파일로 분리 가능)
function GraphModal({ graphData, currentDocId, onClose }) {
  return (
    <div className={styles.graphModalBackdrop} onClick={onClose}>
      <div className={styles.graphModalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.graphModalCloseButton} onClick={onClose}>&times;</button>
        <DocGraphView graphData={graphData} currentDocId={currentDocId} isContextual={false} />
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
  const currentDocId = metadata?.id;

  // Fetch graph data once
  useEffect(() => {
    async function fetchGraphData() {
      try {
        const response = await fetch('/docusaurus-graph.json');
        const data = await response.json();
        setGraphData(data);
      } catch (error) {
        console.error('Error loading graph data:', error);
        setGraphData([]); // 에러 시 빈 배열 설정
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
              <DocGraphView graphData={graphData} currentDocId={currentDocId} isContextual={true} />
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
