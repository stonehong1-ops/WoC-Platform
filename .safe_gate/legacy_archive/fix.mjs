import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fix() {
  const spaces = await getDocs(collection(db, 'rental_spaces'));
  for (const s of spaces.docs) {
    const data = s.data();
    if (data.title && data.title.endsWith(' Rental')) {
      const newTitle = data.title.slice(0, -7);
      await updateDoc(doc(db, 'rental_spaces', s.id), { title: newTitle });
      console.log('Fixed space title:', newTitle);
    }
  }

  const groups = await getDocs(collection(db, 'groups'));
  for (const g of groups.docs) {
    const data = g.data();
    // Disable rental for groups that are obviously shops/stays
    // The user specifically mentioned Vivian Shoes
    if (['vivian-shoes', 'sharon-shoes', 'odile-shoes', 't-balance-shoes'].includes(g.id)) {
      await updateDoc(doc(db, 'groups', g.id), { 'activeServices.rental': false });
      console.log('Disabled rental for group:', g.id);
    }
  }
  console.log('Done!');
  process.exit(0);
}

fix().catch(console.error);
