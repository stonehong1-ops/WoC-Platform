import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

// Load service account key
const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error(`❌ Failed to load service account key from ${serviceAccountPath}`, error);
  process.exit(1);
}

// Initialize Firebase Admin
try {
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error', error.stack);
  }
}

const db = getFirestore();

const locations = ['홍대/합정', '강남/논현', '성수/건대', '신촌/이대', '사당/방배', '신림/서울대', '건대/구의', '종로/을지로'];
const categories = ['댄스 스튜디오', '보컬/악기 연습실', '파티룸', '촬영 스튜디오', '요가/필라테스', '다목적홀'];

const facilitiesPool = ['Wi-Fi', '블루투스 스피커', '탈의실', '전면 거울', '정수기', '방음부스', '피아노', '자연광', '조명기기', '소품', '냉난방기', '빔프로젝터', '마이크', '주차가능'];

const generateSpaces = (num) => {
  const spaces = [];
  for (let i = 0; i < num; i++) {
    const location = locations[i % locations.length];
    const category = categories[i % categories.length];
    
    // Random facilities
    const shuffledFacilities = facilitiesPool.sort(() => 0.5 - Math.random());
    const selectedFacilities = shuffledFacilities.slice(0, 3 + Math.floor(Math.random() * 4));

    spaces.push({
      hostId: `system_host_${i}`,
      title: `${location.split('/')[0]} 프리미엄 ${category} ${i + 1}호점`,
      description: `다양한 용도로 사용 가능한 쾌적한 ${category}입니다. 최신 시설을 갖추고 있습니다.`,
      location: location,
      address: `서울시 어느구 어느동 ${100 + i}-${i}`,
      images: [
        'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop'
      ].slice(i % 4, (i % 4) + 1), // Select one image per space based on index
      category: category,
      pricePerHour: 10000 + Math.floor(Math.random() * 5) * 5000,
      minHours: 1 + Math.floor(Math.random() * 3),
      facilities: selectedFacilities,
      rules: '퇴실 시 정리정돈 필수, 기물 파손 주의',
      regularClasses: Math.random() > 0.5 ? [
        { day: Math.floor(Math.random() * 7), start: '18:00', end: '20:00' }
      ] : [],
      likesCount: Math.floor(Math.random() * 50)
    });
  }
  return spaces;
};

const mockSpaces = generateSpaces(16);

async function seedRentals() {
  console.log('🔍 Rental Seeding Script Started\n');
  const collectionRef = db.collection('rental_spaces');
  
  let count = 0;
  for (const space of mockSpaces) {
    const docData = {
      ...space,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    await collectionRef.add(docData);
    console.log(`  🏠 [${space.category}] ${space.title}`);
    count++;
  }

  console.log(`\n✅ Seeding Complete: ${count} rental spaces seeded`);
  process.exit(0);
}

seedRentals().catch(console.error);
