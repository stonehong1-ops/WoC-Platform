import { db } from './clientApp';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { Social, SocialType } from '@/types/social';

const SOCIALS_COLLECTION = 'socials';

export const socialService = {
  // 1. Subscribe to specific type of socials (Regular or Popup)
  subscribeSocials: (type: SocialType, callback: (socials: Social[]) => void) => {
    const q = query(
      collection(db, SOCIALS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Social[];
      
      const filtered = all.filter(s => {
        const typeStr = String(s.type || '').toLowerCase();
        const targetType = String(type || '').toLowerCase();
        return typeStr === targetType;
      });
      callback(filtered);
    });
  },

  // 2. Subscribe to socials for a specific day or date
  subscribeDailySocials: (day: number, date?: Date, callback?: (socials: Social[]) => void) => {
    const q = query(
      collection(db, SOCIALS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Social[];
      
      const filtered = all.filter(s => {
        const typeStr = String(s.type || '').toLowerCase();
        const isRegular = typeStr === 'regular';
        const isPopup = typeStr === 'popup';

        if (isRegular) {
            return s.dayOfWeek !== undefined && Number(s.dayOfWeek) === Number(day);
        }
        if (isPopup && date && s.date) {
            // Safety: handle both Firestore Timestamp and JS Date (if any)
            const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
            return sDate.toDateString() === date.toDateString();
        }
        return false;
      });
      
      callback?.(filtered);
    });
  },

  // 3. Get list of Organizers/Venues for Filter
  getFilterOptions: async () => {
    const q = query(collection(db, SOCIALS_COLLECTION));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => d.data() as Social);
    
    const organizers = Array.from(new Set(data.map(s => s.organizerName)));
    const venues = Array.from(new Set(data.map(s => s.venueName)));
    
    return { organizers, venues };
  }
};
