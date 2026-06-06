// 다국어 사전을 비동기적으로 로딩하기 위한 통합 파일.

export const loadDictionary = async (lang: 'EN' | 'KR') => {
  if (lang === 'EN') {
    return import('./en').then((m) => m.en);
  }
  return import('./kr').then((m) => m.kr);
};
