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

async function findMasterSocials() {
  console.log('Searching for multiple socials...');
  const snap = await getDocs(collection(db, 'socials'));
  snap.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const native = (data.titleNative || '').toLowerCase();
    const venue = (data.venueName || '').toLowerCase();
    const venueKo = (data.venueNameNative || '').toLowerCase();

    // 8개 키워드 매칭
    const keywords = ['olle', '올레', 'cortina', '꼬르띠나', 'jb', 'if', '이프', '오렌지', 'orange', 'milpasso', '밀빠소', 'vivi', '비비', 'vuelo', '부엘로'];
    const match = keywords.some(k => title.includes(k) || native.includes(k) || venue.includes(k) || venueKo.includes(k));

    if (match) {
      console.log(`FOUND DOC ID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      console.log('------------------------------------');
    }
  });

  const venuesSnap = await getDocs(collection(db, 'venues'));
  venuesSnap.forEach(doc => {
    const data = doc.data();
    const name = (data.name || '').toLowerCase();
    const native = (data.nameNative || '').toLowerCase();
    const keywords = ['olle', '올레', 'despacio', '데스빠시오', 'magenta', '마젠타', 'viento', '비엔토', 'bailamos', '바일라모스', 'ventana', '벤따나'];
    const match = keywords.some(k => name.includes(k) || native.includes(k));
    if (match) {
      console.log(`FOUND VENUE ID: ${doc.id}`);
      console.log(`  Name: ${data.name} (${data.nameNative})`);
      console.log('------------------------------------');
    }
  });
}

findMasterSocials().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
