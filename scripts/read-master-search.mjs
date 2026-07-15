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

async function masterSearch() {
  console.log('Searching Firestore database for all targets...');
  
  // 1. socials 검색
  const socialsSnap = await getDocs(collection(db, 'socials'));
  console.log('--- SOCIALS SEARCH ---');
  socialsSnap.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const native = (data.titleNative || '').toLowerCase();
    const venue = (data.venueName || '').toLowerCase();

    const targets = ['milpasso', '밀빠소', 'luminoso', '루미노', 'gricel', '그리쎌', '그리셀', 'ocho', '오초'];
    let matched = false;
    for (const t of targets) {
      if (title.includes(t) || native.includes(t) || venue.includes(t)) {
        matched = true;
        break;
      }
    }
    if (matched) {
      console.log(`FOUND SOCIAL ID: ${doc.id}`);
      console.log(`  Title: ${data.title} (${data.titleNative})`);
      console.log(`  Type: ${data.type}, SubCategory: ${data.subCategory}`);
      console.log(`  Venue: ${data.venueName} (${data.venueNameNative})`);
      console.log(`  ImageUrl: ${data.imageUrl}`);
      console.log('------------------------------------');
    }
  });

  // 2. groups 검색
  const groupsSnap = await getDocs(collection(db, 'groups'));
  console.log('--- GROUPS SEARCH ---');
  groupsSnap.forEach(doc => {
    const data = doc.data();
    const name = (data.name || '').toLowerCase();
    const native = (data.nameNative || '').toLowerCase();
    if (name.includes('ocho') || native.includes('오초') || name.includes('milpasso') || native.includes('밀빠소')) {
      console.log(`FOUND GROUP ID: ${doc.id}`);
      console.log(`  Name: ${data.name} (${data.nameNative})`);
      console.log('------------------------------------');
    }
  });
}

masterSearch().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
