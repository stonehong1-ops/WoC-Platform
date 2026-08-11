import { Social } from '@/types/social';

export function getNextEventDateObj(social: Social): Date | null {
  if (social.type === "popup" && social.date) {
    return typeof social.date.toDate === "function" ? social.date.toDate() : new Date(social.date as any);
  }
  if (social.type === "regular" && social.dayOfWeek !== undefined) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = (social.dayOfWeek - today.getDay() + 7) % 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next;
  }
  return null;
}

export function getDjDisplay(social: Social, targetDate?: Date, locale: string = "KR"): string {
  if (social.djs && social.djs.length > 0) {
    const nextEventDate = targetDate || getNextEventDateObj(social);
    
    if (nextEventDate) {
      const year = nextEventDate.getFullYear();
      const month = String(nextEventDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextEventDate.getDate()).padStart(2, '0');
      const nextEventDateStr = `${year}-${month}-${day}`;

      const matchedDj = social.djs.find(d => d.date === nextEventDateStr);
      if (matchedDj) {
        if (locale === "KR") {
          return matchedDj.djNativeName || matchedDj.djName;
        }
        return matchedDj.djName;
      }
    } else {
      const sorted = [...social.djs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const today = new Date();
      today.setHours(0,0,0,0);
      const nextDj = sorted.find(d => new Date(d.date) >= today);
      if (nextDj) {
        if (locale === "KR") {
          return nextDj.djNativeName || nextDj.djName;
        }
        return nextDj.djName;
      }
    }
  }
  return "";
}

/**
 * 목록·상세에서 보여줄 Social 대표 이미지를 고른다.
 *
 * 같은 우선순위 식이 화면마다 복사돼 있었고 서로 달랐다. 어떤 곳은 Venue 사진까지
 * 내려갔고 어떤 곳은 거기서 멈춰서, 같은 Social 이 목록에선 사진이 보이고 상세에선
 * 빈 자리로 보였다. 판단은 여기 한 곳에서만 한다.
 *
 * 고를 게 없으면 `undefined` 를 돌려준다. **대신 채울 스톡 사진은 없다.** 사진이 없는
 * 곳에 그럴듯한 남의 사진을 넣으면 사용자가 그 장소의 사진으로 오해한다. 빈 자리는
 * 화면 쪽에서 중립 placeholder 로 처리한다.
 *
 * @param venue 이 Social 이 열리는 장소. 넘기지 않으면 Venue 폴백을 쓰지 않는다.
 *              작성·수정 화면처럼 "실제로 저장된 Social 이미지"만 보여야 하는 곳은
 *              일부러 넘기지 않는다.
 */
export function resolveSocialDisplayImage(
  social: Pick<Social, 'imageUrl' | 'posterExportUrl' | 'posterLayoutId'>,
  venue?: { imageUrl?: string } | null
): string | undefined {
  // 포스터 레이아웃이 걸려 있으면 그 위에 DJ·일정이 겹쳐 그려진다.
  // 원본으로 지정한 이미지가 아닌 걸 깔면 포스터 디자인이 어긋나므로 폴백하지 않는다.
  const hasPoster = social.posterLayoutId && social.posterLayoutId !== 'none';
  if (hasPoster) return social.imageUrl || undefined;

  return social.posterExportUrl || social.imageUrl || venue?.imageUrl || undefined;
}

export function isVideoUrl(url?: string, fileType?: string): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) {
    return fileType?.startsWith('video/') || false;
  }
  const decoded = decodeURIComponent(url.split('?')[0]).toLowerCase();
  return decoded.endsWith('.mp4') || decoded.endsWith('.mov') || decoded.endsWith('.webm') || decoded.endsWith('.m3u8') || decoded.endsWith('.avi');
}

export function getEventMessage(social: Social, targetDate?: Date): string | null {
  if (social.type === "regular" && social.djs && social.djs.length > 0) {
    const nextEventDate = targetDate || getNextEventDateObj(social);
    if (nextEventDate) {
      const year = nextEventDate.getFullYear();
      const month = String(nextEventDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextEventDate.getDate()).padStart(2, '0');
      const nextEventDateStr = `${year}-${month}-${day}`;

      const matchedDj = social.djs.find(d => d.date === nextEventDateStr);
      if (matchedDj && matchedDj.message) {
        return matchedDj.message.trim().slice(0, 10);
      }
    }
  }
  return null;
}
