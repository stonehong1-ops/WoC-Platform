// 사용자 수강 신청 및 현황 관리를 bookings 컬렉션으로 통합 처리하는 서비스 레이어
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "./clientApp";
import { ClassRegistration } from "@/types/group";

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
  }

  return {
    id: booking.id,
    classId: payload.classId || booking.itemId || '',
    groupId: payload.groupId || '',
    userId: booking.buyerId || '',
    classTitle: booking.itemName || '',
    applicantName: booking.buyerName || 'Unknown User',
    userAvatar: payload.userAvatar || '',
    role: payload.role 
      ? (payload.role.toLowerCase() === 'leader' ? 'Leader' : 
         payload.role.toLowerCase() === 'follower' ? 'Follower' : 
         payload.role.toLowerCase() === 'couple' ? 'Couple' : payload.role as ClassRegistration['role'])
      : undefined,
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
    participatingClassPartners: payload.participatingClassPartners || undefined,
    paymentAmount: booking.totalAmount || 0,
    paymentStatus: regStatus === 'PAYMENT_PENDING' ? 'pending' : 
                   regStatus === 'PAYMENT_REPORTED' ? 'reported' : 
                   regStatus === 'PAYMENT_COMPLETED' ? 'completed' : 'canceled',
    orderNumber: booking.orderNumber || undefined
  };
}

// Helper to map ClassRegistration Partial data back to Booking schema
function mapRegistrationToBooking(reg: Partial<ClassRegistration>): any {
  let bookingStatus: any = 'SUBMITTED';
  if (reg.status === 'PAYMENT_REPORTED') {
    bookingStatus = 'BANK_TRANSFERRED';
  } else if (reg.status === 'PAYMENT_COMPLETED') {
    bookingStatus = 'SELLER_CONFIRMED';
  } else if (reg.status === 'CANCELED') {
    bookingStatus = 'CANCELLED';
  }

  let domain: any = 'class_4w';
  if (reg.itemType === 'discount') {
    domain = 'class_discount';
  }

  const payload: any = {
    classId: reg.classId || '',
    groupId: reg.groupId || '',
    userAvatar: reg.userAvatar || '',
    role: reg.role 
      ? (reg.role.toLowerCase() === 'leader' ? 'Leader' : 
         reg.role.toLowerCase() === 'follower' ? 'Follower' : 
         reg.role.toLowerCase() === 'couple' ? 'Couple' : reg.role)
      : 'Leader',
    depositorName: reg.depositorName || undefined,
    depositDate: reg.depositDate || undefined,
    groupName: reg.groupName || undefined,
    contactNumber: reg.contactNumber || undefined,
    partnerName: reg.partnerName || undefined,
    selectedClassIds: reg.selectedClassIds || undefined,
    adminMemo: reg.adminMemo || undefined,
    applicantMemo: reg.applicantMemo || undefined,
    participatingClassPartners: reg.participatingClassPartners || undefined,
    itemType: reg.itemType || 'class'
  };

  return cleanData({
    domain,
    itemId: reg.classId || '',
    itemName: reg.classTitle || '',
    buyerId: reg.userId || '',
    buyerName: reg.applicantName || '',
    totalAmount: reg.paymentAmount || reg.amount || 0,
    currency: reg.currency || 'KRW',
    status: bookingStatus,
    payload
  });
}

export const classRegistrationService = {
  // Add a new registration into bookings
  addRegistration: async (data: Omit<ClassRegistration, 'id' | 'appliedAt' | 'updatedAt'>) => {
    try {
      const batch = writeBatch(db);
      const bookingRef = doc(collection(db, "bookings"));
      
      const bookingData = mapRegistrationToBooking(data);
      
      const booking = {
        ...bookingData,
        id: bookingRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      batch.set(bookingRef, booking);
      await batch.commit();
      
      return {
        ...data,
        id: bookingRef.id,
        appliedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as unknown as ClassRegistration;
    } catch (error: any) {
      console.error("Error adding class registration:", error?.code, error?.message, error);
      throw error;
    }
  },

  // Update registration (always points to bookings)
  updateRegistration: async (registrationId: string, updates: Partial<Omit<ClassRegistration, 'id' | 'appliedAt'>>) => {
    try {
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
        
        await updateDoc(bookingRef, cleanData(bookingUpdates));
      } else {
        console.warn(`Booking with ID ${registrationId} not found for updates.`);
      }
    } catch (error) {
      console.error("Error updating class registration:", error);
      throw error;
    }
  },

  // Get all registrations for a specific group from bookings (Admin View)
  getRegistrationsByGroup: async (groupId: string): Promise<ClassRegistration[]> => {
    try {
      const qBooking = query(
        collection(db, "bookings"),
        where("payload.groupId", "==", groupId)
      );
      const bookingSnapshot = await getDocs(qBooking);
      const bookingRegs = bookingSnapshot.docs.map(doc => mapBookingToRegistration(doc.data()));

      return bookingRegs.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error getting group registrations:", error);
      throw error;
    }
  },

  // Get all registrations for a specific user from bookings (User History View)
  getUserRegistrations: async (userId: string): Promise<ClassRegistration[]> => {
    try {
      const qBooking = query(
        collection(db, "bookings"),
        where("buyerId", "==", userId)
      );
      const bookingSnapshot = await getDocs(qBooking);
      const bookingRegs = bookingSnapshot.docs
        .map(doc => doc.data())
        .filter(b => b.domain && b.domain.startsWith("class"))
        .map(b => mapBookingToRegistration(b));

      return bookingRegs.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error getting user registrations:", error);
      throw error;
    }
  },

  // Subscribe to registrations for a specific group (bookings collection only)
  subscribeToGroupRegistrations: (groupId: string, callback: (registrations: ClassRegistration[]) => void) => {
    const qBooking = query(
      collection(db, "bookings"),
      where("payload.groupId", "==", groupId)
    );
    const unsubBooking = onSnapshot(qBooking, (snapshot) => {
      const bookingRegs = snapshot.docs.map(doc => mapBookingToRegistration(doc.data()));
      const sortedList = bookingRegs.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(sortedList);
    }, (error) => {
      console.error("Error subscribing to bookings for group:", error);
    });

    return unsubBooking;
  },

  // Subscribe to registrations for a specific user (bookings collection only)
  subscribeToUserRegistrations: (userId: string, callback: (registrations: ClassRegistration[]) => void) => {
    const qBooking = query(
      collection(db, "bookings"),
      where("buyerId", "==", userId)
    );
    const unsubBooking = onSnapshot(qBooking, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data()).filter(b => b.domain && b.domain.startsWith("class"));
      const bookingRegs = docs.map(b => mapBookingToRegistration(b));
      const sortedList = bookingRegs.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(sortedList);
    }, (error) => {
      console.error("Error subscribing to user bookings:", error);
    });

    return unsubBooking;
  },

  // Subscribe to registrations by contact number (bookings collection only)
  subscribeToPhoneRegistrations: (phoneNumber: string, callback: (registrations: ClassRegistration[]) => void) => {
    const qBooking = query(
      collection(db, "bookings"),
      where("payload.contactNumber", "==", phoneNumber)
    );
    const unsubBooking = onSnapshot(qBooking, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data()).filter(b => b.domain && b.domain.startsWith("class"));
      const bookingRegs = docs.map(b => mapBookingToRegistration(b));
      const sortedList = bookingRegs.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (a.appliedAt?.seconds ? a.appliedAt.seconds * 1000 : 0);
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (b.appliedAt?.seconds ? b.appliedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(sortedList);
    }, (error) => {
      console.error("Error subscribing to phone bookings:", error);
    });

    return unsubBooking;
  },

  // Delete registration from bookings
  deleteRegistration: async (id: string): Promise<void> => {
    try {
      const bookingRef = doc(db, "bookings", id);
      await deleteDoc(bookingRef);
    } catch (error) {
      console.error("Error deleting registration:", error);
      throw error;
    }
  }
};
