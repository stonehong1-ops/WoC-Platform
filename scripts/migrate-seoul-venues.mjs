import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// .env.local 로드
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

async function runMigration() {
  console.log('Starting migration for Seoul venues...');
  
  const querySnapshot = await getDocs(collection(db, 'venues'));
  let updatedCount = 0;
  
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const city = (data.city || '').toUpperCase();
    const hasSeoulArea = !!data.seoulArea;
    
    // 서울이면서 seoulArea가 없는 경우
    if (city === 'SEOUL' && !hasSeoulArea) {
      const address = (data.address || '').toLowerCase();
      const district = (data.district || '').toLowerCase();
      const name = (data.name || '').toLowerCase();
      const nameKo = (data.nameKo || '').toLowerCase();
      
      const gangbukDists = [
        '마포', '용산', '성동', '서대문', '종로', '중구', '광진', '은평', '성북', '동대문', '중랑', '강북', '도봉', '노원',
        'mapo', 'yongsan', 'seongdong', 'seodaemun', 'jongno', 'junggu', 'gwangjin', 'eunpyeong', 'seongbuk', 'dongdaemun', 'jungnang', 'gangbuk', 'dobong', 'nowon',
        '홍대', '합정', '망원', '신촌', '을지로', '혜화', '상수', '서교', '연남',
        'hongdae', 'hapjeong', 'mangwon', 'sinchon', 'euljiro', 'hyehwa', 'sangsu', 'seogyo', 'yeonnam'
      ];
      
      let assignedArea = 'gangnam'; // 기본 강남
      for (const d of gangbukDists) {
        if (address.includes(d) || district.includes(d) || name.includes(d) || nameKo.includes(d)) {
          assignedArea = 'gangbuk';
          break;
        }
      }
      
      console.log(`Updating venue "${data.nameKo || data.name}" (${docSnap.id}) -> seoulArea: ${assignedArea}`);
      const venueRef = doc(db, 'venues', docSnap.id);
      await updateDoc(venueRef, { seoulArea: assignedArea });
      updatedCount++;
    }
  }
  
  console.log(`Migration finished. Total updated venues: ${updatedCount}`);
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
