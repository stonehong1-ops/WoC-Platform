import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function uploadImage(localPath, destPath, contentType) {
  console.log(`Uploading ${localPath} to ${destPath}...`);
  const fileRef = bucket.file(destPath);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType }
  });
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/${destPath}`;
  console.log(`Uploaded. URL: ${url}`);
  return url;
}

async function registerClassAndConnect(classData, targetGroupId) {
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Class 문서 생성
  const classRef = db.collection('classes').doc(classData.id);
  const finalClassData = {
    ...classData,
    connectedGroupIds: targetGroupId ? [targetGroupId] : [],
    createdAt: now,
    updatedAt: now
  };
  batch.set(classRef, finalClassData);

  // 2. Group Connection 생성 (필요 시)
  if (targetGroupId) {
    const connectionId = `${classData.id}_${targetGroupId}`;
    const connRef = db.collection('classGroupConnections').doc(connectionId);
    batch.set(connRef, {
      id: connectionId,
      classId: classData.id,
      groupId: targetGroupId,
      status: 'SELLER_CONFIRMED',
      requestedBy: classData.createdBy,
      approvedBy: classData.createdBy,
      createdAt: now,
      updatedAt: now
    });
  }

  await batch.commit();
  console.log(`Successfully registered and connected class: ${classData.id}`);
}

async function run() {
  const creatorUid = "25mjwPlqr1Oxbd8blYRR20HJ6U32"; // 스톤님 UID

  // --- 1. 화요일밤 미선쌤의 아르헨티나탱고 ---
  const misunUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784545258593.jpg",
    "classes/misun-tuesday-tango-202607/poster.jpg",
    "image/jpeg"
  );
  
  const misunClass = {
    id: "misun-tuesday-tango-202607",
    type: "regular",
    title: "미선 선생님의 화요일 탱고 강습 (Tuesday Tango)",
    description: "화요일, 탱고의 매력에 빠져보세요!\n\n• 1교시 (19:30): 땅게라 & 땅게로 클래스 (시퀀스와 함께 남녀 테크닉 배우는 시간)\n• 2교시 (20:30): 밀롱가 특강 (2/4 박자의 밀롱가)\n\n• 수강료:\n  - 각 4주: 100,000원\n  - 동시 수강 4주: 150,000원\n  - 동시 수강 8주: 299,000원\n• 문의: 010-2727-1501",
    level: "Intermediate",
    imageUrl: misunUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "3XagPuu2bmBorzqMPNk3",
    location: "Silhouette (실루엣 - 경기도 성남시 분당구 정자동 23-1 지파크프라자 5층)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-07-21",
      endDate: "2026-08-11",
      dayOfWeek: 2,
      startTime: "19:30",
      endTime: "21:30"
    },
    sessions: [
      { id: "s1", date: "2026-07-21", startTime: "19:30", endTime: "21:30" },
      { id: "s2", date: "2026-07-28", startTime: "19:30", endTime: "21:30" },
      { id: "s3", date: "2026-08-04", startTime: "19:30", endTime: "21:30" },
      { id: "s4", date: "2026-08-11", startTime: "19:30", endTime: "21:30" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0,
      bundle: 100000
    },
    status: "Open",
    instructors: [
      { name: "미선", role: "Instructor" }
    ],
    amount: 100000,
    price: 100000,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };
  await registerClassAndConnect(misunClass, null);


  // --- 2. 30초 안무 & 뮤지컬리티 특강 ---
  const guwooUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784545276396.png",
    "classes/guwoo-epitone-musicality-202607/poster.png",
    "image/png"
  );

  const guwooClass = {
    id: "guwoo-epitone-musicality-202607",
    type: "regular",
    title: "30초 안무 & 뮤지컬리티 특강",
    description: "구우 & 에피톤의 30초 안무를 통한 뮤지컬리티 수업\n각 악단의 대표곡을 통해서 음악에 맞춘 안무를 익히고 그 안무를 통해 뮤지컬리티를 업그레이드 하는 시간!\n\n• 일정별 악단 주차 계획:\n  - 7/30: Carlos Di Sarli\n  - 8/6: Francisco Canaro\n  - 8/13: Miguel Caló (Vals)\n  - 8/20: Juan D'Arienzo\n  - 8/27: Osvaldo Pugliese\n• 특징: 일일 수강 가능\n• 신청 링크: https://forms.gle/RT2n2AaZaMZXyxxdA\n• 기타 신청 내역: https://linktr.ee/egtango",
    level: "Intermediate",
    imageUrl: guwooUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    location: "Ocho (오초 - 서울특별시 마포구 월드컵북로2길 57)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-07-30",
      endDate: "2026-08-27",
      dayOfWeek: 4,
      startTime: "20:00",
      endTime: "22:00"
    },
    sessions: [
      { id: "s1", date: "2026-07-30", startTime: "20:00", endTime: "22:00" },
      { id: "s2", date: "2026-08-06", startTime: "20:00", endTime: "22:00" },
      { id: "s3", date: "2026-08-13", startTime: "20:00", endTime: "22:00" },
      { id: "s4", date: "2026-08-20", startTime: "20:00", endTime: "22:00" },
      { id: "s5", date: "2026-08-27", startTime: "20:00", endTime: "22:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0
    },
    status: "Open",
    instructors: [
      { name: "구우", role: "Instructor" },
      { name: "에피톤", role: "Instructor" }
    ],
    amount: 0,
    price: 0,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };
  await registerClassAndConnect(guwooClass, null);


  // --- 3. 마스터클래스 특강 (훌리안 & 나탈리아) ---
  const julianUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784545339409.jpg",
    "classes/tangolife-julian-masterclass-202607/poster.jpg",
    "image/jpeg"
  );

  const julianClass = {
    id: "tangolife-julian-masterclass-202607",
    type: "special",
    title: "마스터클래스 특강 (훌리안 & 나탈리아)",
    description: "탱고 마에스트로 훌리안 & 나탈리아와 함께하는 마스터클래스 특강\n\n• 일정 (7/25 토요일):\n  - 15:00 ~ 16:00: 탱고 테크닉\n  - 16:10 ~ 17:10: 발스 테크닉\n  - 17:20 ~ 18:20: 밀롱가 테크닉\n  - 18:30 ~ 19:00: 자율 쁘락띠까\n\n• 수강료:\n  - 수업 1개: 30,000원\n  - 수업 2개: 50,000원\n  - 수업 3개: 75,000원\n  - 수업 3개 + 밀롱가 패키지: 80,000원\n• 수납 계좌: 카카오뱅크 3333-18-8414917 김규호\n• 예약: 010-9772-4990",
    level: "Masterclass",
    imageUrl: julianUrl,
    instructorIds: [],
    organizerType: "group",
    organizerId: "tangolife",
    venueId: "Z8XjPNw7il0B9zilFPGx",
    location: "TangoLife (서울특별시 강남구 역삼로 109, B1F)",
    schedule: {
      recurrenceType: "none",
      startDate: "2026-07-25",
      endDate: "2026-07-25"
    },
    sessions: [
      { id: "s1", date: "2026-07-25", startTime: "15:00", endTime: "18:30" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 30000,
      bundle: 75000
    },
    status: "Open",
    instructors: [
      { name: "Julian", role: "Instructor" },
      { name: "Natalia", role: "Instructor" }
    ],
    amount: 75000,
    price: 75000,
    dailyClassPrice: 30000,
    createdBy: creatorUid
  };
  await registerClassAndConnect(julianClass, "tangolife");

  console.log("All registrations finished successfully.");
}

run().catch(console.error);
