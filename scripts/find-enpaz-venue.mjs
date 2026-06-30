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

async function findVenue() {
  const venuesRef = collection(db, 'venues');
  const snap = await getDocs(venuesRef);
  snap.docs.forEach(d => {
    const data = d.data();
    const name = (data.name || '').toLowerCase();
    const nameKo = (data.nameKo || '').toLowerCase();
    if (name.includes('paz') || nameKo.includes('엔빠스') || nameKo.includes('엔파스') || nameKo.includes('enpaz')) {
      console.log(`FOUND ENPAZ VENUE: id=${d.id}, name=${data.name}, nameKo=${data.nameKo}, address=${data.address}`);
    }
  });
}

findVenue().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
