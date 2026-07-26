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
  console.log('=== STARTING CAMELIA MILONGA UPDATE ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784851836536.png',
    'socials/n4MioMSdxqnA3CVfX53N/poster_20260722.png',
    'image/png'
  );

  // 2. 소셜 업데이트
  console.log('Updating Camelia Milonga...');
  const ref = db.collection('socials').doc('n4MioMSdxqnA3CVfX53N');
  const snap = await ref.get();
  let djs = snap.exists ? (snap.data().djs || []) : [];

  const djItem = {
    id: 'dj-hjun-20260722',
    date: '2026-07-22',
    djName: 'H. Jun',
    djNativeName: '김형준',
    djNameNative: '김형준'
  };

  const dIdx = djs.findIndex(d => d.date === '2026-07-22');
  if (dIdx >= 0) djs[dIdx] = djItem;
  else djs.push(djItem);

  await ref.set({
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'H. Jun',
    djNameNative: '김형준',
    djs: djs,
    description: "매주 수요일, 엔빠스에서 활기차게 열리는 수까멜 밀롱가 (Camelia) 🌺\n\n• 일시: 매주 수요일 PM 7:30 ~ 11:30\n• 7/22 DJ: H. Jun (김형준)\n• Org: 까를로스 (Carlos)\n• 스페셜 메뉴: 이번 주는 장마철을 맞아 시원한 맥주 🍺 와 감자칩 🥔 을 준비했습니다!\n• 장소: 교대 엔빠스 스튜디오 (반포대로30길 82 B1)\n• 테이블 예약: 카카오톡 id - tanguerocarlos",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== CAMELIA MILONGA UPDATE COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
