'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { Social } from '@/types/social';
import { tabCache } from '@/lib/utils/tabCache';

const CACHE_KEY = 'social:global:allCountries';

/**
 * GLOBAL 국가/도시 selector용 — 날짜와 무관하게 "해외 국가가 존재하는지" 자체를 판단하기 위한
 * 1회성 전체 로드. country가 'KOREA'가 아닌 문서만 가져온다 (country 필드가 아예 없는
 * 국내 레거시 문서는 이 쿼리에 잡히지 않음 — 의도된 동작).
 */
export function useAllGlobalSocials() {
  const [allGlobalSocials, setAllGlobalSocials] = useState<Social[]>(() => tabCache.getStale(CACHE_KEY) || []);

  useEffect(() => {
    tabCache.fetchExclusive(CACHE_KEY, async () => {
      const q = query(collection(db, 'socials'), where('country', '!=', 'KOREA'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Social);
    }).then(setAllGlobalSocials).catch(console.error);
  }, []);

  return allGlobalSocials;
}
