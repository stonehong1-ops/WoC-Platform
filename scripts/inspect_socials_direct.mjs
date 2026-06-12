import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// .env.local 파싱하여 환경 변수 등록
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

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

async function inspect() {
  console.log("Starting socials inspection...");
  const snap = await getDocs(collection(db, 'socials'));
  console.log(`Total socials docs fetched: ${snap.docs.length}`);
  
  const targets = ["in the mood", "인무땅", "mil mil", "밀밀", "onada", "월나다", "토나다", "화앤쁘락", "오빠밀", "라노체", "불금", "솔땅"];
  const matched = [];
  
  snap.docs.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const titleNative = (data.titleNative || '').toLowerCase();
    const id = doc.id;
    
    const isMatchedName = targets.some(target => title.includes(target) || titleNative.includes(target));
    
    if (isMatchedName) {
      matched.push({ id, ...data });
    }
  });
  
  console.log(`Matched socials: ${matched.length}`);
  matched.forEach(item => {
    console.log('----------------------------------------');
    console.log(`ID: ${item.id}`);
    console.log(`Title: ${item.title} (${item.titleNative})`);
    console.log(`Type: ${item.type}, DayOfWeek: ${item.dayOfWeek}`);
    console.log(`StartTime: ${item.startTime}, EndTime: ${item.endTime}`);
    console.log(`djName: ${item.djName} (${item.djNameNative})`);
    console.log(`djs array: ${JSON.stringify(item.djs || [])}`);
    console.log(`imageUrl: "${item.imageUrl}"`);
    console.log(`organizerName: ${item.organizerName} (${item.organizerNameNative})`);
    console.log(`venueName: ${item.venueName} (${item.venueNameNative}), venueId: ${item.venueId}`);
  });

  console.log("\n=== VENUES DUMP ===");
  const venuesSnap = await getDocs(collection(db, 'venues'));
  venuesSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Venue ID: ${doc.id}, Name: ${data.name}, NameKo: ${data.nameKo}, NameNative: ${data.nameNative}, TitleNative: ${data.titleNative}`);
  });
}

inspect().catch(console.error);
