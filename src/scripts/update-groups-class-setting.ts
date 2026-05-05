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

const targetNames = [
  "Andante",
  "Bonita",
  "Ocho",
  "Onada 2",
  "Onada",
  "Tango Pista",
  "Evenia",
  "Soltang Studio",
  "Fiesta",
  "La Loca",
  "Tango House Stay",
  "Tango Stay",
  "Tango House",
  "Tango Stay Canaro",
  "Maravilla J",
  "Tango Shoes Korea"
];

async function updateGroupClassSetting(names: string[]) {
  for (const name of names) {
    console.log(`Updating ${name} class setting to Off...`);
    const q = query(collection(db, 'groups'), where('name', '==', name));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`  -> Not found in groups: ${name}. Let's check nativeName or other fields if needed.`);
    } else {
      for (const document of querySnapshot.docs) {
        const data = document.data();
        const activeServices = data.activeServices || {};
        activeServices.class = false;
        
        await updateDoc(doc(db, 'groups', document.id), {
          activeServices: activeServices
        });
        console.log(`  -> Updated group ${document.id} successfully.`);
      }
    }
  }
}

async function main() {
  try {
    console.log('--- Turning off class setting for groups ---');
    await updateGroupClassSetting(targetNames);
    
    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating groups:', err);
    process.exit(1);
  }
}

main();
