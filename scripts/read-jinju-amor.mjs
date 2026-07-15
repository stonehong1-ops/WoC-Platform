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

async function findJinjuAmor() {
  console.log('Searching for Jinju and Amor socials...');
  const snap = await getDocs(collection(db, 'socials'));
  snap.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const native = (data.titleNative || '').toLowerCase();
    const venue = (data.venueName || '').toLowerCase();
    const venueKo = (data.venueNameNative || '').toLowerCase();

    if (title.includes('jinju') || native.includes('진주') || title.includes('amor') || native.includes('아모르') || venue.includes('amor') || venueKo.includes('아모르')) {
      console.log(`FOUND DOC ID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      console.log('------------------------------------');
    }
  });

  const venuesSnap = await getDocs(collection(db, 'venues'));
  venuesSnap.forEach(doc => {
    const data = doc.data();
    const name = (data.name || '').toLowerCase();
    const native = (data.nameNative || '').toLowerCase();
    if (name.includes('jinju') || native.includes('진주') || name.includes('amor') || native.includes('아모르')) {
      console.log(`FOUND VENUE ID: ${doc.id}`);
      console.log(`  Name: ${data.name} (${data.nameNative})`);
      console.log('------------------------------------');
    }
  });
}

findJinjuAmor().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
