import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./clientApp";
import { BaseBooking } from "@/types/booking";

const COLLECTION_NAME = "bookings";

export const bookingService = {
  subscribeToUserBookings: (userId: string, callback: (bookings: BaseBooking[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("buyerId", "==", userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => doc.data() as BaseBooking);
      callback(bookings);
    }, (error) => {
      console.error("Error subscribing to user bookings:", error);
    });
  }
};
