import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const sanitize = (val: string | undefined) => val?.trim() || "";

export const firebaseConfig = {
  apiKey: sanitize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: process.env.NODE_ENV === 'production' ? 'www.woc.today' : sanitize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
