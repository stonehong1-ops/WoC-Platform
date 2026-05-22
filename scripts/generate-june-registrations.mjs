// 6월 정규 클래스에 대한 10명 규모의 실시간 테스트 신청 데이터를 생성하는 마이그레이션 스크립트
import admin from 'firebase-admin';
import fs from 'fs';

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

// 6월 정규 클래스 상수 정의
const CLASS_1_ID = 'b33ca2ce-df0b-4996-af58-06292e5566a2';
const CLASS_1_TITLE = '4대 악단 뮤지컬리티';

const CLASS_2_ID = '70abe9f2-6a45-4739-97c2-3f75e718b046';
const CLASS_2_TITLE = '뮤즈와 함께하는 트레이닝';

const GROUP_ID = 'freestyle-tango';

// 가상 신청자 리스트 정보 (실제 회원 데이터 연동)
const mockApplicants = [
  {
    userId: '0LMNoZ8sscPW2xApFam4q1qLTdt1',
    applicantName: '봄날 (Bom)',
    contactNumber: '+821063957781',
    userAvatar: '',
    classId: CLASS_1_ID,
    classTitle: CLASS_1_TITLE,
    selectedClassIds: [CLASS_1_ID],
    amount: 120000,
    role: 'Leader',
    status: 'PAYMENT_PENDING',
    applicantMemo: '첫 수업 기대됩니다! 계좌이체로 보낼게요.',
    adminMemo: '신규 특별 회원권 적용 대상자'
  },
  {
    userId: '0imotVqQnuSS8aahPrxNQ334wAq2',
    applicantName: '리스 (lees)',
    contactNumber: '+821028095088',
    userAvatar: '',
    classId: CLASS_1_ID,
    classTitle: CLASS_1_TITLE,
    selectedClassIds: [CLASS_1_ID, CLASS_2_ID], // 복수 신청
    amount: 240000,
    role: 'Leader',
    status: 'PAYMENT_COMPLETED',
    applicantMemo: '6월 패키지로 2개 클래스 한꺼번에 신청합니다.',
    adminMemo: '골드 등급 멤버쉽 회원'
  },
  {
    userId: '0zp9p1YmFvescAIHpEM2xnh9uAr1',
    applicantName: '지수[이사벨]',
    contactNumber: '',
    userAvatar: 'https://lh3.googleusercontent.com/a/ACg8ocJUWXgW1sVVf0WeE5sqLlid3Q0rVFto7cx5XWWyArPzXf2hKcw=s96-c',
    classId: CLASS_1_ID,
    classTitle: CLASS_1_TITLE,
    selectedClassIds: [CLASS_1_ID],
    amount: 120000,
    role: 'Follower',
    status: 'PAYMENT_REPORTED',
    applicantMemo: '이름 홍길동으로 12만원 입금 보고 드립니다!',
    adminMemo: '밀롱가 스태프 할인 적용'
  },
  {
    userId: '1Fgt3orngsU68rzkVqNHg0LR4au1',
    applicantName: '캐서린 (Catherine)',
    contactNumber: '+821085951431',
    userAvatar: '',
    classId: CLASS_1_ID,
    classTitle: CLASS_1_TITLE,
    selectedClassIds: [CLASS_1_ID, CLASS_2_ID], // 복수 신청
    amount: 240000,
    role: 'Follower',
    status: 'PAYMENT_COMPLETED',
    applicantMemo: '열심히 배우겠습니다! 입금 완료.',
    adminMemo: '실버 등급 멤버쉽 회원'
  },
  {
    userId: '1gyW5ssbPFT8QDnqKHxemuC3i4h1',
    applicantName: '온도 (Ondo)',
    contactNumber: '',
    userAvatar: 'https://lh3.googleusercontent.com/a/ACg8ocInzfVROUMy8adLUsEKK7IKubELmE_XwP9HoQqQu5fT2RVJVljl=s96-c',
    classId: CLASS_2_ID,
    classTitle: CLASS_2_TITLE,
    selectedClassIds: [CLASS_2_ID],
    amount: 120000,
    role: 'Leader',
    status: 'PAYMENT_PENDING',
    applicantMemo: '일요일 오전에 입금 예정입니다.',
    adminMemo: ''
  },
  {
    userId: '2PQTerzDpiWMONaDBpULArTP7MC3',
    applicantName: '이랑 (Irang)',
    contactNumber: '+821052375477',
    userAvatar: '',
    classId: CLASS_2_ID,
    classTitle: CLASS_2_TITLE,
    selectedClassIds: [CLASS_2_ID],
    amount: 120000,
    role: 'Follower',
    status: 'PAYMENT_PENDING',
    applicantMemo: '월급날 입금할게요.',
    adminMemo: ''
  },
  {
    userId: '39eSLXweEFTBZvrQTu9B1Ydc6iy1',
    applicantName: '반야 (BANYA)',
    contactNumber: '',
    userAvatar: 'https://lh3.googleusercontent.com/a/ACg8ocJCgr9VUm3MZEuSboQ4gVxS6FkG0wPMJLb9xlAWWic2L-AmBg=s96-c',
    classId: CLASS_1_ID,
    classTitle: CLASS_1_TITLE,
    selectedClassIds: [CLASS_1_ID],
    amount: 120000,
    role: 'Follower',
    status: 'PAYMENT_COMPLETED',
    applicantMemo: '반야로 입금 완료했습니다.',
    adminMemo: '정회원 회원권 소지'
  },
  {
    userId: '1DHlWkQccwPix3o1aS5fCCDdWYp2',
    applicantName: '잭 (Jack)',
    contactNumber: '+821055505790',
    userAvatar: '',
    classId: CLASS_1_ID,
    classTitle: CLASS_1_TITLE,
    selectedClassIds: [CLASS_1_ID],
    amount: 120000,
    role: 'Leader',
    status: 'PAYMENT_REPORTED',
    applicantMemo: '토스뱅크 잭 이름으로 입금했습니다!',
    adminMemo: ''
  },
  {
    userId: '0SSkAHU6d7XhSnGns4RjImFXlTA3',
    applicantName: 'Tango Honey (Mickey Choi)',
    contactNumber: '+821053317091',
    userAvatar: '',
    classId: CLASS_2_ID,
    classTitle: CLASS_2_TITLE,
    selectedClassIds: [CLASS_2_ID],
    amount: 120000,
    role: 'Leader',
    status: 'PAYMENT_COMPLETED',
    applicantMemo: '미키 최로 12만원 입금 완료.',
    adminMemo: '우수 동호회 협력 할인'
  },
  {
    userId: '3wDVKwM1ShVtYPjcOUEbKIV60Cx2',
    applicantName: 'GD (Grace)',
    contactNumber: '',
    userAvatar: 'https://lh3.googleusercontent.com/a/ACg8ocJPHaNwajK9_P-km6qFa8HAvKHS3ulf-UjklTL0Xx07nmdFai0v=s96-c',
    classId: CLASS_2_ID,
    classTitle: CLASS_2_TITLE,
    selectedClassIds: [CLASS_2_ID],
    amount: 120000,
    role: 'Follower',
    status: 'PAYMENT_REPORTED',
    applicantMemo: '그레이스 송금했습니다. 확인해 주세요.',
    adminMemo: ''
  }
];

async function generateJuneRegistrations() {
  console.log('--------------------------------------------------');
  console.log('Starting June Class Registrations Mock Data Generation...');
  console.log(`Target Group ID: ${GROUP_ID}`);
  console.log('--------------------------------------------------');

  const registrationsRef = db.collection('class_registrations');

  // 1. 기존에 등록되어 있는 6월 테스트 신청 데이터 청소 (중복 적재 방지)
  console.log('Cleaning up existing June mock registrations...');
  const existingSnapshot = await registrationsRef
    .where('groupId', '==', GROUP_ID)
    .get();

  let cleanupCount = 0;
  for (const doc of existingSnapshot.docs) {
    const data = doc.data();
    // 6월 클래스 ID에 해당하는 신청서만 삭제
    if (data.classId === CLASS_1_ID || data.classId === CLASS_2_ID) {
      await registrationsRef.doc(doc.id).delete();
      cleanupCount++;
    }
  }
  console.log(`Cleaned up ${cleanupCount} old June class registrations.`);

  // 2. 가상 신청 데이터 일괄 주입
  let insertCount = 0;
  for (const app of mockApplicants) {
    const docRef = registrationsRef.doc(); // 랜덤 ID 문서 생성
    const registrationDoc = {
      id: docRef.id,
      userId: app.userId,
      applicantName: app.applicantName,
      contactNumber: app.contactNumber,
      userAvatar: app.userAvatar,
      groupId: GROUP_ID,
      classId: app.classId,
      classTitle: app.classTitle,
      selectedClassIds: app.selectedClassIds,
      amount: app.amount,
      currency: 'KRW',
      role: app.role,
      status: app.status,
      depositorName: app.applicantName.split(' ')[0], // 첫 단어를 입금자명 기본값으로 설정
      applicantMemo: app.applicantMemo,
      adminMemo: app.adminMemo,
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(registrationDoc);
    console.log(`[INSERT] Success - ID: ${docRef.id} | Applicant: ${app.applicantName} | Class: ${app.classTitle} | Role: ${app.role} | Status: ${app.status}`);
    insertCount++;
  }

  console.log('--------------------------------------------------');
  console.log('June Class Registrations Generation Completed Successfully.');
  console.log(`Summary:`);
  console.log(`  - Cleaned up old entries: ${cleanupCount}`);
  console.log(`  - Inserted new entries: ${insertCount}`);
  console.log('--------------------------------------------------');
  process.exit(0);
}

generateJuneRegistrations().catch(err => {
  console.error('Fatal data generation error:', err);
  process.exit(1);
});
