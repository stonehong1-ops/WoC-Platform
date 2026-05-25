import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
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

// 브라우저 환경에서만 멀티 탭 IndexedDB 영속성 안전하게 활성화 (SSR Hydration 에러 방지)
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed-precondition: multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence unimplementd in this browser.");
    } else {
      console.error("Firestore persistence error:", err);
    }
  });
}

export const storage = getStorage(app);

export default app;
