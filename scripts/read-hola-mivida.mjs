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

async function findHolaMivida() {
  console.log('Searching for Hola and Mivida/Vida socials...');
  const snap = await getDocs(collection(db, 'socials'));
  snap.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const native = (data.titleNative || '').toLowerCase();
    const venue = (data.venueName || '').toLowerCase();
    const venueKo = (data.venueNameNative || '').toLowerCase();

    if (title.includes('hola') || native.includes('올라') || title.includes('mivida') || native.includes('미비다') || native.includes('금비다') || venue.includes('mivida') || venueKo.includes('미비다')) {
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
    if (name.includes('mivida') || native.includes('미비다') || name.includes('vida') || native.includes('비다')) {
      console.log(`FOUND VENUE ID: ${doc.id}`);
      console.log(`  Name: ${data.name} (${data.nameNative})`);
      console.log('------------------------------------');
    }
  });
}

findHolaMivida().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
