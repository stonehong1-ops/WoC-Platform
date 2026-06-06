import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  admin.initializeApp({
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();
const GROUP_ID = 'freestyle-tango';
const CURRENT_MONTH = '2026-06';
const COACH_ID = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
const COACH_NAME = 'StoneAdmin';

async function runBulkCreation() {
  console.log('🚀 [코치/코칭방 일괄 생성 스크립트 실행]');

  // 1. Stone Hong 코치 권한 부여 (isInstructor: true)
  console.log(`\n1. [코치 권한 활성화] ID: ${COACH_ID} ...`);
  const coachRef = db.collection('users').doc(COACH_ID);
  const coachSnap = await coachRef.get();
  if (!coachSnap.exists) {
    console.error('❌ 에러: Stone Hong 사용자를 데이터베이스에서 찾을 수 없습니다.');
    process.exit(1);
  }
  
  await coachRef.update({
    isInstructor: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ 코치 권한 부여 완료 (isInstructor: true)');

  // 2. 6월 프리스타일탱고 수업 수강생 조회 (기존 분석 로직 활용)
  console.log('\n2. [6월 수강생 정보 수집 중] ...');
  const classesRef = db.collection('groups').doc(GROUP_ID).collection('classes');
  const classesSnap = await classesRef.get();
  
  const discountsRef = db.collection('groups').doc(GROUP_ID).collection('discounts');
  const discountsSnap = await discountsRef.get();

  const juneClassIds = new Set();
  classesSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.targetMonth === CURRENT_MONTH || data.schedule?.some(s => s.date?.startsWith(CURRENT_MONTH))) {
      juneClassIds.add(doc.id);
    }
  });
  discountsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.targetMonth === CURRENT_MONTH) {
      juneClassIds.add(doc.id);
    }
  });

  const bookingsRef = db.collection('bookings');
  const bookingsSnap = await bookingsRef.where('status', 'in', ['CONFIRMED', 'SELLER_CONFIRMED', 'DELIVERED', 'BANK_TRANSFERRED']).get();
  
  const regsRef = db.collection('class_registrations');
  const regsSnap = await regsRef.where('groupId', '==', GROUP_ID).get();

  const activeStudents = new Map();

  bookingsSnap.docs.forEach(doc => {
    const data = doc.data();
    const payload = data.payload || {};
    const classId = payload.classId || data.itemId || '';
    if (juneClassIds.has(classId) && data.buyerId) {
      activeStudents.set(data.buyerId, data.buyerName || 'Target');
    }
  });

  regsSnap.docs.forEach(doc => {
    const data = doc.data();
    const isConfirmed = ['CONFIRMED', 'SELLER_CONFIRMED', 'DELIVERED', 'BANK_TRANSFERRED'].includes(data.status);
    if (!isConfirmed) return;
    const classId = data.classId || '';
    const selectedIds = data.selectedClassIds || [];
    const isJuneReg = juneClassIds.has(classId) || selectedIds.some(id => juneClassIds.has(id));
    if (isJuneReg && data.userId) {
      activeStudents.set(data.userId, data.applicantName || 'Target');
    }
  });

  console.log(`✅ 수강생 ${activeStudents.size}명 수집 완료.`);

  // 3. 1:1 코칭방 35개 생성
  console.log('\n3. [1:1 코칭방 일괄 개설 중] ...');
  
  let createdCount = 0;
  for (const [studentId, studentName] of activeStudents.entries()) {
    
    // 이미 이 코치와 학생 간의 코칭방이 개설되어 있는지 중복 검사
    const existingRoomsSnap = await db.collection('coaching_rooms')
      .where('coachId', '==', COACH_ID)
      .where('studentIds', 'array-contains', studentId)
      .get();
      
    if (existingRoomsSnap.size > 0) {
      console.log(`- ⚠️ [건너뜀] ${studentName} (ID: ${studentId}) 님과의 코칭방이 이미 개설되어 있습니다.`);
      continue;
    }

    const roomRef = db.collection('coaching_rooms').doc();
    const roomId = roomRef.id;

    // 코칭방 정보 작성
    const newRoom = {
      title: studentName,
      coachId: COACH_ID,
      coachName: COACH_NAME,
      studentIds: [studentId],
      studentNames: [studentName],
      status: 'active',
      overallProgress: 0,
      activeAssignmentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await roomRef.set(newRoom);

    // 첫 시스템 웰컴 피드 기록
    const feedRef = roomRef.collection('feed').doc();
    await feedRef.set({
      roomId: roomId,
      type: 'system_log',
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      content: 'System: 1:1 코칭 공간이 생성되었습니다. 이 공간에서 연습 기록과 코칭 피드백을 관리하세요.',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    createdCount++;
    console.log(`- ✅ [생성 완료] ${createdCount}/${activeStudents.size} | 학생: ${studentName} (ID: ${studentId})`);
  }

  console.log(`\n✨ 작업이 성공적으로 끝났습니다. 총 ${createdCount}개의 새 코칭방을 개설했습니다.`);
  process.exit(0);
}

runBulkCreation().catch(err => {
  console.error('❌ 에러 발생:', err);
  process.exit(1);
});
