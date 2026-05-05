import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
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

const toShop = [
  "Maravilla J"
];

async function updateCategory(names: string[], newCategory: string) {
  for (const name of names) {
    console.log(`Updating ${name} to ${newCategory}...`);
    const q = query(collection(db, 'venues'), where('name', '==', name));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`  -> Not found: ${name}.`);
    } else {
      for (const document of querySnapshot.docs) {
        await updateDoc(doc(db, 'venues', document.id), {
          category: newCategory,
          types: [newCategory]
        });
        console.log(`  -> Updated ${document.id} successfully.`);
      }
    }
  }
}

async function main() {
  try {
    console.log('--- Updating to Shop ---');
    await updateCategory(toShop, 'Shop');
    
    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating venues:', err);
    process.exit(1);
  }
}

main();
