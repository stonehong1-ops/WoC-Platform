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

async function findSocial() {
  const docRef = doc(db, 'socials', 'v0zd2tN2sQpDRW0lSwAi');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log(`SOCIAL: ${JSON.stringify(snap.data())}`);
  } else {
    console.log('No social found for v0zd2tN2sQpDRW0lSwAi');
  }
}

findSocial().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
