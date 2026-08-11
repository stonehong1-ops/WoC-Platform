/**
 * Google Places Photo URL 방어 유틸리티
 * 
 * P0 수술: Google Places Photo를 WoC 이미지 체계에서 완전 제거하기 위한 공통 함수.
 * Legacy API(maps.googleapis.com)와 New API(places.googleapis.com) 모두 차단.
 */

/**
 * Google Places Photo URL인지 판별
 * Legacy API와 New API 모두 감지
 */
export function isGooglePlacesPhotoUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    const path = urlObj.pathname;
    const params = urlObj.searchParams;

    // Legacy: maps.googleapis.com/maps/api/place/photo
    if (host === 'maps.googleapis.com' && path.includes('/place/photo')) {
      return true;
    }

    // New: places.googleapis.com/.../photos/.../media
    if (host === 'places.googleapis.com') {
      if (path.includes('/photos/') || path.includes('/media')) {
        return true;
      }
    }

    // photo_reference 파라미터가 포함된 googleapis URL
    if (host.endsWith('.googleapis.com') && params.has('photo_reference')) {
      return true;
    }

    return false;
  } catch {
    // URL 파싱 실패 시 문자열 기반 검사 (상대 경로 등)
    if (url.includes('maps.googleapis.com/maps/api/place/photo')) return true;
    if (url.includes('places.googleapis.com') && (url.includes('/photos/') || url.includes('/media'))) return true;
    if (url.includes('photo_reference=')) return true;
    return false;
  }
}

/*
 * 여기 있던 `getSafeImageUrl` 은 사진이 없거나 막힌 URL 일 때 카테고리별 스톡 사진
 * (`/images/fallback/venue-studio.jpg` 등)을 돌려줬다. 그러면 사진을 올린 적 없는
 * 장소가 남의 스튜디오 사진을 자기 사진처럼 달고 나온다. 사진이 없는 자리는
 * 중립 placeholder 로 비워 두는 게 맞다.
 *
 * 아무도 쓰지 않는 함수였고, 대신 쓸 것은 표시 우선순위를 한 곳에서 정하는
 * `resolveSocialDisplayImage`(src/lib/utils/socialUtils.ts) 다.
 */
