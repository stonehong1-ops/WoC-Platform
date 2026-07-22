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
  console.log('=== STARTING LA NOCHE MILONGA UPDATE ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784715928795.jpg',
    'socials/lanoche_milonga_thursday/poster_20260723.jpg',
    'image/jpeg'
  );

  // 2. 소셜 업데이트
  console.log('Updating La Noche Milonga...');
  const ref = db.collection('socials').doc('lanoche_milonga_thursday');
  const snap = await ref.get();
  let djs = snap.exists ? (snap.data().djs || []) : [];

  const djItem = {
    id: 'dj-andante-20260723',
    date: '2026-07-23',
    djName: 'Andante',
    djNativeName: '안단테',
    djNameNative: '안단테'
  };

  const dIdx = djs.findIndex(d => d.date === '2026-07-23');
  if (dIdx >= 0) djs[dIdx] = djItem;
  else djs.push(djItem);

  await ref.set({
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Andante',
    djNameNative: '안단테',
    djs: djs,
    description: "목요일 밤, 오나다에서 펼쳐지는 스물아홉 번째 라노체 밀롱가 (La Noche Milonga) 🌛✨\n\n라노체는 감각과 감정을 함께 공유할 수 있는 사람들이 모이는 따뜻한 자리를 지향합니다.\n\n• 일시: 7월 23일 (목) PM 8:00 ~ 12:00\n• DJ: 안단테 (Andante)\n• Org: 현우 (reytango)\n• 무료 오픈 특강: PM 7:30 ~ 8:00 (주제: 오쵸와 오치또의 다이나믹 체인지)\n• 스페셜 메뉴: 딸기에이드, 레모네이드, 와인 완비\n• 장소: 오나다 (Tango O nada)\n• 입장료: 13,000원\n• 테이블 예약 및 문의: 현우 (010-7191-5163)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== LA NOCHE MILONGA UPDATE COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
