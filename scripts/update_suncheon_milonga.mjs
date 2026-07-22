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

async function run() {
  const localPath = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784542309914.png";
  const destPath = "socials/LS9d6ZtN74USXvP8PwZW/poster.png";

  console.log(`Uploading ${localPath} to ${destPath}...`);
  const fileRef = bucket.file(destPath);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType: "image/png" }
  });
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/${destPath}`;
  console.log(`Uploaded. URL: ${url}`);

  const docRef = db.collection('socials').doc('LS9d6ZtN74USXvP8PwZW');
  const now = admin.firestore.FieldValue.serverTimestamp();

  await docRef.update({
    imageUrl: url,
    posterExportUrl: url,
    price: "140,000 KRW",
    description: "2026 Suncheon Big milonga ESTRELLAS 공지 올립니다.\n\n빌딩 숲을 벗어나, 진짜 별이 쏟아지는 그곳으로.\n가을 밤하늘의 별(Estrellas)을 닮은 그대들을 초대합니다.\n오직 파트너의 심장 소리와 흐르는 음악에만 몰입하는 1박 2일.\n\n• 1차 예매 할인 기한: 7월 31일\n• 혜택 요금: 140,000 KRW (정상가 16만원)\n  - 낮밀 + 밤빅밀 + 모닝밀 + 숙박(1인) + 식사(저녁/아침) + 새벽이벤트 모두 포함\n• 입금 계좌: 농협 351-1359-6630-43 나미애\n• 장소: 순천청소년수련원",
    organizerName: "나미애",
    updatedAt: now
  });

  console.log("Successfully updated Suncheon Milonga!");
}

run().catch(console.error);
