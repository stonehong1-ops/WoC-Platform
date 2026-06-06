import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export interface SearchResultItem {
  id: string;
  type: 'product' | 'event' | 'social' | 'group' | 'venue' | 'person';
  title: string;
  titleKo?: string;
  subtitle?: string;
  subtitleKo?: string;
  image?: string;
  url: string;

  // 다국어 명칭 정제를 위한 추가 필드
  venueName?: string;
  venueNameNative?: string;
  djName?: string;
  organizerName?: string;
  organizerNameNative?: string;
  startTime?: string;

  // 역할 정보 명세 필드
  roleLabel?: string;
  roleLabelKo?: string;
}

/**
 * 여러 텍스트 필드 중 하나라도 queryText를 포함하면 true를 반환합니다.
 * 한글·영문 대소문자 무관 부분 문자열 매칭.
 */
function matchesAny(queryText: string, ...fields: (string | undefined | null)[]): boolean {
  return fields.some(f => f && f.toLowerCase().includes(queryText));
}

export const searchService = {
  /**
   * 전역 검색: 실제 Firestore 컬렉션 7개를 병렬 조회한 뒤 클라이언트 필터링으로 통합 결과를 반환합니다.
   * 한글 전용 필드(titleNative, nativeName, nameKo 등)를 함께 매칭하여 한/영 양방향 검색을 지원합니다.
   */
  async globalSearch(searchQuery: string): Promise<SearchResultItem[]> {
    if (!searchQuery.trim()) return [];
    
    const queryText = searchQuery.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    try {
      const [productDocs, eventDocs, socialDocs, groupDocs, venueDocs, userDocs, peopleDocs] = await Promise.allSettled([
        getDocs(query(collection(db, 'products'), limit(100))),
        getDocs(query(collection(db, 'events'), limit(100))),
        getDocs(query(collection(db, 'socials'), limit(100))),
        getDocs(query(collection(db, 'groups'), limit(100))),
        getDocs(query(collection(db, 'venues'), limit(100))),
        getDocs(query(collection(db, 'users'), limit(500))),
        getDocs(query(collection(db, 'people'), limit(50)))
      ]);

      // Products (상품)
      if (productDocs.status === 'fulfilled') {
        productDocs.value.docs.forEach(doc => {
          const data = doc.data();
          if (matchesAny(queryText, data.title, data.description, data.brand, data.groupName)) {
            results.push({
              id: doc.id,
              type: 'product',
              title: data.title || 'Unknown',
              titleKo: data.titleNative || '',
              subtitle: data.price ? `₩ ${Number(data.price).toLocaleString()}` : data.brand || '',
              image: data.images?.[0] || data.image || data.imageUrl || data.thumbnail || '',
              url: `/shop?productId=${doc.id}`
            });
          }
        });
      }

      // Events (이벤트·페스티벌)
      if (eventDocs.status === 'fulfilled') {
        eventDocs.value.docs.forEach(doc => {
          const data = doc.data();
          if (matchesAny(queryText, data.title, data.titleNative, data.description, data.hostName, data.organizerName, data.location)) {
            results.push({
              id: doc.id,
              type: 'event',
              title: data.title || 'Unknown',
              titleKo: data.titleNative || '',
              subtitle: data.location || data.organizerName || '',
              image: data.imageUrl || data.image || data.thumbnail || '',
              url: `/events?eventId=${doc.id}`
            });
          }
        });
      }

      // Socials (밀롱가·쁘락티카)
      if (socialDocs.status === 'fulfilled') {
        socialDocs.value.docs.forEach(doc => {
          const data = doc.data();
          if (matchesAny(queryText, data.title, data.titleNative, data.venueName, data.venueNameNative, data.organizerName, data.organizerNameNative, data.djName, data.district)) {
            results.push({
              id: doc.id,
              type: 'social',
              title: data.title || 'Unknown',
              titleKo: data.titleNative || '',
              venueName: data.venueName || '',
              venueNameNative: data.venueNameNative || '',
              djName: data.djName || '',
              organizerName: data.organizerName || '',
              organizerNameNative: data.organizerNameNative || '',
              startTime: data.startTime || '',
              image: data.imageUrl || data.posterExportUrl || '',
              url: `/social?viewSocial=${doc.id}`
            });
          }
        });
      }

      // Groups (그룹·스튜디오)
      if (groupDocs.status === 'fulfilled') {
        groupDocs.value.docs.forEach(doc => {
          const data = doc.data();
          if (matchesAny(queryText, data.name, data.nativeName, data.description)) {
            results.push({
              id: doc.id,
              type: 'group',
              title: data.name || 'Unknown',
              titleKo: data.nativeName || '',
              subtitle: data.memberCount ? `${data.memberCount} members` : '',
              subtitleKo: data.memberCount ? `멤버 ${data.memberCount}명` : '',
              image: data.logo || data.coverImage || data.profileImage || '',
              url: `/groups/${doc.id}`
            });
          }
        });
      }

      // Venues (장소)
      if (venueDocs.status === 'fulfilled') {
        venueDocs.value.docs.forEach(doc => {
          const data = doc.data();
          if (matchesAny(queryText, data.name, data.nameKo, data.address, data.city, data.region)) {
            results.push({
              id: doc.id,
              type: 'venue',
              title: data.name || 'Unknown',
              titleKo: data.nameKo || '',
              subtitle: data.address || data.region || '',
              image: data.imageUrl || '',
              url: `/venues/${doc.id}`
            });
          }
        });
      }



      // People (인물·마에스트로)
      if (peopleDocs.status === 'fulfilled') {
        peopleDocs.value.docs.forEach(doc => {
          const data = doc.data();
          if (matchesAny(queryText, data.name, data.title)) {
            const rolesArr = data.roles || [];
            let roleLabel = 'Maestro';
            let roleLabelKo = '마에스트로';

            if (rolesArr.length > 0) {
              const primaryRole = rolesArr[0];
              if (primaryRole === 'Instructor') {
                roleLabel = 'Instructor';
                roleLabelKo = '강사';
              } else if (primaryRole === 'Organizer') {
                roleLabel = 'Organizer';
                roleLabelKo = '오거나이저';
              } else if (primaryRole === 'Couple') {
                roleLabel = 'Couple';
                roleLabelKo = '커플';
              } else if (primaryRole === 'Touring') {
                roleLabel = 'Touring';
                roleLabelKo = '투어';
              } else if (primaryRole === 'Dancer') {
                roleLabel = 'Dancer';
                roleLabelKo = '댄서';
              }
            }

            results.push({
              id: doc.id,
              type: 'person',
              title: data.name || 'Unknown',
              titleKo: data.name || '',
              subtitle: data.title || '',
              image: data.photoURL || data.imageUrl || '',
              url: `/people/${doc.id}`,
              roleLabel,
              roleLabelKo
            });
          }
        });
      }

      // Users (사용자)
      if (userDocs.status === 'fulfilled') {
        userDocs.value.docs.forEach(doc => {
          const data = doc.data();
          if (matchesAny(queryText, data.name, data.nickname, data.nativeNickname, data.email)) {
            if (results.some(r => r.id === doc.id && r.type === 'person')) return;

            let roleLabel = 'Member';
            let roleLabelKo = '멤버';

            if (data.isInstructor) {
              roleLabel = 'Instructor';
              roleLabelKo = '강사';
            } else if (data.isOrganizer) {
              roleLabel = 'Organizer';
              roleLabelKo = '오거나이저';
            } else if (data.isDj) {
              roleLabel = 'DJ';
              roleLabelKo = 'DJ';
            } else if (data.isAdmin) {
              roleLabel = 'Admin';
              roleLabelKo = '관리자';
            } else if (data.role === 'leader') {
              roleLabel = 'Leader';
              roleLabelKo = '리더';
            } else if (data.role === 'follower') {
              roleLabel = 'Follower';
              roleLabelKo = '팔로워';
            }

            results.push({
              id: doc.id,
              type: 'person',
              title: data.nickname || data.name || data.nativeNickname || 'Unknown',
              titleKo: data.nativeNickname || data.nickname || data.name || '',
              subtitle: data.email || '',
              image: data.photoURL || '',
              url: `/people/${doc.id}`,
              roleLabel,
              roleLabelKo
            });
          }
        });
      }

    } catch (error) {
      console.error("Global search error:", error);
    }

    return results;
  },

  /**
   * 기본 탐색 화면용: 각 컬렉션별 최신/인기 데이터를 몇 개씩 가져옵니다.
   */
  async getInitialData() {
    try {
      const [productDocs, socialDocs, eventDocs, groupDocs, peopleDocs] = await Promise.allSettled([
        getDocs(query(collection(db, 'products'), limit(4))),
        getDocs(query(collection(db, 'socials'), limit(4))),
        getDocs(query(collection(db, 'events'), limit(3))),
        getDocs(query(collection(db, 'groups'), limit(4))),
        getDocs(query(collection(db, 'people'), limit(4)))
      ]);

      const formatProducts = (docsResult: PromiseSettledResult<any>) => {
        if (docsResult.status !== 'fulfilled') return [];
        return docsResult.value.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'product' as const,
            title: data.title || 'Unknown',
            titleKo: data.titleNative || '',
            subtitle: data.price ? `₩ ${Number(data.price).toLocaleString()}` : data.brand || '',
            image: data.images?.[0] || data.image || data.imageUrl || '',
            url: `/shop/${doc.id}`
          };
        });
      };

      const formatSocials = (docsResult: PromiseSettledResult<any>) => {
        if (docsResult.status !== 'fulfilled') return [];
        return docsResult.value.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'social' as const,
            title: data.title || 'Unknown',
            titleKo: data.titleNative || '',
            venueName: data.venueName || '',
            venueNameNative: data.venueNameNative || '',
            djName: data.djName || '',
            organizerName: data.organizerName || '',
            organizerNameNative: data.organizerNameNative || '',
            startTime: data.startTime || '',
            image: data.imageUrl || data.posterExportUrl || '',
            url: `/social/${doc.id}`
          };
        });
      };

      const formatEvents = (docsResult: PromiseSettledResult<any>) => {
        if (docsResult.status !== 'fulfilled') return [];
        return docsResult.value.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'event' as const,
            title: data.title || 'Unknown',
            titleKo: data.titleNative || '',
            subtitle: data.location || data.organizerName || '',
            image: data.imageUrl || data.image || '',
            url: `/events/${doc.id}`
          };
        });
      };

      const formatGroups = (docsResult: PromiseSettledResult<any>) => {
        if (docsResult.status !== 'fulfilled') return [];
        return docsResult.value.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'group' as const,
            title: data.name || 'Unknown',
            titleKo: data.nativeName || '',
            subtitle: data.memberCount ? `${data.memberCount} members` : '',
            subtitleKo: data.memberCount ? `멤버 ${data.memberCount}명` : '',
            image: data.logo || data.coverImage || data.profileImage || '',
            url: `/groups/${doc.id}`
          };
        });
      };

      const formatPeople = (docsResult: PromiseSettledResult<any>) => {
        if (docsResult.status !== 'fulfilled') return [];
        return docsResult.value.docs.map((doc: any) => {
          const data = doc.data();

          const rolesArr = data.roles || [];
          let roleLabel = 'Maestro';
          let roleLabelKo = '마에스트로';

          if (rolesArr.length > 0) {
            const primaryRole = rolesArr[0];
            if (primaryRole === 'Instructor') {
              roleLabel = 'Instructor';
              roleLabelKo = '강사';
            } else if (primaryRole === 'Organizer') {
              roleLabel = 'Organizer';
              roleLabelKo = '오거나이저';
            } else if (primaryRole === 'Couple') {
              roleLabel = 'Couple';
              roleLabelKo = '커플';
            } else if (primaryRole === 'Touring') {
              roleLabel = 'Touring';
              roleLabelKo = '투어';
            } else if (primaryRole === 'Dancer') {
              roleLabel = 'Dancer';
              roleLabelKo = '댄서';
            }
          }

          return {
            id: doc.id,
            type: 'person' as const,
            title: data.name || 'Unknown',
            titleKo: data.name || '',
            subtitle: data.title || '',
            image: data.photoURL || data.imageUrl || '',
            url: `/people/${doc.id}`,
            roleLabel,
            roleLabelKo
          };
        });
      };

      return {
        shops: formatProducts(productDocs),
        socials: formatSocials(socialDocs),
        events: formatEvents(eventDocs),
        groups: formatGroups(groupDocs),
        people: formatPeople(peopleDocs)
      };
    } catch (error) {
      console.error("Initial data fetch error:", error);
      return { shops: [], socials: [], events: [], groups: [], people: [] };
    }
  }
};
