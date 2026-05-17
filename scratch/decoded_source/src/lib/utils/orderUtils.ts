import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { User } from 'firebase/auth';

/**
 * Generates a consistent order number format: PREFIX-YYYYMMDD-RANDOM
 * @param prefix e.g., 'WOC', 'RESALE', 'STAY'
 */
export const genOrderNumber = (prefix: string = 'ORD') => {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${date}-${rand}`;
};

/**
 * Updates the user's phone number in the 'users' collection if it's currently empty.
 * @param user Current authenticated user
 * @param profile User profile object (to check if update is needed)
 * @param phone The new phone number
 */
export const ensureProfilePhoneNumber = async (user: User | null | undefined, profile: any, phone: string) => {
  if (user && profile && !profile.phoneNumber && phone.trim()) {
    try {
      await updateDoc(doc(db, 'users', user.uid), { phoneNumber: phone });
    } catch (e) {
      console.error('Failed to update phone number', e);
    }
  }
};
