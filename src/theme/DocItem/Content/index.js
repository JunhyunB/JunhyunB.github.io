import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import { calculateReadingTime } from '@site/src/theme/utils';
import styles from './styles.module.css';
/**
 Title can be declared inside md content or declared through
 front matter and added manually. To make both cases consistent,
 the added title is added under the same div.markdown block
 See https://github.com/facebook/docusaurus/pull/4882#issuecomment-853021120

 We render a "synthetic title" if:
 - user doesn't ask to hide it with front matter
 - the markdown content does not already contain a top-level h1 heading
*/
function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  const { metadata } = useDoc();
  const [readingStats, setReadingStats] = useState({ minutes: 3, words: 750 });
  
  // 렌더링 후 DOM에서 실제 텍스트 내용을 추출하는 방식
  useEffect(() => {
    // 컴포넌트가 마운트된 후에 DOM에서 문서 텍스트를 추출
    const getTextFromDocument = () => {
      try {
        // 문서의 main 콘텐츠 부분을 선택
        const docContent = document.querySelector('.markdown');
        if (docContent) {
          // docContent의 순수 텍스트 내용 (모든 HTML 태그 제외)
          const textContent = docContent.textContent || '';
          // 읽기 시간 계산
          const stats = calculateReadingTime(textContent);
          setReadingStats(stats);
        }
      } catch (e) {
        console.error('Error calculating reading time:', e);
      }
    };
    
    // 약간의 지연을 두고 실행 (렌더링이 완료된 후)
    const timeoutId = setTimeout(getTextFromDocument, 100);
    return () => clearTimeout(timeoutId);
  }, [metadata.id]); // 문서 ID가 변경될 때마다 재계산
  
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      
      <div className={styles.readingTime}>
        {readingStats.minutes} min read • {readingStats.words} words
      </div>
      
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
