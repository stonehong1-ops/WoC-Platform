// 6월 정규 클래스 데이터 및 신청 데이터 구조 디버그 스크립트 (수정본)
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
    console.log('Firebase initialized using Service Account JSON file successfully.');
    initialized = true;
  } catch (err) {
    console.error('Failed to initialize with Service Account file:', err);
  }
}

const db = admin.firestore();
const GROUP_ID = 'freestyle-tango';
const CURRENT_MONTH = '2026-06';

async function runDebug() {
  console.log('\n=================== 1. GROUPS DOC INFO ===================');
  const groupDoc = await db.collection('groups').doc(GROUP_ID).get();
  if (groupDoc.exists) {
    const data = groupDoc.data();
    console.log('Group ID:', groupDoc.id);
    console.log('Group Name:', data.name);
    console.log('openMonths:', data.classPaymentSettings?.openMonths);
  } else {
    console.log('Group Doc NOT FOUND!');
  }

  console.log('\n=================== 2. CLASSES INFO ===================');
  const classesRef = db.collection('groups').doc(GROUP_ID).collection('classes');
  const classesSnap = await classesRef.get();
  console.log(`Found ${classesSnap.size} classes:`);
  classesSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  targetMonth: ${data.targetMonth}`);
    console.log(`  status: ${data.status}`);
    console.log(`  schedule:`, data.schedule?.map(s => s.date));
  });

  console.log('\n=================== 3. DISCOUNTS (BUNDLES) INFO ===================');
  const discountsRef = db.collection('groups').doc(GROUP_ID).collection('discounts');
  const discountsSnap = await discountsRef.get();
  console.log(`Found ${discountsSnap.size} discounts:`);
  discountsSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  targetMonth: ${data.targetMonth}`);
    console.log(`  includedClassIds:`, data.includedClassIds);
  });

  console.log('\n=================== 4. REGISTRATIONS INFO ===================');
  const regsRef = db.collection('class_registrations');
  const regsSnap = await regsRef.where('groupId', '==', GROUP_ID).get();
  console.log(`Found ${regsSnap.size} registrations for groupId '${GROUP_ID}':`);
  
  // 6월에 해당한다고 볼 수 있는 ID 리스트를 미리 셋업
  const validIds = new Set();
  classesSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.targetMonth === CURRENT_MONTH || data.schedule?.some(s => s.date?.startsWith(CURRENT_MONTH))) {
      validIds.add(doc.id);
    }
  });
  discountsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.targetMonth === CURRENT_MONTH) {
      validIds.add(doc.id);
    }
  });
  
  console.log('Valid IDs for 2026-06 in DB:', Array.from(validIds));

  regsSnap.docs.forEach(doc => {
    const data = doc.data();
    const isMatched = validIds.has(data.classId) || (data.selectedClassIds && data.selectedClassIds.some(id => validIds.has(id)));
    console.log(`- ID: ${doc.id} | Applicant: ${data.applicantName}`);
    console.log(`  classId: ${data.classId} | selectedClassIds: ${data.selectedClassIds}`);
    console.log(`  Is Matched to 6-month Valid IDs: ${isMatched}`);
  });

  process.exit(0);
}

runDebug().catch(err => {
  console.error(err);
  process.exit(1);
});
