import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// Firebase 앱 초기화 (이미 초기화된 경우 기존 앱 사용)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase 서비스 익스포트
export const auth = getAuth(app);

// Next.js 서버리스 환경(Vercel 등)에서 발생하는 연결 끊김(can't load) 방지를 위해 LongPolling 강제 적용
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  // 이미 초기화된 경우 getFirestore 폴백
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

export const storage = getStorage(app);

export default app;
