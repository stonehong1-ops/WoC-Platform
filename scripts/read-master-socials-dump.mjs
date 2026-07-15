import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

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

async function findMasterSocials() {
  console.log('Searching for multiple socials...');
  const snap = await getDocs(collection(db, 'socials'));
  const results = [];
  const venueResults = [];

  snap.forEach(doc => {
    const data = doc.data();
    results.push({ id: doc.id, ...data });
  });

  const venuesSnap = await getDocs(collection(db, 'venues'));
  venuesSnap.forEach(doc => {
    const data = doc.data();
    venueResults.push({ id: doc.id, ...data });
  });

  fs.writeFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', JSON.stringify({ socials: results, venues: venueResults }, null, 2), 'utf8');
  console.log('DONE!');
}

findMasterSocials().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
