import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function run() {
  try {
    const q = query(collection(db, "fysRegistrations"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    const grandUsers = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.selectedClassIds && data.selectedClassIds.includes("0905-grand")) {
        grandUsers.push({
          id: doc.id,
          nickname: data.nickname,
          depositorName: data.depositorName,
          phone: data.phone || "연락처 미입력",
          role: data.role,
          depositDate: data.depositDate,
          paymentStatus: data.paymentStatus,
          createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : null,
        });
      }
    });

    console.log(JSON.stringify(grandUsers, null, 2));
  } catch (err) {
    console.error("오류 발생:", err);
  }
  process.exit(0);
}

run();
