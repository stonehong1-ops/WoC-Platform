// Script: Update all venues with country: 'KOREA'
// Run with: node scripts/updateVenueCountry.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

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

async function updateVenueCountry() {
  const snapshot = await getDocs(collection(db, 'venues'));
  const batch = writeBatch(db);
  let count = 0;

  snapshot.docs.forEach((d) => {
    const data = d.data();
    if (!data.country) {
      batch.update(doc(db, 'venues', d.id), { country: 'KOREA' });
      count++;
    }
  });

  await batch.commit();
  console.log(`Updated ${count} venues with country: KOREA`);
}

updateVenueCountry().catch(console.error);
