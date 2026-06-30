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

async function findAllVenues() {
  const venuesRef = collection(db, 'venues');
  const snap = await getDocs(venuesRef);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`VENUE: id=${d.id}, name=${data.name}, nameKo=${data.nameKo}, city=${data.city}, address=${data.address}`);
  });
}

findAllVenues().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
