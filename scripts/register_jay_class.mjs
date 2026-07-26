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
  const localImg = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/.user_uploaded/media__1784856617461.png";
  const destImg = "classes/jay-milonguero-style-202608/poster.png";

  const posterUrl = await uploadImage(localImg, destImg, "image/png");

  const classData = {
    id: "jay-milonguero-style-202608",
    type: "regular",
    title: "제이의 밀롱게로 스타일 8주 과정",
    description: "Jay's 밀롱게로 스타일 8주 과정\n\n• 일정: 8/6 ~ 9/24 매주 목요일 19:40 ~ 22:00\n  - 메인 클라스: 19:40 ~ 21:00 (80분)\n  - 애프터 실전 피구라: 21:00 ~ 22:00 (60분)\n• 목표: 드라마틱 기술이 아니라 '여유 있는 멋'을 만드는 것. 좁은 공간 밀롱가 적용 중심.\n• 수강료: 1회 수강 시 35,000원\n• 문의: 스톤 010-7209-2468",
    level: "Intermediate",
    imageUrl: posterUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "2mvxZZVNWzJ4MwDIAWq3",
    location: "Freestyle Tango (서울특별시 마포구 양화로3길 55)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-08-06",
      endDate: "2026-09-24",
      dayOfWeek: 4,
      startTime: "19:40",
      endTime: "22:00"
    },
    sessions: [
      { id: "s1", date: "2026-08-06", startTime: "19:40", endTime: "22:00" },
      { id: "s2", date: "2026-08-13", startTime: "19:40", endTime: "22:00" },
      { id: "s3", date: "2026-08-20", startTime: "19:40", endTime: "22:00" },
      { id: "s4", date: "2026-08-27", startTime: "19:40", endTime: "22:00" },
      { id: "s5", date: "2026-09-03", startTime: "19:40", endTime: "22:00" },
      { id: "s6", date: "2026-09-10", startTime: "19:40", endTime: "22:00" },
      { id: "s7", date: "2026-09-17", startTime: "19:40", endTime: "22:00" },
      { id: "s8", date: "2026-09-24", startTime: "19:40", endTime: "22:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 35000
    },
    status: "Open",
    instructors: [
      { name: "Jay", role: "Instructor" }
    ],
    amount: 35000,
    price: 35000,
    dailyClassPrice: 35000,
    createdBy: creatorUid
  };

  await registerClassAndConnect(classData, null);

  console.log("Jay class registration finished successfully.");
}

run().catch(console.error);
