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

async function findLocalData() {
  const venuesRef = collection(db, 'venues');
  const venuesSnap = await getDocs(venuesRef);
  const venueMap = {};
  venuesSnap.docs.forEach(d => {
    const data = d.data();
    const city = (data.city || '').toUpperCase();
    if (city !== 'SEOUL' && city !== 'INCHEON' && city !== 'INCHUN') {
      venueMap[d.id] = { name: data.name, nameKo: data.nameKo, city: data.city, address: data.address };
      console.log(`LOCAL VENUE: id=${d.id}, name=${data.name}, nameKo=${data.nameKo}, city=${data.city}`);
    }
  });

  const socialsRef = collection(db, 'socials');
  const socialsSnap = await getDocs(socialsRef);
  socialsSnap.docs.forEach(d => {
    const data = d.data();
    const venueId = data.venueId || '';
    if (venueMap[venueId]) {
      console.log(`LOCAL SOCIAL: id=${d.id}, type=${data.type}, title=${data.title}, titleNative=${data.titleNative}, venueName=${data.venueName}, venueId=${data.venueId}`);
    }
  });
}

findLocalData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
