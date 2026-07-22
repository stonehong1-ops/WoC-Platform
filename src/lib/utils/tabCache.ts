import { groupService } from '../firebase/groupService';
import { socialService } from '../firebase/socialService';
import { galleryService } from '../firebase/galleryService';
import { venueService } from '../firebase/venueService';

interface CacheEntry {
  data: any;
  fetchedAt: number;
}

class TabCache {
  private cache: Record<string, CacheEntry> = {};
  private promises: Record<string, Promise<any> | undefined> = {};

  // Telemetry timestamps
  private clickTimestamps: Record<string, number> = {};

  // TTL durations (in ms)
  private TTL: Record<string, number> = {
    social: 120000,   // 2 minutes
    live: 30000,      // 30 seconds
    groups: 300000,   // 5 minutes
    venues: 300000    // 5 minutes
  };

  private getTTLType(key: string): string {
    if (key.startsWith('social:')) return 'social';
    if (key.startsWith('live:')) return 'live';
    if (key.startsWith('groups:')) return 'groups';
    if (key.startsWith('venues:')) return 'venues';
    return 'default';
  }

  // Get data from cache if hit and valid (not stale)
  get(key: string): any | null {
    const entry = this.cache[key];
    if (!entry) return null;

    const ttlType = this.getTTLType(key);
    const duration = this.TTL[ttlType] || 60000;
    const isStale = Date.now() - entry.fetchedAt > duration;

    if (isStale) {
      return null; // Stale data, should trigger background reload
    }
    return entry.data;
  }

  // Get stale data if exists (for SWR UI rendering)
  getStale(key: string): any | null {
    const entry = this.cache[key];
    return entry ? entry.data : null;
  }

  // Set data into cache
  set(key: string, data: any) {
    this.cache[key] = {
      data,
      fetchedAt: Date.now()
    };
  }

  // Promise-based deduplication fetch (In-flight Promise)
  async fetchExclusive<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // If active promise exists, reuse it
    if (this.promises[key]) {
      return this.promises[key];
    }

    const promise = fetchFn()
      .then((res) => {
        this.set(key, res);
        delete this.promises[key];
        return res;
      })
      .catch((err) => {
        delete this.promises[key];
        throw err;
      });

    this.promises[key] = promise;
    return promise;
  }

  // 1. Social Core Data Prefetch
  prefetchSocialData(date: Date = new Date(), city: string = 'All') {
    const day = date.getDay();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const socialKey = `social:${dateStr}:${city}`;
    const groupsKey = 'groups:all';
    const venuesKey = 'venues:all';
    const classesKey = 'classes:all';

    // 1. Groups fetch prefetch
    this.fetchExclusive(groupsKey, () => groupService.getGroups()).catch(() => {});

    // 2. Venues fetch prefetch
    this.fetchExclusive(venuesKey, () => venueService.getVenues()).catch(() => {});

    // 3. Socials fetch prefetch
    this.fetchExclusive(socialKey, () => socialService.getTodayActiveSocials(day, date)).catch(() => {});

    // 4. Global Classes fetch prefetch
    this.fetchExclusive(classesKey, () => groupService.getGlobalClassesAll()).catch(() => {});
  }

  // 2. Live Core Data Prefetch (1-time fetch for preview collage)
  prefetchLiveData() {
    const liveKey = 'live:latest';
    
    // Fetch only initial 10 items for collage preview without real-time listener overhead
    this.fetchExclusive(liveKey, () => {
      return new Promise<any[]>((resolve, reject) => {
        const unsub = galleryService.subscribeFeed(
          (posts) => {
            unsub(); // immediately unsubscribe to keep it 1-time fetch
            resolve(posts.slice(0, 15));
          },
          undefined,
          (err) => {
            unsub();
            reject(err);
          }
        );
      });
    }).catch(() => {});
  }

  // Telemetry telemetry
  setClickTime(tabName: string) {
    this.clickTimestamps[tabName] = performance.now();
  }

  logTransitionTime(tabName: string, phase: 'render' | 'data') {
    const clickTime = this.clickTimestamps[tabName];
    if (!clickTime) return;

    const duration = performance.now() - clickTime;
    const cacheHit = this.get(`social:${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}:All`) !== null ? 'HIT' : 'MISS';

    if (phase === 'render') {
      console.log(`[Telemetry] Today -> ${tabName} | 첫 렌더(T1): ${duration.toFixed(1)}ms | Cache: ${cacheHit}`);
    } else if (phase === 'data') {
      console.log(`[Telemetry] Today -> ${tabName} | 데이터 완료(T2): ${duration.toFixed(1)}ms | Cache: ${cacheHit}`);
      delete this.clickTimestamps[tabName]; // reset
    }
  }
}

export const tabCache = new TabCache();
