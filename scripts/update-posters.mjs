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
  console.log('=== STARTING POSTER UPDATES ===');

  // 1. 도라다 밀롱가 포스터 업로드
  const doradaUrl = await uploadFile(
    'media__1784588581178.png',
    'socials/dorada_milonga_tuesday/poster_20260721.png',
    'image/png'
  );

  // 2. 더 피스타 밀롱가 포스터 업로드
  const pistaUrl = await uploadFile(
    'media__1784588596486.png',
    'socials/zkZm9gZvHdnSPzSOR5Gp/poster_20260725.png',
    'image/png'
  );

  // 3. 도라다 밀롱가 (dorada_milonga_tuesday) 갱신
  console.log('Updating Dorada Milonga...');
  await db.collection('socials').doc('dorada_milonga_tuesday').set({
    imageUrl: doradaUrl,
    posterExportUrl: doradaUrl,
    djName: 'Lucca',
    djNameNative: '루까',
    djs: [{
      id: 'dj-lucca-20260721',
      date: '2026-07-21',
      djName: 'Lucca',
      djNativeName: '루까',
      djNameNative: '루까'
    }],
    description: "매주 화요일 강남 탱고라이프에서 열리는 오후의 도라다 밀롱가 🥂\n\n• 일시: 매주 화요일 PM 3:00 ~ 5:00\n• 14:00 ~ 15:00 워크숍 (제니 & 곡산)\n• 15:00 ~ 17:00 밀롱가 (DJ: 루까)\n• 참가비: 워크숍+밀롱가 패키지 20,000원 / 밀롱가만 13,000원 (정액권 5개월 25만)\n• 예약 및 문의: 010-9772-4990\n• 장소: 강남 탱고라이프 (역삼로 109 SK허브젠 B1)\n• 입금계좌: 카카오뱅크 3333-18-8414917 김규호",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 4. 더 피스타 밀롱가 (zkZm9gZvHdnSPzSOR5Gp) 갱신
  console.log('Updating The Pista Milonga...');
  await db.collection('socials').doc('zkZm9gZvHdnSPzSOR5Gp').set({
    imageUrl: pistaUrl,
    posterExportUrl: pistaUrl,
    djName: 'Mint',
    djNameNative: '민트',
    djs: [
      { djNameNative: '에디', djName: 'Eddy', id: 'dj-eddy-20260704', date: '2026-07-04' },
      { djNameNative: '허그', djName: 'Hug', id: 'dj-hug-20260711', date: '2026-07-11' },
      { date: '2026-07-18', djName: 'Gianluca', id: 'dj-gianluca-20260718', djNameNative: '지안루카', djNativeName: '지안루카' },
      { date: '2026-07-25', djNameNative: '민트', djName: 'Mint', id: 'dj-mint-20260725', djNativeName: '민트' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== POSTER UPDATES COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
