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

async function checkDaejeonOnada() {
  console.log('=== Checking Daejeon Onada Venues ===');
  const venues = await getDocs(collection(db, 'venues'));
  let foundVenue = false;
  venues.docs.forEach(d => {
    const data = d.data();
    const name = (data.name || '').toLowerCase();
    const nameKo = (data.nameKo || '').toLowerCase();
    
    if (name.includes('pantango') || nameKo.includes('판땅고') || name.includes('club pan') || nameKo.includes('클럽 판') || nameKo.includes('클럽판')) {
      console.log(`FOUND VENUE: id=${d.id}`);
      console.log(JSON.stringify(data, null, 2));
      foundVenue = true;
    }
  });
  if (!foundVenue) console.log('No matching PAN Tango venues found.');

  console.log('=== Checking Seoul GTP Socials ===');
  const socials = await getDocs(collection(db, 'socials'));
  let foundSocial = false;
  socials.docs.forEach(d => {
    const data = d.data();
    const title = (data.title || '').toLowerCase();
    const titleNative = (data.titleNative || '').toLowerCase();
    const venueName = (data.venueName || '').toLowerCase();
    
    if (title.includes('gtp') || titleNative.includes('강남탱고') || venueName.includes('판땅고') || venueName.includes('pantango')) {
      if (data.city === 'SEOUL') {
        console.log(`FOUND SOCIAL: id=${d.id}`);
        console.log(JSON.stringify(data, null, 2));
        foundSocial = true;
      }
    }
  });
  if (!foundSocial) console.log('No matching Seoul GTP socials found.');
}

checkDaejeonOnada().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
