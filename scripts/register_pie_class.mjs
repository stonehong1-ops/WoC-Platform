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

  const classData = {
    id: "pie-tango-lesson-202608",
    type: "regular",
    title: "파이 탱고레슨 (8월, 목요일)",
    description: "8월 파이 탱고레슨 회원 모집\n밀롱가에서 즐길 수 있도록 탱고, 밀롱가, 발스를 집중적으로 지도합니다.\n\n• 일정: 8/6(목) ~ 8/27(목) 매주 목요일 19:20 ~ 22:40 (4주)\n  - 19:00 ~ 19:20: 자율연습\n  - 19:20 ~ 19:50: 스트레칭 & 베이직\n  - 20:00 ~ 20:50: 탱고\n  - 21:00 ~ 22:00: 밀롱가 & 발스 심화\n  - 22:10 ~ 22:40: 실전 연습\n• 혜택: 피스타 토요일 밀롱가 입장권 2장 제공\n• 수강료: 4주 13만원\n• 문의: 파이 010-6722-3650",
    level: "Intermediate",
    imageUrl: "", // 포스터 이미지 없음
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "xVJsZb5y34WjlqP5iHDr",
    location: "피스타 (Pista)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-08-06",
      endDate: "2026-08-27",
      dayOfWeek: 4,
      startTime: "19:20",
      endTime: "22:40"
    },
    sessions: [
      { id: "s1", date: "2026-08-06", startTime: "19:20", endTime: "22:40" },
      { id: "s2", date: "2026-08-13", startTime: "19:20", endTime: "22:40" },
      { id: "s3", date: "2026-08-20", startTime: "19:20", endTime: "22:40" },
      { id: "s4", date: "2026-08-27", startTime: "19:20", endTime: "22:40" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0,
      bundle: 130000
    },
    status: "Open",
    instructors: [
      { name: "파이", role: "Instructor" }
    ],
    amount: 130000,
    price: 130000,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };

  await registerClassAndConnect(classData, null);

  console.log("Pie class registration finished successfully.");
}

run().catch(console.error);
