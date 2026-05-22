import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  getDoc
} from "firebase/firestore";
import { db } from "./clientApp";
import { ClassRegistration } from "@/types/group";

const COLLECTION_NAME = "class_registrations";

// Helper: Remove undefined/null fields to prevent Firestore rejections
function cleanData(obj: any): any {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Helper to map booking document data to ClassRegistration type
function mapBookingToRegistration(booking: any): ClassRegistration {
  const payload = booking.payload || {};
  
  // Status mapping
  let regStatus: ClassRegistration['status'] = 'PAYMENT_PENDING';
  if (booking.status === 'BANK_TRANSFERRED') {
    regStatus = 'PAYMENT_REPORTED';
  } else if (
    booking.status === 'SELLER_CONFIRMED' || 
    booking.status === 'DELIVERED' || 
    booking.status === 'CONFIRMED'
  ) {
    regStatus = 'PAYMENT_COMPLETED';
  } else if (
    booking.status === 'CANCELLED' || 
    booking.status === 'REFUNDED' || 
    booking.status === 'SELLER_REJECTED'
  ) {
    regStatus = 'CANCELED';
  }

  // Item type mapping based on domain
  let itemType: ClassRegistration['itemType'] = 'class';
  if (booking.domain === 'class_discount') {
    itemType = 'discount';
  } else if (booking.domain === 'class_pass') {
    itemType = 'monthlyPass';
  }

  return {
    id: booking.id,
    classId: payload.classId || booking.itemId || '',
    groupId: payload.groupId || '',
    userId: booking.buyerId || '',
    classTitle: booking.itemName || '',
    applicantName: booking.buyerName || 'Unknown User',
    userAvatar: payload.userAvatar || '',
    role: payload.role || undefined,
    status: regStatus,
    amount: booking.totalAmount || 0,
    currency: booking.currency || 'KRW',
    depositorName: payload.depositorName || booking.buyerName || undefined,
    depositDate: payload.depositDate || undefined,
    appliedAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    confirmedAt: booking.confirmedAt || undefined,
    itemType: itemType,
    groupName: payload.groupName || undefined,
    contactNumber: payload.contactNumber || payload.phone || undefined,
    partnerName: payload.partnerName || undefined,
    selectedClassIds: payload.selectedClassIds || payload.participatingClassIds || undefined,
    adminMemo: payload.adminMemo || undefined,
    applicantMemo: payload.applicantMemo || payload.memo || undefined,
    paymentAmount: booking.totalAmount || 0,
    paymentStatus: regStatus === 'PAYMENT_PENDING' ? 'pending' : 
                   regStatus === 'PAYMENT_REPORTED' ? 'reported' : 
                   regStatus === 'PAYMENT_COMPLETED' ? 'completed' : 'canceled',
    orderNumber: booking.orderNumber || undefined
  };
}

export const classRegistrationService = {
  // Add a new registration
  addRegistration: async (data: Omit<ClassRegistration, 'id' | 'appliedAt' | 'updatedAt'>) => {
    try {
      const batch = writeBatch(db);
      const regRef = doc(collection(db, COLLECTION_NAME));
      
      // Clean undefined/null from data first
      const cleanedData = cleanData(data);
      
      // Add system fields directly so FieldValue prototypes aren't stripped
      const registration = {
        ...cleanedData,
        id: regRef.id,
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      batch.set(regRef, registration);

      await batch.commit();
      return registration as ClassRegistration;
    } catch (error: any) {
      console.error("Error adding class registration:", error?.code, error?.message, error);
      throw error;
    }
  },

  // Update registration (e.g. user reports payment, or admin confirms payment)
  updateRegistration: async (registrationId: string, updates: Partial<Omit<ClassRegistration, 'id' | 'appliedAt'>>) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Try checking bookings collection first to maintain Functional Integrity
      const bookingRef = doc(db, "bookings", registrationId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        const bookingUpdates: any = {
          updatedAt: serverTimestamp()
        };
        
        if (updates.status !== undefined) {
          let newStatus: any = 'SUBMITTED';
          if (updates.status === 'PAYMENT_PENDING') newStatus = 'SUBMITTED';
          else if (updates.status === 'PAYMENT_REPORTED') newStatus = 'BANK_TRANSFERRED';
          else if (updates.status === 'PAYMENT_COMPLETED') newStatus = 'SELLER_CONFIRMED';
          else if (updates.status === 'CANCELED') newStatus = 'CANCELLED';
          bookingUpdates.status = newStatus;
        }
        
        const payloadUpdates: any = {};
        if (updates.adminMemo !== undefined) payloadUpdates.adminMemo = updates.adminMemo;
        if (updates.applicantMemo !== undefined) payloadUpdates.applicantMemo = updates.applicantMemo;
        if (updates.role !== undefined) payloadUpdates.role = updates.role;
        if (updates.contactNumber !== undefined) payloadUpdates.contactNumber = updates.contactNumber;
        if (updates.partnerName !== undefined) payloadUpdates.partnerName = updates.partnerName;
        if (updates.selectedClassIds !== undefined) payloadUpdates.selectedClassIds = updates.selectedClassIds;
        
        if (Object.keys(payloadUpdates).length > 0) {
          const currentPayload = bookingSnap.data().payload || {};
          bookingUpdates.payload = {
            ...currentPayload,
            ...payloadUpdates
          };
        }
        
        if (updates.paymentAmount !== undefined) bookingUpdates.totalAmount = updates.paymentAmount;
        if (updates.amount !== undefined) bookingUpdates.totalAmount = updates.amount;
        if (updates.applicantName !== undefined) bookingUpdates.buyerName = updates.applicantName;
        
        batch.update(bookingRef, bookingUpdates);
      } else {
        // 2. Otherwise update class_registrations
        const regRef = doc(db, COLLECTION_NAME, registrationId);
        batch.update(regRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error("Error updating class registration:", error);
      throw error;
    }
  },

  // Get all registrations for a specific group (Admin View)
  getRegistrationsByGroup: async (groupId: string): Promise<ClassRegistration[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("groupId", "==", groupId)
      );
      const snapshot = await getDocs(q);
      const classRegs = snapshot.docs.map(doc => doc.data() as ClassRegistration);

      // Fetch from bookings too
      const qBooking = query(
        collection(db, "bookings"),
        where("payload.groupId", "==", groupId)
      );
      const bookingSnapshot = await getDocs(qBooking);
      const bookingRegs = bookingSnapshot.docs.map(doc => mapBookingToRegistration(doc.data()));

      const mergedMap = new Map<string, ClassRegistration>();
      classRegs.forEach(r => mergedMap.set(r.id, r));
      bookingRegs.forEach(r => mergedMap.set(r.id, r));

      return Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error getting group registrations:", error);
      throw error;
    }
  },

  // Get all registrations for a specific user (User History View)
  getUserRegistrations: async (userId: string): Promise<ClassRegistration[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const classRegs = snapshot.docs.map(doc => doc.data() as ClassRegistration);

      // Fetch from bookings too
      const qBooking = query(
        collection(db, "bookings"),
        where("buyerId", "==", userId)
      );
      const bookingSnapshot = await getDocs(qBooking);
      const bookingRegs = bookingSnapshot.docs
        .map(doc => doc.data())
        .filter(b => b.domain && b.domain.startsWith("class"))
        .map(b => mapBookingToRegistration(b));

      const mergedMap = new Map<string, ClassRegistration>();
      classRegs.forEach(r => mergedMap.set(r.id, r));
      bookingRegs.forEach(r => mergedMap.set(r.id, r));

      return Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error getting user registrations:", error);
      throw error;
    }
  },

  // Subscribe to registrations for a specific group
  subscribeToGroupRegistrations: (groupId: string, callback: (registrations: ClassRegistration[]) => void) => {
    let classRegs: ClassRegistration[] = [];
    let bookingRegs: ClassRegistration[] = [];

    const triggerMerge = () => {
      const mergedMap = new Map<string, ClassRegistration>();
      classRegs.forEach(r => mergedMap.set(r.id, r));
      bookingRegs.forEach(r => mergedMap.set(r.id, r));
      
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(mergedList);
    };

    const qClass = query(
      collection(db, COLLECTION_NAME),
      where("groupId", "==", groupId)
    );
    const unsubClass = onSnapshot(qClass, (snapshot) => {
      classRegs = snapshot.docs.map(doc => doc.data() as ClassRegistration);
      triggerMerge();
    }, (error) => {
      console.error("Error subscribing to group registrations:", error);
    });

    const qBooking = query(
      collection(db, "bookings"),
      where("payload.groupId", "==", groupId)
    );
    const unsubBooking = onSnapshot(qBooking, (snapshot) => {
      bookingRegs = snapshot.docs.map(doc => mapBookingToRegistration(doc.data()));
      triggerMerge();
    }, (error) => {
      console.error("Error subscribing to bookings for group:", error);
    });

    return () => {
      unsubClass();
      unsubBooking();
    };
  },

  // Subscribe to registrations for a specific user
  subscribeToUserRegistrations: (userId: string, callback: (registrations: ClassRegistration[]) => void) => {
    let classRegs: ClassRegistration[] = [];
    let bookingRegs: ClassRegistration[] = [];

    const triggerMerge = () => {
      const mergedMap = new Map<string, ClassRegistration>();
      classRegs.forEach(r => mergedMap.set(r.id, r));
      bookingRegs.forEach(r => mergedMap.set(r.id, r));
      
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(mergedList);
    };

    const qClass = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    const unsubClass = onSnapshot(qClass, (snapshot) => {
      classRegs = snapshot.docs.map(doc => doc.data() as ClassRegistration);
      triggerMerge();
    }, (error) => {
      console.error("Error subscribing to user registrations:", error);
    });

    const qBooking = query(
      collection(db, "bookings"),
      where("buyerId", "==", userId)
    );
    const unsubBooking = onSnapshot(qBooking, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data()).filter(b => b.domain && b.domain.startsWith("class"));
      bookingRegs = docs.map(b => mapBookingToRegistration(b));
      triggerMerge();
    }, (error) => {
      console.error("Error subscribing to user bookings:", error);
    });

    return () => {
      unsubClass();
      unsubBooking();
    };
  },

  subscribeToPhoneRegistrations: (phoneNumber: string, callback: (registrations: ClassRegistration[]) => void) => {
    let classRegs: ClassRegistration[] = [];
    let bookingRegs: ClassRegistration[] = [];

    const triggerMerge = () => {
      const mergedMap = new Map<string, ClassRegistration>();
      classRegs.forEach(r => mergedMap.set(r.id, r));
      bookingRegs.forEach(r => mergedMap.set(r.id, r));
      
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(mergedList);
    };

    const qClass = query(
      collection(db, COLLECTION_NAME),
      where("contactNumber", "==", phoneNumber)
    );
    const unsubClass = onSnapshot(qClass, (snapshot) => {
      classRegs = snapshot.docs.map(doc => doc.data() as ClassRegistration);
      triggerMerge();
    }, (error) => {
      console.error("Error subscribing to phone registrations:", error);
    });

    const qBooking = query(
      collection(db, "bookings"),
      where("payload.contactNumber", "==", phoneNumber)
    );
    const unsubBooking = onSnapshot(qBooking, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data()).filter(b => b.domain && b.domain.startsWith("class"));
      bookingRegs = docs.map(b => mapBookingToRegistration(b));
      triggerMerge();
    }, (error) => {
      console.error("Error subscribing to phone bookings:", error);
    });

    return () => {
      unsubClass();
      unsubBooking();
    };
  },

  deleteRegistration: async (id: string): Promise<void> => {
    try {
      const bookingRef = doc(db, "bookings", id);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        await deleteDoc(bookingRef);
      } else {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      }
    } catch (error) {
      console.error("Error deleting registration:", error);
      throw error;
    }
  }
};
