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

async function run() {
  const creatorUid = "25mjwPlqr1Oxbd8blYRR20HJ6U32"; // 스톤님 UID

  // 1. 바질 & 엘린 이미지 정정 업로드 및 업데이트
  const localBasilImg = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/.user_uploaded/media__1784856617461.png";
  const destBasilImg = "classes/basil-elin-level-up-202608/poster_correct.png";
  const correctBasilUrl = await uploadImage(localBasilImg, destBasilImg, "image/png");

  await db.collection('classes').doc('basil-elin-level-up-202608').update({
    imageUrl: correctBasilUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log("Successfully corrected Basil & Elin image URL!");


  // 2. 메디홍 클래스 이미지 업로드 및 신규 등록
  const localMadihongImg = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/.user_uploaded/media__1784856653633.jpg";
  const destMadihongImg = "classes/madihong-milonga-style-202607/poster.jpg";
  const madihongUrl = await uploadImage(localMadihongImg, destMadihongImg, "image/jpeg");

  const madihongClass = {
    id: "madihong-milonga-style-202607",
    type: "regular",
    title: "밀롱가 스타일 탱고 심화 트레이닝 완성반",
    description: "메디홍의 밀롱가 스타일 탱고 심화 완성반\n실전 밀롱가에서 3단계 레벨업 보장!\n\n• 일정: 7/22(수) 개강 ~ 4주 과정 (매주 수요일 19:00 ~ 22:00)\n  - 1시간 강습 + 1시간 가이드 쁘락 + 1시간 실전 론다 (체인지 파트너, 연속 딴다)\n• 수강료: 4주(12시간) 9만원\n• 장소: 홍대 폴레폴레 (서울특별시 마포구 동교로25길 49, 지하 1층)\n• 신청 링크: https://forms.gle/saPeHw7F3NnFXiHA9\n• 현황: 라분 마감, 로분 2명 신청 가능",
    level: "Intermediate",
    imageUrl: madihongUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "", // 폴레폴레 미등록
    location: "홍대 폴레폴레 (서울특별시 마포구 동교로25길 49, 지하 1층)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-07-22",
      endDate: "2026-08-12",
      dayOfWeek: 3,
      startTime: "19:00",
      endTime: "22:00"
    },
    sessions: [
      { id: "s1", date: "2026-07-22", startTime: "19:00", endTime: "22:00" },
      { id: "s2", date: "2026-07-29", startTime: "19:00", endTime: "22:00" },
      { id: "s3", date: "2026-08-05", startTime: "19:00", endTime: "22:00" },
      { id: "s4", date: "2026-08-12", startTime: "19:00", endTime: "22:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0,
      bundle: 90000
    },
    status: "Open",
    instructors: [
      { name: "메디홍", role: "Instructor" }
    ],
    amount: 90000,
    price: 90000,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };

  await db.collection('classes').doc(madihongClass.id).set({
    ...madihongClass,
    connectedGroupIds: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log("Successfully registered Madihong class!");
}

run().catch(console.error);
