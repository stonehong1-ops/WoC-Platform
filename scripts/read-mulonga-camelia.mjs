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

async function readMulongaCamelia() {
  console.log('Searching for Mu!!longa and Camelia related socials...');
  const snap = await getDocs(collection(db, 'socials'));
  snap.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const native = (data.titleNative || '').toLowerCase();
    if (title.includes('mulonga') || title.includes('mu!!') || native.includes('뮤롱가') || title.includes('camelia') || native.includes('까멜리아') || native.includes('카멜리아')) {
      console.log(`FOUND DOC ID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      console.log('------------------------------------');
    }
  });
}

readMulongaCamelia().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
