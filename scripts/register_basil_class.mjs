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
  const localImg = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/.user_uploaded/media__1784856653633.jpg";
  const destImg = "classes/basil-elin-level-up-202608/poster.jpg";

  const posterUrl = await uploadImage(localImg, destImg, "image/jpeg");

  const classData = {
    id: "basil-elin-level-up-202608",
    type: "regular",
    title: "바질 & 엘린의 탱고 레벨업",
    description: "바질 & 엘린의 목요일 탱고레벨업\n\n• 매차수마다 디테일을 추가해 현재 본인의 레벨에서 한단계 레벨업 할 수 있도록 기초부터 고급까지 모두 수강할 수 있는 수업입니다.\n• 몸 쓰는 테크닉, 동작의 원리를 설명하여 응용해서 춤출 수 있게 지도합니다.\n• 일정: 8/6 ~ 10/1 매주 목요일 20:00 ~ 22:00 (80분 수업 + 40분 1:1 개별코칭 쁘락티카)\n• 신청 링크: https://docs.google.com/forms/d/e/1FAIpQLSelZXGbsoaW_1TgOXG4PWBes6hnVz-K7Qpg9sh-dBYy1uDJ0w/viewform?usp=preview\n• 문의: 엘린 010-8917-8552",
    level: "Intermediate",
    imageUrl: posterUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "HH0qw7ZEpGqoufVnqTZo",
    location: "Club Troilo (서울특별시 마포구 연남로 9 지하 1층)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-08-06",
      endDate: "2026-10-01",
      dayOfWeek: 4,
      startTime: "20:00",
      endTime: "22:00"
    },
    sessions: [
      { id: "s1", date: "2026-08-06", startTime: "20:00", endTime: "22:00" },
      { id: "s2", date: "2026-08-13", startTime: "20:00", endTime: "22:00" },
      { id: "s3", date: "2026-08-20", startTime: "20:00", endTime: "22:00" },
      { id: "s4", date: "2026-08-27", startTime: "20:00", endTime: "22:00" },
      { id: "s5", date: "2026-09-03", startTime: "20:00", endTime: "22:00" },
      { id: "s6", date: "2026-09-10", startTime: "20:00", endTime: "22:00" },
      { id: "s7", date: "2026-09-17", startTime: "20:00", endTime: "22:00" },
      { id: "s8", date: "2026-09-24", startTime: "20:00", endTime: "22:00" },
      { id: "s9", date: "2026-10-01", startTime: "20:00", endTime: "22:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0
    },
    status: "Open",
    instructors: [
      { name: "바질", role: "Instructor" },
      { name: "엘린", role: "Instructor" }
    ],
    amount: 0,
    price: 0,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };

  await registerClassAndConnect(classData, null);

  console.log("Basil & Elin registration finished successfully.");
}

run().catch(console.error);
