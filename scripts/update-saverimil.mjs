import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const mediaDir = 'C:\\Users\\stone\\.gemini\\antigravity\/\/brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\';

async function uploadFile(localName, destPath, contentType) {
  const localPath = mediaDir + localName;
  console.log(`Uploading ${localName} to ${destPath}...`);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType }
  });
  await bucket.file(destPath).makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
}

async function run() {
  console.log('=== STARTING SAVERIMIL UPDATE ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784545209712.jpg',
    'socials/popup_enpaz_saverimil_20260725/poster.jpg',
    'image/jpeg'
  );

  // 2. 소셜 업데이트
  await db.collection('socials').doc('popup_enpaz_saverimil_20260725').set({
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    price: '13,000 KRW (텀블러 지참 시 12,000원)',
    djs: [{
      id: 'dj-isabel-20260725',
      date: '2026-07-25',
      djName: 'Isabel',
      djNativeName: '이사벨',
      djNameNative: '이사벨'
    }],
    description: "7월 25일 토요일 저녁 엔빠스에서 열리는 사베리밀 (SABELL.E) 🎵\n\n우리가 좋아하는 곡들만 쏙쏙 골라 담은 감동의 딴다를 선사합니다.\n\n• 일시: 7월 25일 (토) PM 7:00 ~ 11:00 (7시 정시 시작)\n• DJ: 이사벨 (Isabel)\n• Org: 이사벨 (Isabel)\n• 특전: 시원한 아이스와인 & 제철 과일 제공 / 오작교 합석 (1인석 예약 환영)\n• 환경 캠페인: 텀블러 지참 시 1,000원 할인 (할인가 12,000원)\n• 예약 및 문의: 이사벨 (010-8850-6520)\n• 장소: 엔빠스 스튜디오 (교대역 B1)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== SAVERIMIL UPDATE COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
