import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// Firebase 앱 초기화 (이미 초기화된 경우 기존 앱 사용)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase 서비스 익스포트
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
