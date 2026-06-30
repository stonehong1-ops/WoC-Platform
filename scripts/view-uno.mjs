import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function viewSocial() {
  const docRef = doc(db, 'socials', 'fWIzPkYwXL3IGwPKd6gw');
  const d = await getDoc(docRef);
  if (d.exists()) {
    console.log(JSON.stringify(d.data(), null, 2));
  } else {
    console.log('Not found');
  }
}

viewSocial().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
