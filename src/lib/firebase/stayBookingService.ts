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
  onSnapshot
} from "firebase/firestore";
import { db } from "./clientApp";
import { StayBooking, StayBookingStatus, BookingStatusHistoryEntry, BookingSmsLogEntry } from "@/types/stay";

const COLLECTION_NAME = "stay_bookings";

// Helper: undefined/null 필드 제거 (Firestore 거부 방지)
function cleanData(obj: any): any {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key];
    }
  }
  return result;
}

export const stayBookingService = {
  // ──────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────

  // 예약 신청 (사용자 → status: APPLIED)
  addBooking: async (data: Omit<StayBooking, 'id' | 'appliedAt' | 'updatedAt' | 'statusHistory' | 'smsLog'>) => {
    try {
      const bookingRef = doc(collection(db, COLLECTION_NAME));
      const cleanedData = cleanData(data);

      const booking = {
        ...cleanedData,
        id: bookingRef.id,
        status: 'APPLIED' as StayBookingStatus,
        statusHistory: [{
          status: 'APPLIED' as StayBookingStatus,
          changedAt: new Date().toISOString(),
          changedBy: data.userId,
          note: '예약 신청'
        }],
        smsLog: [],
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(bookingRef, booking);
      return booking as StayBooking;
    } catch (error: any) {
      console.error("Error adding stay booking:", error?.code, error?.message, error);
      throw error;
    }
  },

  // 예약 상태 업데이트 (관리자 액션)
  updateBookingStatus: async (
    bookingId: string,
    newStatus: StayBookingStatus,
    changedBy: string,
    note?: string
  ) => {
    try {
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);

      // 기존 문서 가져와서 statusHistory 추가
      const { getDoc: getDocFn } = await import("firebase/firestore");
      const snap = await getDocFn(bookingRef);
      if (!snap.exists()) throw new Error("Booking not found");

      const existing = snap.data() as StayBooking;
      const historyEntry: BookingStatusHistoryEntry = {
        status: newStatus,
        changedAt: new Date().toISOString(),
        changedBy,
        note
      };

      await updateDoc(bookingRef, {
        status: newStatus,
        statusHistory: [...(existing.statusHistory || []), historyEntry],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  },

  // SMS 발송 이력 추가
  addSmsLog: async (bookingId: string, logEntry: BookingSmsLogEntry) => {
    try {
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const { getDoc: getDocFn, arrayUnion } = await import("firebase/firestore");
      
      await updateDoc(bookingRef, {
        smsLog: arrayUnion(logEntry),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding SMS log:", error);
      throw error;
    }
  },

  // 일반 필드 업데이트
  updateBooking: async (bookingId: string, updates: Partial<StayBooking>) => {
    try {
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      await updateDoc(bookingRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating stay booking:", error);
      throw error;
    }
  },

  // 예약 삭제
  deleteBooking: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting stay booking:", error);
      throw error;
    }
  },

  // ──────────────────────────────────────
  // 조회 (일회성)
  // ──────────────────────────────────────

  // 단일 예약 조회
  getBookingById: async (bookingId: string): Promise<StayBooking | null> => {
    try {
      const { getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, COLLECTION_NAME, bookingId));
      if (!snap.exists()) return null;
      return snap.data() as StayBooking;
    } catch (error) {
      console.error("Error getting stay booking by id:", error);
      throw error;
    }
  },

  // 그룹별 전체 예약 조회 (관리자)
  getBookingsByGroup: async (groupId: string): Promise<StayBooking[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("groupId", "==", groupId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as StayBooking);
    } catch (error) {
      console.error("Error getting group stay bookings:", error);
      throw error;
    }
  },

  // 사용자별 예약 조회 (히스토리)
  getUserBookings: async (userId: string): Promise<StayBooking[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as StayBooking);
    } catch (error) {
      console.error("Error getting user stay bookings:", error);
      throw error;
    }
  },

  // Stay별 예약 조회 (캘린더 표시용)
  getBookingsByStay: async (stayId: string): Promise<StayBooking[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("stayId", "==", stayId),
        where("status", "not-in", ["CANCELLED", "REJECTED"])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as StayBooking);
    } catch (error) {
      console.error("Error getting stay bookings:", error);
      throw error;
    }
  },

  // ──────────────────────────────────────
  // 실시간 구독
  // ──────────────────────────────────────

  // 그룹별 예약 구독 (Manager Todo)
  subscribeToGroupBookings: (groupId: string, callback: (bookings: StayBooking[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("groupId", "==", groupId)
    );

    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => doc.data() as StayBooking);
      callback(bookings);
    }, (error) => {
      console.error("Error subscribing to group stay bookings:", error);
    });
  },

  // 사용자별 예약 구독 (히스토리)
  subscribeToUserBookings: (userId: string, callback: (bookings: StayBooking[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => doc.data() as StayBooking);
      callback(bookings);
    }, (error) => {
      console.error("Error subscribing to user stay bookings:", error);
    });
  },

  // Stay별 예약 구독 (캘린더 실시간)
  subscribeToStayBookings: (stayId: string, callback: (bookings: StayBooking[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("stayId", "==", stayId)
    );

    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => doc.data() as StayBooking);
      callback(bookings);
    }, (error) => {
      console.error("Error subscribing to stay bookings:", error);
    });
  },

  // ──────────────────────────────────────
  // Manager Todo 전용: 입금확인 대기 건 구독
  // ──────────────────────────────────────

  subscribeToPendingBookings: (groupId: string, callback: (bookings: StayBooking[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("groupId", "==", groupId),
      where("status", "in", ["APPLIED", "PAYMENT_REQUESTED", "PAID", "CONFIRMED"])
    );

    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => doc.data() as StayBooking);
      callback(bookings);
    }, (error) => {
      console.error("Error subscribing to pending stay bookings:", error);
    });
  }
};
