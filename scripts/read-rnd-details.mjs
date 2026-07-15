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

async function readDetails() {
  const docIds = ['1EYcXa9cMjC5yKcgroBr', 'q7hxKlIKeBJQ2uaXHphy'];
  for (const id of docIds) {
    const snap = await getDoc(doc(db, 'socials', id));
    if (snap.exists()) {
      console.log(`DOCUMENT ID: ${id}`);
      console.log(JSON.stringify(snap.data(), null, 2));
      console.log('------------------------------------');
    } else {
      console.log(`No document for ID: ${id}`);
    }
  }
}

readDetails().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
