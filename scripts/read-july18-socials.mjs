import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function findJuly18() {
  console.log('Searching for 2026-07-18 socials...');
  const snap = await getDocs(collection(db, 'socials'));
  snap.forEach(doc => {
    const data = doc.data();
    const dateStr = data.date ? (data.date.seconds ? new Date(data.date.seconds * 1000).toISOString() : data.date) : '';
    // djs 안에 7/18이 있는지 확인
    const hasDj18 = (data.djs || []).some(d => d.date === '2026-07-18');
    if (dateStr.includes('2026-07-18') || hasDj18 || doc.id.includes('20260718')) {
      console.log(`FOUND DOC ID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      console.log('------------------------------------');
    }
  });
}

findJuly18().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
