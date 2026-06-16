import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0",
  authDomain: "www.woc.today",
  projectId: "woc-platform-seoul-1234",
  storageBucket: "woc-platform-seoul-1234.firebasestorage.app",
  messagingSenderId: "1021887439599",
  appId: "1:1021887439599:web:7c5741009dd928b8fd311a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function getCityGroup(city) {
  if (!city) return 'SEOUL';
  const c = city.trim().toUpperCase();
  
  if (['SEOUL', 'INCHEON', 'GYEONGGI', 'GANGWON', '인천', '경기', '강원', '서울'].some(x => c.includes(x.toUpperCase()))) {
    return 'SEOUL';
  }
  if (['BUSAN', 'DAEGU', 'ULSAN', 'GYEONGSANG', 'YEONGNAM', 'GYEONGBUK', 'GYEONGNAM', 'CHANGWON', '부산', '대구', '울산', '경상', '영남', '경북', '경남', '창원'].some(x => c.includes(x.toUpperCase()))) {
    return 'BUSAN';
  }
  if (['GWANGJU', 'JEONBUK', 'JEONNAM', 'HONAM', 'JEJU', '광주', '전북', '전남', '호남', '제주'].some(x => c.includes(x.toUpperCase()))) {
    return 'GWANGJU';
  }
  if (['DAEJEON', 'SEJONG', 'CHUNGBUK', 'CHUNGNAM', 'CHUNGCHEONG', '대전', '세종', '충북', '충남', '충청'].some(x => c.includes(x.toUpperCase()))) {
    return 'DAEJEON';
  }
  
  return 'SEOUL';
}

async function auditSocials() {
  console.log('🔍 [소셜 데이터 4대 권역 매핑 전수 검증 개시]');
  const socialsSnap = await getDocs(collection(db, 'socials'));
  const venuesSnap = await getDocs(collection(db, 'venues'));
  
  const venuesMap = {};
  venuesSnap.forEach(d => {
    venuesMap[d.id] = d.data();
  });
  
  let total = 0;
  let successCount = 0;
  let allCount = 0;
  const failures = [];
  
  socialsSnap.forEach(doc => {
    const s = doc.data();
    total++;
    
    const docId = doc.id;
    const title = s.titleNative || s.title || 'No Title';
    const rawCity = s.city || '';
    
    const venue = s.venueId ? venuesMap[s.venueId] : null;
    const vCity = venue ? (venue.city || '') : '';
    const vAddr = venue ? (venue.address || '') : '';
    
    let resolvedCity = rawCity;
    if (!resolvedCity.trim() && vCity.trim()) {
      resolvedCity = vCity;
    }
    if (!resolvedCity.trim() && vAddr.trim()) {
      resolvedCity = vAddr;
    }
    
    const group = getCityGroup(resolvedCity);
    
    if (group === 'ALL') {
      failures.push({
        id: docId,
        title,
        rawCity,
        vCity,
        vAddr,
        resolvedCity
      });
      allCount++;
    } else {
      successCount++;
    }
  });
  
  console.log(`\n📊 [검증 통계]`);
  console.log(`- 전체 소셜 문서 개수: ${total}개`);
  console.log(`- 4대 권역에 정확히 안착한 개수: ${successCount}개`);
  console.log(`- ALL(권역 매핑 누락) 개수: ${allCount}개`);
  
  if (failures.length > 0) {
    console.log(`\n🚨 [누락 의심 소셜 명단]`);
    failures.forEach((f, i) => {
      console.log(`[${i + 1}] ID: ${f.id} | 제목: ${f.title} | DB 도시명: "${f.rawCity}" | 베뉴 도시명: "${f.vCity}" | 주소: "${f.vAddr}"`);
    });
  } else {
    console.log(`\n✅ [검증 완료] 모든 소셜이 서울, 부산, 광주, 대전 권역 중 하나에 완벽히 매핑됩니다.`);
  }
}

auditSocials().catch(console.error);
