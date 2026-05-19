import { socialService } from './socialService';
import { eventService } from './eventService';
import { db } from './clientApp';
import { 
  collectionGroup, 
  query, 
  getDocs, 
  where,
  collection,
  doc,
  getDoc
} from 'firebase/firestore';
import { Social } from '@/types/social';
import { Event } from '@/types/event';
import { GroupClass, Group } from '@/types/group';

export interface TagSearchResult {
  type: 'group' | 'social' | 'event' | 'class' | 'people';
  id: string;
  name: string;
  subtitle: string;
  groupId?: string;
  instructors?: string;
  avatar?: string;
  role?: string;
}

/**
 * Unified TAG Search Service v2
 * 5 Subjects: Group, Social, Event, Class, People
 */
export const tagSearchService = {

  /**
   * Search all 5 resource types by keyword
   */
  async searchAll(keyword: string): Promise<TagSearchResult[]> {
    if (!keyword || keyword.length < 1) return [];

    const lowerKw = keyword.toLowerCase();

    const [
      groupResults,
      socialResults,
      eventResults,
      classResults,
      peopleResults
    ] = await Promise.all([
      this.searchGroups(keyword),
      socialService.searchSocials(keyword),
      eventService.searchEvents(keyword),
      this.searchClasses(keyword),
      this.searchPeople(keyword),
    ]);

    const groups = groupResults;

    const socials = socialResults.map((s: any) => {
      const title = s.title || s.name || '';
      const native = s.titleNative || '';
      return {
        type: 'social' as const,
        id: s.id,
        name: native ? `${title} ${native}` : title,
        subtitle: s.venueName || s.organizerName || '',
      };
    });

    const events = eventResults.map((e: any) => ({
      type: 'event' as const,
      id: e.id,
      name: e.title || '',
      subtitle: e.venueName || e.location || '',
    }));

    return [...groups, ...socials, ...events, ...classResults, ...peopleResults];
  },

  /**
   * Search groups by name
   */
  async searchGroups(keyword: string): Promise<TagSearchResult[]> {
    if (!keyword) return [];
    try {
      const lowerKw = keyword.toLowerCase();
      const snap = await getDocs(collection(db, 'groups'));
      const results: TagSearchResult[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        const name = (data.name || '').toLowerCase();
        const nativeName = (data.nativeName || '').toLowerCase();
        if (name.includes(lowerKw) || nativeName.includes(lowerKw)) {
          const native = data.nativeName || '';
          results.push({
            type: 'group' as const,
            id: d.id,
            name: native ? `${data.name || ''} ${native}` : (data.name || ''),
            subtitle: data.address || '',
            avatar: data.logo || data.coverImage || '',
          });
        }
      });
      return results;
    } catch (e) {
      console.error('Group search error:', e);
      return [];
    }
  },

  /**
   * Search classes across all groups using collectionGroup query
   */
  async searchClasses(keyword: string): Promise<TagSearchResult[]> {
    if (!keyword) return [];
    try {
      const lowerKw = keyword.toLowerCase();
      const snapshot = await getDocs(collectionGroup(db, 'classes'));

      const results: TagSearchResult[] = [];
      snapshot.docs.forEach(d => {
        const data = d.data() as GroupClass;
        if ((data.title || '').toLowerCase().includes(lowerKw)) {
          const pathSegments = d.ref.path.split('/');
          const groupId = pathSegments[1] || '';
          const instructorNames = data.instructors?.map(i => i.name).join(', ') || '';
          results.push({
            type: 'class' as const,
            id: d.id,
            name: data.title,
            subtitle: instructorNames ? `by ${instructorNames}` : '',
            groupId,
            instructors: instructorNames ? `by ${instructorNames}` : undefined,
          });
        }
      });
      return results;
    } catch (error) {
      console.error('Class search error:', error);
      return [];
    }
  },

  /**
   * Search people (users) by nickname
   */
  async searchPeople(keyword: string): Promise<TagSearchResult[]> {
    if (!keyword) return [];
    try {
      const lowerKw = keyword.toLowerCase();
      const snap = await getDocs(collection(db, 'users'));
      const results: TagSearchResult[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        const nick = (data.nickname || '').toLowerCase();
        const native = (data.nativeNickname || '').toLowerCase();
        if (nick.includes(lowerKw) || native.includes(lowerKw)) {
          const nativeName = data.nativeNickname || '';
          results.push({
            type: 'people' as const,
            id: d.id,
            name: nativeName ? `${data.nickname || ''} ${nativeName}` : (data.nickname || ''),
            subtitle: data.role || '',
            avatar: data.photoURL || '',
          });
        }
      });
      return results;
    } catch (e) {
      console.error('People search error:', e);
      return [];
    }
  },

  /**
   * Get user's joined groups
   */
  async getUserGroups(joinedGroupIds: string[]): Promise<TagSearchResult[]> {
    if (!joinedGroupIds || joinedGroupIds.length === 0) return [];
    try {
      const results = await Promise.all(
        joinedGroupIds.slice(0, 10).map(async (gid) => {
          const snap = await getDoc(doc(db, 'groups', gid));
          if (!snap.exists()) return null;
          const data = snap.data();
          return {
            type: 'group' as const,
            id: snap.id,
            name: data.name || '',
            subtitle: data.address || '',
            avatar: data.logo || data.coverImage || '',
          };
        })
      );
      return results.filter(Boolean) as TagSearchResult[];
    } catch (e) {
      console.error('getUserGroups error:', e);
      return [];
    }
  },

  /**
   * Get today's active groups by reverse-mapping:
   *   1. Today's socials → venueIds → groups with those venueIds
   *   2. Today's classes → groupIds directly
   *   3. Current events → venueIds → groups with those venueIds
   *   + User's joined groups always included
   */
  async getTodayGroups(country: string, city: string, joinedGroupIds: string[]): Promise<TagSearchResult[]> {
    try {
      const now = new Date();
      const todayDayOfWeek = now.getDay();
      const todayStr = now.toDateString();

      // 1. Get today's socials in the city → collect venueIds
      const socialsSnap = await getDocs(collection(db, 'socials'));
      const todaySocials = socialsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }) as any)
        .filter(s => {
          const sCountry = (s.country || '').toUpperCase();
          const sCity = (s.city || '').toUpperCase();
          if (sCountry !== country.toUpperCase() || sCity !== city.toUpperCase()) return false;
          const typeStr = String(s.type || '').toLowerCase();
          if (typeStr === 'regular') {
            return s.dayOfWeek !== undefined && Number(s.dayOfWeek) === todayDayOfWeek;
          }
          if (typeStr === 'popup' && s.date) {
            const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date);
            return sDate.toDateString() === todayStr;
          }
          return false;
        });

      const socialVenueIds = new Set(todaySocials.map(s => s.venueId).filter(Boolean));

      // 2. Get current events → venueIds
      const eventsSnap = await getDocs(collection(db, 'events'));
      const activeEvents = eventsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }) as any)
        .filter(e => {
          const startMs = e.startDate?.toMillis ? e.startDate.toMillis() : 0;
          const endMs = e.endDate?.toMillis ? e.endDate.toMillis() : 0;
          return startMs <= now.getTime() && endMs >= now.getTime();
        });
      activeEvents.forEach(e => { if (e.venueId) socialVenueIds.add(e.venueId); });

      // 3. Get today's classes → groupIds
      const classGroupIds = new Set<string>();
      try {
        const classesSnap = await getDocs(collectionGroup(db, 'classes'));
        classesSnap.docs.forEach(d => {
          const data = d.data() as GroupClass;
          if (data.status !== 'Open') return;
          const hasToday = data.schedule?.some(entry => {
            if (entry.date) return new Date(entry.date).toDateString() === todayStr;
            return false;
          });
          if (hasToday) {
            const groupId = d.ref.path.split('/')[1] || '';
            if (groupId) classGroupIds.add(groupId);
          }
        });
      } catch (e) {
        console.error('getTodayGroups classes error:', e);
      }

      // 4. Fetch ALL groups and filter by matching venueId or classGroupId
      const allGroupsSnap = await getDocs(collection(db, 'groups'));
      const allGroups = allGroupsSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name || '',
        address: d.data().address || '',
        logo: d.data().logo || d.data().coverImage || '',
        venueId: d.data().venueId || '',
      }));

      const todayGroupIds = new Set<string>();

      // Groups linked to today's social/event venues
      allGroups.forEach(g => {
        if (g.venueId && socialVenueIds.has(g.venueId)) {
          todayGroupIds.add(g.id);
        }
      });

      // Groups with today's classes
      classGroupIds.forEach(gid => todayGroupIds.add(gid));

      // User's joined groups always included
      (joinedGroupIds || []).forEach(gid => todayGroupIds.add(gid));

      // Build result - ONLY groups with today's activity or user's joined
      const results: TagSearchResult[] = allGroups
        .filter(g => todayGroupIds.has(g.id))
        .map(g => ({
          type: 'group' as const,
          id: g.id,
          name: g.name,
          subtitle: '✨ Active today',
          avatar: g.logo,
        }));

      return results;
    } catch (e) {
      console.error('getTodayGroups error:', e);
      return [];
    }
  },

  /**
   * Get activities (socials, events, classes) for a selected group
   */
  async getGroupActivities(groupId: string): Promise<{
    socials: TagSearchResult[];
    events: TagSearchResult[];
    classes: TagSearchResult[];
  }> {
    try {
      const now = new Date();
      const todayDayOfWeek = now.getDay();
      const yesterdayDayOfWeek = (todayDayOfWeek + 6) % 7;
      const todayStr = now.toDateString();
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      // Socials linked to this group's venue — only today or yesterday
      const groupSnap = await getDoc(doc(db, 'groups', groupId));
      const groupData = groupSnap.exists() ? groupSnap.data() : null;
      const venueId = groupData?.venueId;

      let socials: TagSearchResult[] = [];
      if (venueId) {
        const socialsSnap = await getDocs(
          query(collection(db, 'socials'), where('venueId', '==', venueId))
        );
        socials = socialsSnap.docs
          .filter(d => {
            const s = d.data();
            const typeStr = String(s.type || '').toLowerCase();
            if (typeStr === 'regular') {
              const dow = Number(s.dayOfWeek);
              return dow === todayDayOfWeek || dow === yesterdayDayOfWeek;
            }
            if (typeStr === 'popup' && s.date) {
              const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date);
              return sDate.toDateString() === todayStr || sDate.toDateString() === yesterdayStr;
            }
            return false;
          })
          .map(d => {
            const data = d.data();
            const title = data.title || '';
            const native = data.titleNative || '';
            return {
              type: 'social' as const,
              id: d.id,
              name: native ? `${title} ${native}` : title,
              subtitle: data.organizerName || '',
            };
          });
      }

      // Events linked to this group's venue — only in progress
      let events: TagSearchResult[] = [];
      if (venueId) {
        const eventsSnap = await getDocs(
          query(collection(db, 'events'), where('venueId', '==', venueId))
        );
        events = eventsSnap.docs
          .filter(d => {
            const e = d.data();
            const startMs = e.startDate?.toMillis ? e.startDate.toMillis() : 0;
            const endMs = e.endDate?.toMillis ? e.endDate.toMillis() : 0;
            return startMs <= now.getTime() && endMs >= now.getTime();
          })
          .map(d => ({
            type: 'event' as const,
            id: d.id,
            name: d.data().title || '',
            subtitle: d.data().location || '',
          }));
      }

      // Classes in this group (subcollection)
      const classesSnap = await getDocs(collection(db, 'groups', groupId, 'classes'));
      const classes: TagSearchResult[] = classesSnap.docs
        .filter(d => d.data().status === 'Open')
        .map(d => {
          const data = d.data() as GroupClass;
          const instructorNames = data.instructors?.map(i => i.name).join(', ') || '';
          return {
            type: 'class' as const,
            id: d.id,
            name: data.title,
            subtitle: instructorNames ? `by ${instructorNames}` : '',
            groupId,
            instructors: instructorNames ? `by ${instructorNames}` : undefined,
          };
        });

      return { socials, events, classes };
    } catch (e) {
      console.error('getGroupActivities error:', e);
      return { socials: [], events: [], classes: [] };
    }
  },

  /**
   * Get today's smart suggestions (location-based)
   */
  async getSmartSuggestions(country: string, city: string): Promise<{
    socialsToday: TagSearchResult[];
    eventsInProgress: TagSearchResult[];
    classesToday: TagSearchResult[];
  }> {
    const now = new Date();
    const todayDayOfWeek = now.getDay();
    const todayStr = now.toDateString();

    try {
      // Socials today
      const socialsSnap = await getDocs(collection(db, 'socials'));
      const allSocials = socialsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      const todaySocials = allSocials.filter(s => {
        const sCountry = (s.country || '').toUpperCase();
        const sCity = (s.city || '').toUpperCase();
        if (sCountry !== country.toUpperCase() || sCity !== city.toUpperCase()) return false;

        const typeStr = String(s.type || '').toLowerCase();
        if (typeStr === 'regular') {
          return s.dayOfWeek !== undefined && Number(s.dayOfWeek) === todayDayOfWeek;
        }
        if (typeStr === 'popup' && s.date) {
          const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date);
          return sDate.toDateString() === todayStr;
        }
        return false;
      });

      const socialsToday: TagSearchResult[] = todaySocials.map(s => {
        const title = s.title || '';
        const native = s.titleNative || '';
        return {
          type: 'social',
          id: s.id,
          name: native ? `${title} ${native}` : title,
          subtitle: s.venueName || '',
        };
      });

      // Events in progress
      const eventsSnap = await getDocs(collection(db, 'events'));
      const eventsInProgress: TagSearchResult[] = eventsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }) as any)
        .filter(e => {
          const startMs = e.startDate?.toMillis ? e.startDate.toMillis() : 0;
          const endMs = e.endDate?.toMillis ? e.endDate.toMillis() : 0;
          return startMs <= now.getTime() && endMs >= now.getTime();
        })
        .map(e => ({
          type: 'event' as const,
          id: e.id,
          name: e.title || '',
          subtitle: e.venueName || e.location || '',
        }));

      // Classes today
      let classesToday: TagSearchResult[] = [];
      try {
        const classesSnap = await getDocs(collectionGroup(db, 'classes'));
        classesToday = classesSnap.docs
          .map(d => {
            const data = d.data() as GroupClass;
            const pathSegments = d.ref.path.split('/');
            const groupId = pathSegments[1] || '';
            const hasToday = data.schedule?.some(entry => {
              if (entry.date) {
                return new Date(entry.date).toDateString() === todayStr;
              }
              return false;
            });
            if (!hasToday || data.status !== 'Open') return null;
            const instructorNames = data.instructors?.map(i => i.name).join(', ') || '';
            return {
              type: 'class' as const,
              id: d.id,
              name: data.title,
              subtitle: instructorNames ? `by ${instructorNames}` : '',
              groupId,
              instructors: instructorNames ? `by ${instructorNames}` : undefined,
            };
          })
          .filter(Boolean) as TagSearchResult[];
      } catch (e) {
        console.error('Classes today error:', e);
      }

      return { socialsToday, eventsInProgress, classesToday };
    } catch (error) {
      console.error('Smart suggestions error:', error);
      return { socialsToday: [], eventsInProgress: [], classesToday: [] };
    }
  },

  /**
   * Get auto-tagged people from a selected activity
   */
  async getAutoPeople(
    activityType: 'social' | 'event' | 'class',
    activityId: string,
    groupId?: string
  ): Promise<TagSearchResult[]> {
    try {
      if (activityType === 'social') {
        const snap = await getDoc(doc(db, 'socials', activityId));
        if (snap.exists()) {
          const data = snap.data();
          const results: TagSearchResult[] = [];
          if (data.organizerId) {
            try {
              const userSnap = await getDoc(doc(db, 'users', data.organizerId));
              const userData = userSnap.exists() ? userSnap.data() : null;
              const name = userData ? (userData.nativeNickname ? `${userData.nickname || ''} ${userData.nativeNickname}` : (userData.nickname || 'Organizer')) : (data.organizerName || 'Organizer');
              results.push({
                type: 'people',
                id: data.organizerId,
                name: name,
                subtitle: 'Organizer',
                avatar: userData?.photoURL || data.organizerAvatar || '',
                role: 'organizer',
              });
            } catch {
              results.push({
                type: 'people',
                id: data.organizerId,
                name: data.organizerName || 'Organizer',
                subtitle: 'Organizer',
                avatar: data.organizerAvatar || '',
                role: 'organizer',
              });
            }
          }
          return results;
        }
      }
      if (activityType === 'event') {
        const snap = await getDoc(doc(db, 'events', activityId));
        if (snap.exists()) {
          const data = snap.data();
          const results: TagSearchResult[] = [];
          if (data.hostId) {
            // Try to get host name from users collection
            try {
              const userSnap = await getDoc(doc(db, 'users', data.hostId));
              const userData = userSnap.exists() ? userSnap.data() : null;
              const name = userData ? (userData.nativeNickname ? `${userData.nickname || ''} ${userData.nativeNickname}` : (userData.nickname || 'Host')) : 'Host';
              results.push({
                type: 'people',
                id: data.hostId,
                name: name,
                subtitle: 'Organizer',
                avatar: userData?.photoURL || '',
                role: 'organizer',
              });
            } catch {
              results.push({
                type: 'people', id: data.hostId, name: 'Host',
                subtitle: 'Organizer', role: 'organizer',
              });
            }
          }
          return results;
        }
      }
      if (activityType === 'class' && groupId) {
        const snap = await getDoc(doc(db, 'groups', groupId, 'classes', activityId));
        if (snap.exists()) {
          const data = snap.data() as GroupClass;
          return (data.instructors || []).map(inst => ({
            type: 'people' as const,
            id: inst.userId || `instructor_${inst.name}`,
            name: inst.name,
            subtitle: 'Instructor',
            avatar: inst.avatar || '',
            role: 'instructor',
          }));
        }
      }
      return [];
    } catch (e) {
      console.error('getAutoPeople error:', e);
      return [];
    }
  },

  _dedup(arr: any[]): any[] {
    return arr.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }
};
