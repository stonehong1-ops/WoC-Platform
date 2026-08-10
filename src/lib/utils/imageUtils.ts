/**
 * Google Places Photo URL 방어 유틸리티
 * 
 * P0 수술: Google Places Photo를 WoC 이미지 체계에서 완전 제거하기 위한 공통 함수.
 * Legacy API(maps.googleapis.com)와 New API(places.googleapis.com) 모두 차단.
 */

// ── 카테고리별 Fallback 이미지 경로 ──
const VENUE_FALLBACK_IMAGES: Record<string, string> = {
  // 댄스/탱고/살사 관련
  'Studio': '/images/fallback/venue-studio.jpg',
  'Academy': '/images/fallback/venue-studio.jpg',
  'Club': '/images/fallback/venue-studio.jpg',

  // 요가 관련
  'Yoga': '/images/fallback/venue-yoga.jpg',

  // 쇼핑/뷰티 관련
  'Shop': '/images/fallback/venue-shop.jpg',
  'Beauty': '/images/fallback/venue-shop.jpg',

  // 기타
  'Stay': '/images/fallback/venue-default.jpg',
  'Cafe': '/images/fallback/venue-default.jpg',
  'Eats': '/images/fallback/venue-default.jpg',
};

const DEFAULT_FALLBACK = '/images/fallback/venue-default.jpg';

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

/**
 * Venue/Group 이미지 URL을 안전하게 반환
 * 
 * - 정상 자체 이미지 → 원본 URL
 * - Google Places Photo → 카테고리 기본 실사진
 * - 빈 URL → 카테고리 기본 실사진
 * - 잘못된 URL → 카테고리 기본 실사진
 * 
 * @param url 원본 이미지 URL
 * @param category Venue 카테고리 (Studio, Club, Yoga 등)
 * @returns 안전한 이미지 URL (항상 실제 사진 경로 반환, 빈 문자열 반환 금지)
 */
export function getSafeImageUrl(
  url: string | undefined | null,
  category?: string
): string {
  // 빈 URL이면 fallback
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getFallbackImage(category);
  }

  // Google Places Photo URL이면 fallback
  if (isGooglePlacesPhotoUrl(url)) {
    return getFallbackImage(category);
  }

  return url;
}

/**
 * 카테고리에 맞는 fallback 이미지 경로 반환
 */
function getFallbackImage(category?: string): string {
  if (!category) return DEFAULT_FALLBACK;
  return VENUE_FALLBACK_IMAGES[category] || DEFAULT_FALLBACK;
}

/**
 * Google Places Photo URL 저장 차단 validation 메시지
 */
export const GOOGLE_PHOTO_BLOCK_MESSAGE = 
  'Google Places Photo URL은 대표 이미지로 사용할 수 없습니다. 직접 이미지를 업로드해주세요.';
