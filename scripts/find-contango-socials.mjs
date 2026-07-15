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

async function findContango() {
  const socialsRef = collection(db, 'socials');
  const snap = await getDocs(socialsRef);
  let found = false;
  snap.docs.forEach(d => {
    const data = d.data();
    const title = (data.title || '').toLowerCase();
    const titleNative = (data.titleNative || '').toLowerCase();
    const city = (data.city || '').toLowerCase();
    if (title.includes('contango') || title.includes('con milonga') || titleNative.includes('꼰땅고') || titleNative.includes('꼰밀롱가') || city.includes('gwangju')) {
      console.log(`FOUND SOCIAL: id=${d.id}, type=${data.type}, title=${data.title}, titleNative=${data.titleNative}, venueName=${data.venueName}, city=${data.city}, dayOfWeek=${data.dayOfWeek}`);
      found = true;
    }
  });
  if (!found) {
    console.log('No Contango/Gwangju social found.');
  }
}

findContango().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
