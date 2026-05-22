// 실제 신청자 데이터 존재 여부 전수조사 디버그 스크립트
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
    console.log('Firebase initialized successfully for user scan.');
    initialized = true;
  } catch (err) {
    console.error('Failed to initialize with Service Account file:', err);
  }
}

const db = admin.firestore();

// 사용자가 언급한 실제 신청 유저 키워드 목록
const searchKeywords = [
  'JEONIKYONG',
  'ROSE',
  'AJJI',
  'SILLOAN',
  'IRANG',
  'CHAOS',
  '전이경',
  '로즈',
  '아찌',
  '실로암',
  '이랑',
  '카오스'
];

async function scanRealUsers() {
  console.log('=================== REAL USER SCAN START ===================');
  const registrationsRef = db.collection('class_registrations');
  const snapshot = await registrationsRef.get();
  console.log(`Total registrations in database (all groups): ${snapshot.size}`);

  let foundCount = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const appName = data.applicantName || '';
    const depName = data.depositorName || '';
    const memo = data.applicantMemo || '';
    const grpId = data.groupId || '';
    const clsTitle = data.classTitle || '';

    // 키워드 매칭 검사
    const match = searchKeywords.some(keyword => {
      return appName.toLowerCase().includes(keyword.toLowerCase()) ||
             depName.toLowerCase().includes(keyword.toLowerCase()) ||
             memo.toLowerCase().includes(keyword.toLowerCase());
    });

    if (match) {
      console.log(`[MATCH FOUND] Doc ID: ${doc.id}`);
      console.log(`  Applicant Name: ${data.applicantName}`);
      console.log(`  Depositor Name: ${data.depositorName}`);
      console.log(`  Group ID: ${grpId}`);
      console.log(`  Class Title: ${clsTitle}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Applied At:`, data.appliedAt?.toDate ? data.appliedAt.toDate() : data.appliedAt);
      console.log('--------------------------------------------------');
      foundCount++;
    }
  });

  console.log('\n=================== SCAN RESULTS ===================');
  console.log(`Total matched registrations found across DB: ${foundCount}`);
  console.log('====================================================');
  process.exit(0);
}

scanRealUsers().catch(err => {
  console.error('Scan error:', err);
  process.exit(1);
});
