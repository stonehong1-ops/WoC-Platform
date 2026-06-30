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

async function findSocials() {
  const socialsRef = collection(db, 'socials');
  const snap = await getDocs(socialsRef);
  let found = false;
  snap.docs.forEach(d => {
    const data = d.data();
    const venueId = data.venueId || '';
    const title = (data.title || '').toLowerCase();
    const titleNative = (data.titleNative || '').toLowerCase();
    // En Paz venue ID is '82e5OLQtPv4sG4Qj53jk' (from apply-july-schedules.mjs)
    if (venueId === '82e5OLQtPv4sG4Qj53jk' || title.includes('luminoso') || title.includes('camellia') || title.includes('vidamia') || title.includes('lola') || title.includes('nubeer') || title.includes('누베르') || title.includes('로라') || title.includes('비다미아') || title.includes('루미노소')) {
      console.log(`FOUND ENPAZ SOCIAL: id=${d.id}, type=${data.type}, title=${data.title}, titleNative=${data.titleNative}, djs=${JSON.stringify(data.djs || [])}`);
      found = true;
    }
  });
  if (!found) {
    console.log('No En Paz social found.');
  }
}

findSocials().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
