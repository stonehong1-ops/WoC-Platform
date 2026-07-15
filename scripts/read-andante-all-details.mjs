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

async function analyzeAndante() {
  const socialsRef = collection(db, 'socials');
  const snap = await getDocs(socialsRef);
  
  const andanteSocials = [];
  
  snap.docs.forEach(d => {
    const data = d.data();
    const venue = (data.venueName || '').toLowerCase();
    if (venue.includes('andante') || venue.includes('안단테') || data.venueId === 'QtjovOcmoPzJ8SPyeZKh') {
      andanteSocials.push({ id: d.id, ...data });
    }
  });

  console.log(`=== ANDANTE SOCIALS IN DB (Total: ${andanteSocials.length}) ===`);
  andanteSocials.forEach(s => {
    console.log(`- ID: ${s.id}`);
    console.log(`  Title: ${s.title} (${s.titleNative || 'No Native'})`);
    console.log(`  Type: ${s.type}, DayOfWeek: ${s.dayOfWeek}, Recurrence: ${s.recurrence}`);
    console.log(`  Time: ${s.startTime} ~ ${s.endTime}`);
    console.log(`  Current DJ: ${s.djName} (${s.djNameNative || 'None'})`);
    console.log(`  DJs in DB: ${JSON.stringify(s.djs || [])}`);
    console.log('------------------------------------');
  });
}

analyzeAndante().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
