import { SocialRadarCandidate } from '../types';

export type MiniSocial = {
  id: string;
  title: string;
  titleNative?: string;
  venueId?: string;
  venueName?: string;
  venueNameNative?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  djName?: string;
  organizerName?: string;
  organizerNameNative?: string;
  recurrence?: string;
  description?: string;
  imageUrl?: string;
};

/**
 * Calculates similarity between two strings (Levensthein distance based ratio)
 */
function getStringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Match a candidate against all existing socials
 */
export function matchSocialCandidate(
  candidateExtracted: SocialRadarCandidate['extracted'],
  existingSocials: MiniSocial[]
): {
  status: SocialRadarCandidate['match']['status'];
  socialId?: string;
  socialTitle?: string;
  confidence: number;
  reason: string;
  detectedChanges: SocialRadarCandidate['detectedChanges'];
} {
  const { title, venue, dj, organizer, startTime, endTime, dayOfWeek } = candidateExtracted;
  
  if (!title && !venue) {
    return {
      status: 'unknown',
      confidence: 0,
      reason: '후보의 정보(제목/장소)가 너무 부족하여 매칭을 진행할 수 없습니다.',
      detectedChanges: {}
    };
  }

  let bestMatch: MiniSocial | null = null;
  let maxScore = 0;
  let matchReason = '';

  for (const social of existingSocials) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Venue Match (최우선)
    if (venue && social.venueNameNative) {
      const vSim = getStringSimilarity(venue, social.venueNameNative);
      const vEngSim = social.venueName ? getStringSimilarity(venue, social.venueName) : 0;
      const finalVSim = Math.max(vSim, vEngSim);
      if (finalVSim > 0.8) {
        score += 35;
        reasons.push('장소 유사(80%+)');
      } else if (finalVSim > 0.5) {
        score += 15;
        reasons.push('장소 부분 일치');
      }
    }

    // 2. Title Match (이름 대조)
    if (title) {
      const tSim = getStringSimilarity(title, social.title);
      const tNativeSim = social.titleNative ? getStringSimilarity(title, social.titleNative) : 0;
      const finalTSim = Math.max(tSim, tNativeSim);
      if (finalTSim > 0.8) {
        score += 30;
        reasons.push('제목 유사(80%+)');
      } else if (finalTSim > 0.5) {
        score += 15;
        reasons.push('제목 부분 일치');
      }
    }

    // 3. Organizer Match (주최자 대조)
    if (organizer && (social.organizerName || social.organizerNameNative)) {
      const orgSim = social.organizerName ? getStringSimilarity(organizer, social.organizerName) : 0;
      const orgNativeSim = social.organizerNameNative ? getStringSimilarity(organizer, social.organizerNameNative) : 0;
      if (Math.max(orgSim, orgNativeSim) > 0.7) {
        score += 15;
        reasons.push('주최자 유사');
      }
    }

    // 4. Day of Week Match (요일 대조)
    if (dayOfWeek !== undefined && social.dayOfWeek !== undefined) {
      if (parseInt(dayOfWeek) === social.dayOfWeek) {
        score += 15;
        reasons.push('요일 일치');
      }
    }

    // 5. Time Match (시간 대조)
    if (startTime && social.startTime) {
      if (startTime === social.startTime) {
        score += 5;
        reasons.push('시작시간 일치');
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = social;
      matchReason = reasons.join(', ');
    }
  }

  // 매칭 신뢰도에 따른 상태 매핑
  let status: SocialRadarCandidate['match']['status'] = 'new_candidate';
  let confidence = Math.min(maxScore, 100);

  if (confidence >= 70) {
    status = 'matched';
  } else if (confidence >= 35) {
    status = 'possible_match';
  } else {
    status = 'new_candidate';
  }

  // 변경 감지 (matched 거나 possible_match 일 때만 유의미)
  const detectedChanges: SocialRadarCandidate['detectedChanges'] = {};
  if (bestMatch && (status === 'matched' || status === 'possible_match')) {
    // 1. DJ 변경 감지
    if (dj && bestMatch.djName) {
      const djClean = dj.replace(/dj\s*/i, '').trim();
      const matchDjClean = bestMatch.djName.trim();
      if (djClean.toLowerCase() !== matchDjClean.toLowerCase() && getStringSimilarity(djClean, matchDjClean) < 0.6) {
        detectedChanges.dj = true;
      }
    } else if (dj && !bestMatch.djName) {
      detectedChanges.dj = true;
    }

    // 2. 시간 변경 감지
    if (startTime && bestMatch.startTime && startTime !== bestMatch.startTime) {
      detectedChanges.time = true;
    }
    if (endTime && bestMatch.endTime && endTime !== bestMatch.endTime) {
      detectedChanges.time = true;
    }

    // 3. 장소 변경 감지
    if (venue && bestMatch.venueNameNative) {
      const vSim = getStringSimilarity(venue, bestMatch.venueNameNative);
      if (vSim < 0.5) {
        detectedChanges.venue = true;
      }
    }

    // 4. 설명 변경 감지 (설명문 내 특정 텍스트 비교)
    if (candidateExtracted.description && bestMatch.description) {
      const descSim = getStringSimilarity(candidateExtracted.description, bestMatch.description);
      if (descSim < 0.7) {
        detectedChanges.description = true;
      }
    } else if (candidateExtracted.description && !bestMatch.description) {
      detectedChanges.description = true;
    }

    // 5. 새 포스터 변경 감지
    if (candidateExtracted.posterUrl && !bestMatch.imageUrl) {
      detectedChanges.poster = true;
    } else if (candidateExtracted.posterUrl && bestMatch.imageUrl) {
      detectedChanges.poster = true; // 새로운 포스터 후보 감지
    }
  } else {
    detectedChanges.newSocial = true;
  }

  return {
    status,
    socialId: bestMatch?.id,
    socialTitle: bestMatch ? (bestMatch.titleNative || bestMatch.title) : undefined,
    confidence,
    reason: bestMatch 
      ? `기존 소셜 '${bestMatch.titleNative || bestMatch.title}'와(과) ${confidence}% 확률로 매칭되었습니다. (${matchReason})`
      : '일치하는 기존 소셜이 발견되지 않았습니다. 신규 등록 후보일 수 있습니다.',
    detectedChanges
  };
}
