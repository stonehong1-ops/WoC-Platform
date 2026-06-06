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

async function findCoachAndStudents() {
  console.log('🔍 1. Stone Hong (01072092468) 사용자 정보 탐색 중...');
  const usersRef = db.collection('users');
  
  const allUsersSnap = await usersRef.get();
  let coachDoc = null;
  
  allUsersSnap.docs.forEach(doc => {
    const data = doc.data();
    const phoneNormalized = (data.phoneNumber || '').replace(/[^0-9]/g, '');
    const phoneNormalized2 = (data.phone || '').replace(/[^0-9]/g, '');
    const nickname = (data.nickname || '').toLowerCase();
    const nativeNickname = (data.nativeNickname || '').toLowerCase();
    
    if (phoneNormalized.includes('01072092468') || phoneNormalized.includes('821072092468') ||
        phoneNormalized2.includes('01072092468') || phoneNormalized2.includes('821072092468') ||
        nickname.includes('stone hong') || nativeNickname.includes('홍석범') || nickname === 'stone') {
      coachDoc = { id: doc.id, ...data };
    }
  });

  if (coachDoc) {
    console.log(`✅ 코치 찾기 성공: ID [${coachDoc.id}] | Nickname [${coachDoc.nickname}] | Phone [${coachDoc.phoneNumber || coachDoc.phone || 'N/A'}] | isInstructor [${coachDoc.isInstructor}]`);
  } else {
    console.log('❌ Stone Hong 사용자를 찾지 못했습니다.');
  }

  console.log('\n🔍 2. 6월 프리스타일탱고 수업 리스트 파악 중...');
  const classesRef = db.collection('groups').doc(GROUP_ID).collection('classes');
  const classesSnap = await classesRef.get();
  
  const discountsRef = db.collection('groups').doc(GROUP_ID).collection('discounts');
  const discountsSnap = await discountsRef.get();

  const juneClassIds = new Set();
  const classTitles = {};

  classesSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.targetMonth === CURRENT_MONTH || data.schedule?.some(s => s.date?.startsWith(CURRENT_MONTH))) {
      juneClassIds.add(doc.id);
      classTitles[doc.id] = data.title;
    }
  });

  discountsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.targetMonth === CURRENT_MONTH) {
      juneClassIds.add(doc.id);
      classTitles[doc.id] = data.title;
    }
  });

  console.log(`6월 클래스/할인 패키지 개수: ${juneClassIds.size}개`);
  for (const cid of juneClassIds) {
    console.log(`  - Class ID: ${cid} (${classTitles[cid] || '할인 패키지'})`);
  }

  console.log('\n🔍 3.bookings 및 class_registrations 수강 신청 내역 분석 중...');
  
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
      activeStudents.set(data.buyerId, {
        id: data.buyerId,
        name: data.buyerName || 'Unknown User',
        classTitle: data.itemName || classTitles[classId] || '6월 클래스',
        source: 'bookings'
      });
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
      activeStudents.set(data.userId, {
        id: data.userId,
        name: data.applicantName || 'Unknown User',
        classTitle: data.classTitle || '6월 클래스',
        source: 'class_registrations'
      });
    }
  });

  console.log(`✅ 6월 수강생 총 ${activeStudents.size}명 발견:`);
  activeStudents.forEach((student, uid) => {
    console.log(`  - 학생 ID: [${uid}] | Name: [${student.name}] | 신청 클래스: [${student.classTitle}] (수집 경로: ${student.source})`);
  });

  process.exit(0);
}

findCoachAndStudents().catch(err => {
  console.error(err);
  process.exit(1);
});
