// 프로덕션 환경 테스트 데이터 긴급 삭제 스크립트
import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
let initialized = false;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase initialized successfully for emergency cleanup.');
    initialized = true;
  } catch (err) {
    console.error('Failed to initialize with Service Account file:', err);
  }
}

const db = admin.firestore();
const GROUP_ID = 'freestyle-tango';

// 삭제 대상 명시적 문서 ID 목록 (6월 10건 주입 로그 확인 결과)
const targetDocIds = [
  'NG6xq0CALOAAmzlyPwQL',
  'nkJZi5uvoJsG5TNp9lYn',
  'g3joRFZckFQYX8dKxwbA',
  'vnIvN00TyCLmerLdlAL4',
  'ibhf0JtQGu13zRnMm8Bp',
  'BekqlxbCPv0J1RuGhf7f',
  'SOZNlI0co5bmEtufxV5L',
  'Hz4Yb7VjuxkVQFzKQnEG',
  '2G47q2Rlnnb8m37ZihEI',
  'lbC7UjcfBJVWz6wRmqqh'
];

// 삭제 대상 오기입 임시 클래스 ID 목록
const tempClassIds = [
  'b33ca2ce-df0b-4996-af58-06292e5566a2',
  '70abe9f2-6a45-4739-97c2-3f75e718b046'
];

async function emergencyDelete() {
  console.log('=================== EMERGENCY CLEANUP START ===================');
  const registrationsRef = db.collection('class_registrations');

  let deletedCount = 0;

  // 1. 명시적 문서 ID에 따른 긴급 삭제
  for (const docId of targetDocIds) {
    const docRef = registrationsRef.doc(docId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      console.log(`[DELETE TARGET] Found by ID: ${docId} | Applicant: ${data.applicantName}`);
      await docRef.delete();
      console.log(`[DELETE SUCCESS] Deleted doc: ${docId}`);
      deletedCount++;
    } else {
      console.log(`[NOT FOUND] Doc ID ${docId} already deleted or not found.`);
    }
  }

  // 2. 혹시 남아있을 수 있는 임시 클래스 ID 기반 가상 신청 전수조사 및 추가 삭제
  console.log('\nScanning for remaining mock class registrations...');
  const snapshot = await registrationsRef.where('groupId', '==', GROUP_ID).get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (tempClassIds.includes(data.classId)) {
      console.log(`[EXTRA DELETE TARGET] Found by Temp Class ID: ${doc.id} | Applicant: ${data.applicantName}`);
      await registrationsRef.doc(doc.id).delete();
      console.log(`[DELETE SUCCESS] Deleted extra doc: ${doc.id}`);
      deletedCount++;
    }
  }

  console.log('\n=================== EMERGENCY CLEANUP COMPLETE ===================');
  console.log(`Total mock registrations deleted: ${deletedCount}`);
  console.log('==================================================================');
  process.exit(0);
}

emergencyDelete().catch(err => {
  console.error('Emergency cleanup failed:', err);
  process.exit(1);
});
