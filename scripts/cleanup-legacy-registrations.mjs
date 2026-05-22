// 사용자 신청 데이터 정리 및 보정을 담당하는 데이터베이스 마이그레이션 스크립트
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Firebase Admin SDK 초기화
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

if (!initialized && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'woc-platform-seoul-1234'
    });
    console.log('Firebase initialized using applicationDefault successfully.');
    initialized = true;
  } catch (err) {
    console.error('Failed to initialize with applicationDefault credentials:', err);
    process.exit(1);
  }
}

const db = admin.firestore();

// 상수 설정
const LEGACY_GROUP_ID = 'rglqeyjDHzzhbUwuim5O';
const REAL_GROUP_ID = 'freestyle-tango';
const BOUNDARY_DATE = new Date('2026-05-15T00:00:00+09:00'); // KST 기준 5월 15일 00:00:00

async function runCleanup() {
  console.log('--------------------------------------------------');
  console.log('Starting Firestore Class Registrations Cleanup & Correction...');
  console.log(`Target Boundary Date (KST): ${BOUNDARY_DATE.toLocaleString('ko-KR')}`);
  console.log(`Legacy Group ID: ${LEGACY_GROUP_ID}`);
  console.log(`Real Group ID: ${REAL_GROUP_ID}`);
  console.log('--------------------------------------------------');

  const registrationsRef = db.collection('class_registrations');
  const snapshot = await registrationsRef.get();

  console.log(`Total found in class_registrations: ${snapshot.size} documents.`);

  let deleteCount = 0;
  let updateCount = 0;
  let keepCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const docId = doc.id;
    const data = doc.data();
    
    // appliedAt 날짜 파싱
    let appliedDate = null;
    if (data.appliedAt) {
      if (typeof data.appliedAt.toDate === 'function') {
        appliedDate = data.appliedAt.toDate();
      } else if (data.appliedAt instanceof Date) {
        appliedDate = data.appliedAt;
      } else {
        appliedDate = new Date(data.appliedAt);
      }
    } else if (doc.createTime) {
      appliedDate = doc.createTime.toDate();
    } else {
      appliedDate = new Date(0); // 기본값 에러 방지
    }

    const applicantName = data.applicantName || 'Unknown Applicant';
    const classTitle = data.classTitle || 'Unknown Class';
    const currentGroupId = data.groupId || '';

    // 5월 15일 이전 신청 내역은 전부 삭제
    if (appliedDate < BOUNDARY_DATE) {
      try {
        await registrationsRef.doc(docId).delete();
        console.log(`[DELETE] Success - ID: ${docId} | Applicant: ${applicantName} | Date: ${appliedDate.toISOString()} | Class: ${classTitle}`);
        deleteCount++;
      } catch (err) {
        console.error(`[DELETE ERROR] ID: ${docId} | Applicant: ${applicantName} |`, err);
        errorCount++;
      }
    } 
    // 5월 15일 이후 신청 내역은 남겨두되, 레거시 ID인 경우 보정
    else {
      if (currentGroupId === LEGACY_GROUP_ID) {
        try {
          await registrationsRef.doc(docId).update({
            groupId: REAL_GROUP_ID,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`[UPDATE] Success - ID: ${docId} | Applicant: ${applicantName} | Date: ${appliedDate.toISOString()} | GroupId corrected: ${currentGroupId} -> ${REAL_GROUP_ID}`);
          updateCount++;
        } catch (err) {
          console.error(`[UPDATE ERROR] ID: ${docId} | Applicant: ${applicantName} |`, err);
          errorCount++;
        }
      } else if (currentGroupId === REAL_GROUP_ID) {
        console.log(`[KEEP] Corrected already - ID: ${docId} | Applicant: ${applicantName} | Date: ${appliedDate.toISOString()} | GroupId already match: ${REAL_GROUP_ID}`);
        keepCount++;
      } else {
        console.log(`[KEEP] Other Group - ID: ${docId} | Applicant: ${applicantName} | Date: ${appliedDate.toISOString()} | GroupId: ${currentGroupId}`);
        keepCount++;
      }
    }
  }

  console.log('--------------------------------------------------');
  console.log('Cleanup & Migration process completed successfully.');
  console.log(`Summary:`);
  console.log(`  - Deleted documents (before May 15): ${deleteCount}`);
  console.log(`  - Updated documents (corrected legacy ID): ${updateCount}`);
  console.log(`  - Kept documents (valid May 15+): ${keepCount}`);
  console.log(`  - Process errors encountered: ${errorCount}`);
  console.log('--------------------------------------------------');
  process.exit(0);
}

runCleanup().catch(err => {
  console.error('Fatal cleanup execution error:', err);
  process.exit(1);
});
