import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Firebase Admin SDK 설정은 임시 서비스 계정 키 또는 ADC를 사용해야 합니다.
// 하지만 사용자 환경에 gcloud auth가 되어 있다면:
initializeApp({ projectId: 'woc-platform-seoul-1234' });
const db = getFirestore();

async function checkGroups() {
  const groupsSnapshot = await db.collection('groups').get();
  console.log('--- GROUPS ---');
  groupsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`[${doc.id}] ${data.name} / venueId: ${data.venueId || 'MISSING'}`);
  });

  const venuesSnapshot = await db.collection('venues').get();
  console.log('\n--- VENUES ---');
  venuesSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`[${doc.id}] ${data.name}`);
  });
}

checkGroups().catch(console.error);
