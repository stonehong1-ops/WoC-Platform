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

async function migrateSocialCountry() {
  console.log('🔄 [소셜 데이터 country 필드 보정 시작]');
  const socialsSnap = await db.collection('socials').get();
  
  let updatedCount = 0;
  const batch = db.batch();
  
  socialsSnap.forEach(doc => {
    const s = doc.data();
    const country = s.country || '';
    const trimmedCountry = country.trim().toUpperCase();
    
    // country 필드가 없거나 KOREA가 아닌 경우 대문자 KOREA로 보정
    if (!country || trimmedCountry !== 'KOREA') {
      const docRef = db.collection('socials').doc(doc.id);
      batch.update(docRef, { country: 'KOREA' });
      updatedCount++;
      console.log(`- 업데이트 대상: ${s.titleNative || s.title || 'No Title'} (현재 country: "${country}")`);
    }
  });
  
  if (updatedCount > 0) {
    await batch.commit();
    console.log(`\n✅ 성공적으로 ${updatedCount}개의 소셜 문서 country 필드를 "KOREA"로 업데이트하였습니다.`);
  } else {
    console.log('\n✅ 업데이트할 소셜 문서가 없습니다.');
  }
}

migrateSocialCountry().catch(console.error);
