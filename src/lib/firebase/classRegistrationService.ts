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
import { db } from "./config";
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

export const classRegistrationService = {
  // Add a new registration
  addRegistration: async (data: Omit<ClassRegistration, 'id' | 'appliedAt' | 'updatedAt'>) => {
    try {
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
      
      await setDoc(regRef, registration);
      return registration as ClassRegistration;
    } catch (error: any) {
      console.error("Error adding class registration:", error?.code, error?.message, error);
      throw error;
    }
  },

  // Update registration (e.g. user reports payment, or admin confirms payment)
  updateRegistration: async (registrationId: string, updates: Partial<Omit<ClassRegistration, 'id' | 'appliedAt'>>) => {
    try {
      const regRef = doc(db, COLLECTION_NAME, registrationId);
      await updateDoc(regRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
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
      return snapshot.docs.map(doc => doc.data() as ClassRegistration);
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
      return snapshot.docs.map(doc => doc.data() as ClassRegistration);
    } catch (error) {
      console.error("Error getting user registrations:", error);
      throw error;
    }
  },

  // Subscribe to registrations for a specific group
  subscribeToGroupRegistrations: (groupId: string, callback: (registrations: ClassRegistration[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("groupId", "==", groupId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const registrations = snapshot.docs.map(doc => doc.data() as ClassRegistration);
      callback(registrations);
    }, (error) => {
      console.error("Error subscribing to group registrations:", error);
    });
  },
  // Subscribe to registrations for a specific user
  subscribeToUserRegistrations: (userId: string, callback: (registrations: ClassRegistration[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const registrations = snapshot.docs.map(doc => doc.data() as ClassRegistration);
      callback(registrations);
    }, (error) => {
      console.error("Error subscribing to user registrations:", error);
    });
  },

  subscribeToPhoneRegistrations: (phoneNumber: string, callback: (registrations: ClassRegistration[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("contactNumber", "==", phoneNumber)
    );
    
    return onSnapshot(q, (snapshot) => {
      const registrations = snapshot.docs.map(doc => doc.data() as ClassRegistration);
      callback(registrations);
    }, (error) => {
      console.error("Error subscribing to phone registrations:", error);
    });
  },

  deleteRegistration: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting registration:", error);
      throw error;
    }
  }
};
