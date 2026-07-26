// WoC Video Poster Thumbnail Generator (Blob-based Canvas Capture with Timeout & Fallback)

/**
 * 비디오 파일에서 대표 프레임을 캡처하여 JPEG/WebP Blob으로 생성합니다.
 * 타임아웃 3초 가드를 적용하여 실패 시 안전하게 null (fallback 사용)을 리턴합니다.
 */
export async function generateVideoPosterBlob(videoFile: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const videoUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const cleanupAndResolve = (result: Blob | null) => {
      if (!resolved) {
        resolved = true;
        try {
          URL.revokeObjectURL(videoUrl);
        } catch {
          /* ignore */
        }
        resolve(result);
      }
    };

    // 3초 타임아웃 가드 (인코딩 문제/브라우저 락 방지)
    const timer = setTimeout(() => {
      console.warn('Video poster generation timed out, falling back to default poster');
      cleanupAndResolve(null);
    }, 3000);

    video.onloadedmetadata = () => {
      let seekTime = 0.5;
      if (video.duration > 0) {
        seekTime = Math.min(1.0, Math.max(0.2, video.duration * 0.1));
      }
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanupAndResolve(blob);
            },
            'image/jpeg',
            0.85
          );
        } else {
          cleanupAndResolve(null);
        }
      } catch (err) {
        console.warn('Failed to capture video poster blob:', err);
        cleanupAndResolve(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      cleanupAndResolve(null);
    };

    video.src = videoUrl;
  });
}
