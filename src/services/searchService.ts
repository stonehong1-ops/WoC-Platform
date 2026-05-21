import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export interface SearchResultItem {
  id: string;
  type: 'shop' | 'class' | 'event' | 'group';
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
}

export const searchService = {
  /**
   * 전역 검색: 다중 컬렉션을 병렬로 쿼리하여 결과를 통합합니다.
   * 기본적으로 title(또는 name) 필드에 대해 접두사(Prefix) 검색을 수행합니다.
   * 추후 Algolia나 searchKeywords 배열 검색으로 확장이 용이하도록 설계되었습니다.
   */
  async globalSearch(searchQuery: string): Promise<SearchResultItem[]> {
    if (!searchQuery.trim()) return [];
    
    const queryText = searchQuery.trim();
    const endText = queryText + '\uf8ff';
    const results: SearchResultItem[] = [];

    try {
      // Promise.allSettled를 사용하여 일부 컬렉션 쿼리 실패 시에도 전체가 중단되지 않도록 보호
      const [shopDocs, classDocs, eventDocs, groupDocs] = await Promise.allSettled([
        getDocs(query(collection(db, 'shops'), where('title', '>=', queryText), where('title', '<=', endText), limit(5))),
        getDocs(query(collection(db, 'classes'), where('title', '>=', queryText), where('title', '<=', endText), limit(5))),
        getDocs(query(collection(db, 'events'), where('title', '>=', queryText), where('title', '<=', endText), limit(5))),
        // 그룹은 보통 name을 사용할 가능성이 큼
        getDocs(query(collection(db, 'groups'), where('name', '>=', queryText), where('name', '<=', endText), limit(5)))
      ]);

      if (shopDocs.status === 'fulfilled') {
        shopDocs.value.docs.forEach(doc => {
          const data = doc.data();
          results.push({
            id: doc.id,
            type: 'shop',
            title: data.title || 'Unknown',
            subtitle: data.price ? `₩ ${data.price.toLocaleString()}` : '',
            image: data.image || data.imageUrl || data.thumbnail || '',
            url: `/shop/${doc.id}`
          });
        });
      }

      if (classDocs.status === 'fulfilled') {
        classDocs.value.docs.forEach(doc => {
          const data = doc.data();
          results.push({
            id: doc.id,
            type: 'class',
            title: data.title || 'Unknown',
            subtitle: data.instructor || data.teacher || '',
            image: data.image || data.imageUrl || data.thumbnail || '',
            url: `/class/${doc.id}`
          });
        });
      }

      if (eventDocs.status === 'fulfilled') {
        eventDocs.value.docs.forEach(doc => {
          const data = doc.data();
          results.push({
            id: doc.id,
            type: 'event',
            title: data.title || 'Unknown',
            subtitle: data.date || data.location || '',
            image: data.image || data.imageUrl || data.thumbnail || '',
            url: `/events/${doc.id}`
          });
        });
      }

      if (groupDocs.status === 'fulfilled') {
        groupDocs.value.docs.forEach(doc => {
          const data = doc.data();
          results.push({
            id: doc.id,
            type: 'group',
            title: data.name || data.title || 'Unknown',
            subtitle: data.memberCount ? `${data.memberCount} members` : '',
            image: data.image || data.imageUrl || data.profileImage || data.thumbnail || '',
            url: `/groups/${doc.id}`
          });
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
      const [shopDocs, classDocs, eventDocs, groupDocs] = await Promise.allSettled([
        getDocs(query(collection(db, 'shops'), limit(4))),
        getDocs(query(collection(db, 'classes'), limit(4))),
        getDocs(query(collection(db, 'events'), limit(3))),
        getDocs(query(collection(db, 'groups'), limit(4)))
      ]);

      const formatDocs = (docsResult: any, type: string) => {
        if (docsResult.status !== 'fulfilled') return [];
        return docsResult.value.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            type,
            title: data.title || data.name || 'Unknown',
            subtitle: data.price ? `₩ ${data.price.toLocaleString()}` : data.instructor || data.location || data.date || (data.memberCount ? `${data.memberCount} members` : ''),
            image: data.image || data.imageUrl || data.thumbnail || data.profileImage || '',
            url: `/${type === 'group' ? 'groups' : type === 'event' ? 'events' : type}/${doc.id}`
          };
        });
      };

      return {
        shops: formatDocs(shopDocs, 'shop'),
        classes: formatDocs(classDocs, 'class'),
        events: formatDocs(eventDocs, 'event'),
        groups: formatDocs(groupDocs, 'group')
      };
    } catch (error) {
      console.error("Initial data fetch error:", error);
      return { shops: [], classes: [], events: [], groups: [] };
    }
  }
};
