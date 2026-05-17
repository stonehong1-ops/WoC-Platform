import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './clientApp';

export interface Transaction {
  id: string;
  type: 'CHARGE' | 'PAYMENT' | 'REFUND' | 'COUPON_USE';
  amount: number;
  description: string;
  createdAt: Timestamp;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
}

/**
 * Fetch user's current balance
 * Note: Currently fetching from User Profile. If not exists, returns 0.
 */
export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().balance || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
};

/**
 * Fetch transaction history
 */
export const getTransactionHistory = async (userId: string, pageSize: number = 20): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};
