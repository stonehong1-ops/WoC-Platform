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
const mediaDir = 'C:\\Users\\stone\\.gemini\\antigravity\/\/brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\.user_uploaded\\';

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
  console.log('=== STARTING ABRAZO MILONGA UPDATE ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784715984466.jpg',
    'socials/B2aYZK9mZF6zUUpQEUw1/poster_20260722.jpg',
    'image/jpeg'
  );

  // 2. 소셜 업데이트
  console.log('Updating Abrazo Milonga...');
  const ref = db.collection('socials').doc('B2aYZK9mZF6zUUpQEUw1');
  const snap = await ref.get();
  let djs = snap.exists ? (snap.data().djs || []) : [];

  const djItem = {
    id: 'dj-isabel-20260722',
    date: '2026-07-22',
    djName: 'Isabel',
    djNativeName: '이사벨',
    djNameNative: '이사벨'
  };

  const dIdx = djs.findIndex(d => d.date === '2026-07-22');
  if (dIdx >= 0) djs[dIdx] = djItem;
  else djs.push(djItem);

  await ref.set({
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Isabel',
    djNameNative: '이사벨',
    djs: djs,
    price: '13,000 KRW (10시 이후 8,000원)',
    description: "눅눅한 수요일, 피스타에서 열리는 시원하고 뽀송한 아브라쏘 밀롱가 (Milonga Abrazo) 🌸\n\n• 일시: 매주 수요일 PM 7:30 ~ 11:30\n• 7/22 스페셜 DJ: 이사벨 (Isabel)\n• Org: 헨리 & 아르만\n• 혜택: 10시 이후 입장 시 입장료 8,000원 + 토요일 '더 피스타' 무료 입장권 1장 증정!\n• 장소: 홍대 피스타 (마포구 월드컵북로6길 49 B1)\n• 입장료: 13,000원 (10시 이후 8,000원)\n• 예약 및 문의: 010-5730-0727 (Henry)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== ABRAZO MILONGA UPDATE COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
