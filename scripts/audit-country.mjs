import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

const serviceAccountPath = join(process.cwd(), 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
let db;
try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore();
} catch (e) {
  console.error('Failed to initialize Firebase Admin SDK', e);
  process.exit(1);
}

async function auditCountry() {
  console.log('🔍 [소셜 데이터 country & city 필드 전수 조사 시작]');
  const socialsSnap = await db.collection('socials').get();
  
  let total = 0;
  let missingCountry = 0;
  let notKorea = 0;
  
  const list = [];
  
  socialsSnap.forEach(doc => {
    const s = doc.data();
    total++;
    const country = s.country || '';
    const city = s.city || '';
    const title = s.titleNative || s.title || 'No Title';
    
    if (!country) {
      missingCountry++;
      list.push({ id: doc.id, title, country, city, reason: 'Missing Country' });
    } else if (country.trim().toUpperCase() !== 'KOREA') {
      notKorea++;
      list.push({ id: doc.id, title, country, city, reason: 'Not KOREA' });
    }
  });
  
  console.log(`\n📊 [조사 통계]`);
  console.log(`- 전체 소셜 문서 개수: ${total}개`);
  console.log(`- country 필드가 없는 문서 개수: ${missingCountry}개`);
  console.log(`- country 필드가 KOREA가 아닌 문서 개수: ${notKorea}개`);
  
  if (list.length > 0) {
    console.log(`\n🚨 [이슈 대상 명단 (상위 20개)]`);
    list.slice(0, 20).forEach((item, i) => {
      console.log(`[${i + 1}] ID: ${item.id} | 제목: ${item.title} | Country: "${item.country}" | City: "${item.city}" | 사유: ${item.reason}`);
    });
  } else {
    console.log(`\n✅ 모든 소셜 문서가 KOREA 국가 필드를 정상적으로 가지고 있습니다.`);
  }
}

auditCountry().catch(console.error);
