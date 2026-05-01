import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  runTransaction,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from './clientApp';

// ═══════════════════════════════════════════════════════════════
// Coupon Data Models
// ═══════════════════════════════════════════════════════════════

export interface Coupon {
  id?: string;
  title: string;
  location: string;
  type: 'FREE' | 'DISCOUNT';
  discountValue?: number;
  duration: number; // 0 for ALWAYS, 1-12 for specific months
  totalQuantity: number;
  issuedCount: number;
  createdAt: Timestamp;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UserCoupon {
  id?: string;
  userId: string;       // Firebase UID
  userName?: string;     // Nickname for admin tracking
  couponId: string;
  couponData: Omit<Coupon, 'id'> & { id: string };
  status: 'UNUSED' | 'USED' | 'EXPIRED';
  issuedAt: Timestamp;
  usedAt?: Timestamp;
  expiresAt?: Timestamp;
}

// ═══════════════════════════════════════════════════════════════
// Admin: Coupon Management
// ═══════════════════════════════════════════════════════════════

/**
 * Admin: Create a new coupon
 */
export const createCoupon = async (data: Omit<Coupon, 'id' | 'issuedCount' | 'createdAt' | 'status'>) => {
  return await addDoc(collection(db, 'coupons'), {
    ...data,
    issuedCount: 0,
    createdAt: Timestamp.now(),
    status: 'ACTIVE'
  });
};

/**
 * Admin/User: List all available coupons for issuance
 */
export const getActiveCoupons = async () => {
  try {
    const q = query(
      collection(db, 'coupons'), 
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      console.warn('[COUPON WARNING] Missing Index for getActiveCoupons. Falling back.');
      const qFallback = query(
        collection(db, 'coupons'),
        where('status', '==', 'ACTIVE')
      );
      const snapshot = await getDocs(qFallback);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
      return results.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    }
    console.error("Error fetching active coupons:", error);
    return [];
  }
};

/**
 * Admin: Delete/Deactivate coupon (soft delete)
 */
export const deleteCoupon = async (couponId: string) => {
  const ref = doc(db, 'coupons', couponId);
  await updateDoc(ref, { status: 'INACTIVE' });
};

// ═══════════════════════════════════════════════════════════════
// User: Coupon Issuance & Usage
// ═══════════════════════════════════════════════════════════════

/**
 * User: Issue a coupon (Atomically check quantity and create record)
 * userId = Firebase Auth UID
 * userName = user nickname for admin tracking
 */
export const issueCoupon = async (couponId: string, userId: string, userName: string): Promise<{ success: boolean; message: string }> => {
  const userCouponCollection = collection(db, 'user_coupons');
  
  try {
    // 1. [Pre-check] 7-day Cooldown Check (Any Coupon)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cooldownQuery = query(
      userCouponCollection,
      where('userId', '==', userId),
      where('issuedAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('issuedAt', 'desc'),
      limit(1)
    );
    const cooldownSnapshot = await getDocs(cooldownQuery);
    if (!cooldownSnapshot.empty) {
      return { success: false, message: 'COOLDOWN' };
    }

    // 2. [Transaction] For inventory update and duplicate check
    const couponRef = doc(db, 'coupons', couponId);
    const userCouponRef = doc(db, 'user_coupons', `${userId}_${couponId}`);

    return await runTransaction(db, async (transaction) => {
      // 3. Get current coupon state (Inventory)
      const couponDoc = await transaction.get(couponRef);
      if (!couponDoc.exists()) throw new Error("Coupon not found");
      
      const couponData = couponDoc.data() as Coupon;
      if (couponData.issuedCount >= couponData.totalQuantity) {
        return { success: false, message: 'SOLD_OUT' };
      }

      // 4. Duplicate Check (This specific coupon)
      const userCouponDoc = await transaction.get(userCouponRef);
      if (userCouponDoc.exists()) {
        return { success: false, message: 'DUPLICATE' };
      }
      
      // 5. Update inventory
      transaction.update(couponRef, { issuedCount: (couponData.issuedCount || 0) + 1 });

      // 6. Calculate Expiry
      let expiresAt = null;
      if (couponData.duration > 0) {
        const now = new Date();
        now.setMonth(now.getMonth() + couponData.duration);
        expiresAt = Timestamp.fromDate(now);
      }

      // 7. Create User Coupon document with deterministic ID
      transaction.set(userCouponRef, {
        userId,
        userName,
        couponId,
        couponData: { ...couponData, id: couponId },
        status: 'UNUSED',
        issuedAt: Timestamp.now(),
        expiresAt: expiresAt
      });

      // Note: Chat notification deferred to future sprint

      return { success: true, message: 'SUCCESS' };
    });
  } catch (err: any) {
    console.error("Coupon issuance failed:", err);
    return { success: false, message: err.message || 'ERROR' };
  }
};

// ═══════════════════════════════════════════════════════════════
// Admin: Issuance Tracking
// ═══════════════════════════════════════════════════════════════

/**
 * Admin: Get all issuances for a specific coupon
 */
export const getCouponIssuances = async (couponId: string) => {
  const q = query(
    collection(db, 'user_coupons'),
    where('couponId', '==', couponId),
    orderBy('issuedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserCoupon));
};

/**
 * Admin: Get all issuances for a list of coupons (efficient)
 */
export const getAllCouponIssuances = async (couponIds: string[]) => {
  if (couponIds.length === 0) return [];
  
  const q = query(
    collection(db, 'user_coupons'),
    where('couponId', 'in', couponIds)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserCoupon));
  
  // Sort in memory instead of requiring composite index
  return data.sort((a, b) => (b.issuedAt?.toMillis() || 0) - (a.issuedAt?.toMillis() || 0));
};

// ═══════════════════════════════════════════════════════════════
// User: My Coupons
// ═══════════════════════════════════════════════════════════════

/**
 * User: Get list of my issued coupons
 */
export const getUserCoupons = async (userId: string) => {
  const q = query(
    collection(db, 'user_coupons'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  
  const now = Timestamp.now();
  const coupons = snapshot.docs.map(doc => {
    const data = doc.data() as UserCoupon;
    // Client-side expiry check
    if (data.status === 'UNUSED' && data.expiresAt && data.expiresAt.toMillis() < now.toMillis()) {
      return { ...data, id: doc.id, status: 'EXPIRED' } as UserCoupon;
    }
    return { ...data, id: doc.id } as UserCoupon;
  });

  // Sort by issuedAt desc on client side
  return coupons.sort((a, b) => (b.issuedAt?.toMillis() || 0) - (a.issuedAt?.toMillis() || 0));
};

/**
 * User: Use coupon at an event/store
 */
export const useCoupon = async (userCouponId: string) => {
  const ref = doc(db, 'user_coupons', userCouponId);
  await updateDoc(ref, {
    status: 'USED',
    usedAt: Timestamp.now()
  });
};

/**
 * User: Cancel/Return an issued coupon
 */
export const cancelCoupon = async (userCouponId: string, couponId: string): Promise<{ success: boolean; message: string }> => {
  const userCouponRef = doc(db, 'user_coupons', userCouponId);
  const couponRef = doc(db, 'coupons', couponId);

  try {
    return await runTransaction(db, async (transaction) => {
      const uDoc = await transaction.get(userCouponRef);
      if (!uDoc.exists()) throw new Error("Coupon record not found");
      
      const uData = uDoc.data() as UserCoupon;
      if (uData.status !== 'UNUSED') {
        return { success: false, message: 'ALREADY_USED' };
      }

      const cDoc = await transaction.get(couponRef);
      if (!cDoc.exists()) throw new Error("Original coupon not found");
      const cData = cDoc.data() as Coupon;

      // Delete the issuance record
      transaction.delete(userCouponRef);

      // Decrement the issued count
      transaction.update(couponRef, { 
        issuedCount: Math.max(0, (cData.issuedCount || 1) - 1) 
      });

      return { success: true, message: 'SUCCESS' };
    });
  } catch (err: any) {
    console.error("Coupon cancellation failed:", err);
    return { success: false, message: err.message || 'ERROR' };
  }
};

/**
 * Syncs the issuedCount of a coupon with the actual number of issuance records.
 */
export async function syncCouponCount(couponId: string) {
  const issuancesRef = collection(db, 'user_coupons');
  const q = query(issuancesRef, where('couponId', '==', couponId));
  const querySnapshot = await getDocs(q);
  const actualCount = querySnapshot.docs.length;

  const couponRef = doc(db, 'coupons', couponId);
  await updateDoc(couponRef, {
    issuedCount: actualCount,
  });

  return actualCount;
}
