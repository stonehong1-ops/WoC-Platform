import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function main() {
  const querySnapshot = await getDocs(collection(db, 'venues'));
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name && data.name.toLowerCase().includes('maravill')) {
      console.log(`Found: ${data.name} (ID: ${doc.id})`);
    }
    if (data.nameKo && data.nameKo.toLowerCase().includes('마라빌')) {
      console.log(`Found Ko: ${data.nameKo} (ID: ${doc.id})`);
    }
  });
  process.exit(0);
}

main();
