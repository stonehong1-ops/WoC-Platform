import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    console.log('Searching for date:', todayStr);

    const q = query(collectionGroup(db, 'classes'), where('status', '==', 'Open'));
    const snapshot = await getDocs(q);
    console.log('Docs found:', snapshot.size);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const hasToday = data.schedule?.some(s => s.date === todayStr);
      console.log(`Class: ${data.title}`);
      console.log(`  Path: ${doc.ref.path}`);
      console.log(`  Has Today: ${hasToday}`);
      console.log(`  Schedules:`, data.schedule?.map(s => `${s.date} (type: ${typeof s.date})`));
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
