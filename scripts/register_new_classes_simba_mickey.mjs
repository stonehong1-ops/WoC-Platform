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

  // --- 1. 탱고심바 에세나리오 안무반 29기 ---
  const simbaUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784545540722.png",
    "classes/simba-escenario-choreography-29/poster.png",
    "image/png"
  );
  
  const simbaClass = {
    id: "simba-escenario-choreography-29",
    type: "regular",
    title: "에세나리오 안무반 29기 (Chique 한곡완성반)",
    description: "탱고심바 에세나리오 안무반 29기\n8주동안 단독 안무 한곡 완성\n\n• 안무곡: Color Tango - Chique 한곡완성반\n• 특징: 탱고 경력 상관없이 수업 시간만 충실하시면 누구나 쉽게 적응 가능\n• 일정: 8/1(토) 개강 ~ 8주 과정 (매주 토요일 15:00 ~ 17:00 / 14:00 자율 쁘락)\n• 수강료: 8주 30만원 (7월 25일 이후 입금 시 33만원)\n• 수납 계좌: 신한은행 010-8997-9662 전영숙\n• 신청서: https://forms.gle/SGV7U5AJpdpcd8SK7",
    level: "Intermediate",
    imageUrl: simbaUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "",
    location: "홍대 홍턴 지하 1층 메인홀 (서울특별시 마포구 동교동 199-1, 지하 1층)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-08-01",
      endDate: "2026-09-19",
      dayOfWeek: 6,
      startTime: "15:00",
      endTime: "17:00"
    },
    sessions: [
      { id: "s1", date: "2026-08-01", startTime: "15:00", endTime: "17:00" },
      { id: "s2", date: "2026-08-08", startTime: "15:00", endTime: "17:00" },
      { id: "s3", date: "2026-08-15", startTime: "15:00", endTime: "17:00" },
      { id: "s4", date: "2026-08-22", startTime: "15:00", endTime: "17:00" },
      { id: "s5", date: "2026-08-29", startTime: "15:00", endTime: "17:00" },
      { id: "s6", date: "2026-09-05", startTime: "15:00", endTime: "17:00" },
      { id: "s7", date: "2026-09-12", startTime: "15:00", endTime: "17:00" },
      { id: "s8", date: "2026-09-19", startTime: "15:00", endTime: "17:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0,
      bundle: 300000
    },
    status: "Open",
    instructors: [
      { name: "심바", role: "Instructor" }
    ],
    amount: 300000,
    price: 300000,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };
  await registerClassAndConnect(simbaClass, null);


  // --- 2. Mickey's Tango Lesson (밀롱가 챌린지) ---
  const mickeyUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784545613726.png",
    "classes/mickey-milonga-challenge-202607/poster.png",
    "image/png"
  );

  const mickeyClass = {
    id: "mickey-milonga-challenge-202607",
    type: "regular",
    title: "밀롱가 챌린지 Level Up Project (밀롱가 4주특강)",
    description: "Mickey's Tango Lesson - 쉽고 빠르게, 핵심만 배우기!\n밀롱가에서 바로 사용할 수 있는 실전 기술과 디테일을 배우는 4주 집중 과정입니다.\n\n• 일정: 7/18(토) 개강 ~ 4주 과정 (매주 토요일 18:00 ~ 21:00 / 레슨 60분 + 쁘락 120분)\n• 수강료: 4주 등록 12만원 (1회 수강 시 35,000원)\n• 수납 계좌: 카카오뱅크 3333-07-4842500 ㅊㅎㅁ\n• 신청서: https://naver.me/5XcBZgcC",
    level: "Intermediate",
    imageUrl: mickeyUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "zM1i7XFth8H6KbODpb1O",
    location: "탱고빠시온 (서울특별시 마포구 연남동 567-11)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-07-18",
      endDate: "2026-08-08",
      dayOfWeek: 6,
      startTime: "18:00",
      endTime: "21:00"
    },
    sessions: [
      { id: "s1", date: "2026-07-18", startTime: "18:00", endTime: "21:00" },
      { id: "s2", date: "2026-07-25", startTime: "18:00", endTime: "21:00" },
      { id: "s3", date: "2026-08-01", startTime: "18:00", endTime: "21:00" },
      { id: "s4", date: "2026-08-08", startTime: "18:00", endTime: "21:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 35000,
      bundle: 120000
    },
    status: "Open",
    instructors: [
      { name: "Mickey", role: "Instructor" }
    ],
    amount: 120000,
    price: 120000,
    dailyClassPrice: 35000,
    createdBy: creatorUid
  };
  await registerClassAndConnect(mickeyClass, null);

  console.log("All registrations finished successfully.");
}

run().catch(console.error);
