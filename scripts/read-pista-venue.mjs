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

async function findPista() {
  console.log('Searching for Pista venue/group...');
  const venuesSnap = await getDocs(collection(db, 'venues'));
  venuesSnap.forEach(doc => {
    const data = doc.data();
    const name = (data.name || '').toLowerCase();
    const native = (data.nameNative || '').toLowerCase();
    if (name.includes('pista') || native.includes('피스타')) {
      console.log(`FOUND VENUE ID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
    }
  });

  const socialsSnap = await getDocs(collection(db, 'socials'));
  socialsSnap.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    if (title.includes('grand') || title.includes('그랜드')) {
      console.log(`FOUND SOCIAL ID WITH GRAND: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
    }
  });
}

findPista().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
