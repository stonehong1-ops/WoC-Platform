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

async function searchAll() {
  console.log('Searching Firestore socials...');
  const snap = await getDocs(collection(db, 'socials'));
  snap.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const native = (data.titleNative || '').toLowerCase();
    const venue = (data.venueName || '').toLowerCase();

    const targets = ['jam', '잼스', 'bobby', '바비', 'marine', '마린', 'cheek', '칙투칙'];
    let isMatched = false;
    for (const t of targets) {
      if (title.includes(t) || native.includes(t) || venue.includes(t)) {
        isMatched = true;
        break;
      }
    }

    if (isMatched) {
      console.log(`FOUND ID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      console.log('------------------------------------');
    }
  });
}

searchAll().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
