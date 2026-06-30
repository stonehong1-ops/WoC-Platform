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

async function findPistaSocials() {
  const socialsRef = collection(db, 'socials');
  const snap = await getDocs(socialsRef);
  let found = false;
  snap.docs.forEach(d => {
    const data = d.data();
    const venueId = data.venueId || '';
    if (venueId === 'zkZm9gZvHdnSPzSOR5Gp') {
      console.log(`FOUND PISTA SOCIAL: id=${d.id}, type=${data.type}, subCategory=${data.subCategory}, title=${data.title}, titleNative=${data.titleNative}`);
      found = true;
    }
  });
  if (!found) {
    console.log('No Pista social found.');
  }
}

findPistaSocials().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
