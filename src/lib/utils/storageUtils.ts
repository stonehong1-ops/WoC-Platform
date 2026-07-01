/**
 * 비공식 GCS 경로(storage.googleapis.com)가 들어올 경우
 * 브라우저 CORS 차단이 없는 Firebase 공식 다운로드 엔드포인트 URL로 안전하게 환산해주는 방어용 유틸리티 함수입니다.
 */
export function getSafeStorageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('https://storage.googleapis.com/')) {
    // 예: https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/socials/B2aYZK9mZF6zUUpQEUw1/poster.jpg
    const withoutDomain = trimmedUrl.replace('https://storage.googleapis.com/', '');
    const firstSlashIndex = withoutDomain.indexOf('/');
    if (firstSlashIndex !== -1) {
      const bucketName = withoutDomain.substring(0, firstSlashIndex);
      const filePath = withoutDomain.substring(firstSlashIndex + 1);
      const encodedPath = encodeURIComponent(filePath);
      return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
    }
  }
  return trimmedUrl;
}
