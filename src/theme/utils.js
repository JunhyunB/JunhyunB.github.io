// 평균 읽기 속도: 분당 200-250 단어
const WORDS_PER_MINUTE = 225;

export function calculateReadingTime(content) {
  if (!content) {
    return { minutes: 0, words: 0 };
  }
  
  // HTML 태그 제거
  const text = content.replace(/<\/?[^>]+(>|$)/g, '');
  // 단어 수 계산 (공백으로 구분된 단어들)
  const words = text.split(/\s+/).filter(Boolean).length;
  // 읽기 시간 계산 (분)
  const minutes = Math.ceil(words / WORDS_PER_MINUTE);
  
  return {
    minutes: minutes || 1, // 최소 1분 (짧은 문서의 경우)
    words,
  };
} 