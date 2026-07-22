import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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
  const ids = ["PEFOYvaaZk5DT0Bak10E", "0YP1JEHcry0Cy59CEZua"]; // 하리, 시온
  for (const id of ids) {
    const snap = await getDoc(doc(db, "fysRegistrations", id));
    if (snap.exists()) {
      console.log(`=== ${snap.data().nickname} (${id}) ===`);
      console.log(JSON.stringify(snap.data(), null, 2));
    }
  }
  process.exit(0);
}

run();
