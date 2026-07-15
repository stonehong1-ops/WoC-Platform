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

async function run() {
  const targetDocId = 'FlfaKe3IE2P5Ldx5Gr8O';
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783451451059.jpg';
  const destPath = `socials/${targetDocId}/poster.jpg`;

  console.log('1. Uploading poster image to storage...');
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: { contentType: 'image/jpeg' }
  });

  const file = bucket.file(destPath);
  await file.makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded image URL:', imageUrl);

  // djs 배열 설정
  const updatedDjs = [
    {
      djName: 'Star Shadow',
      date: '2026-06-25',
      djNativeName: '별그림자'
    },
    {
      id: 'dj-andante-20260709',
      date: '2026-07-09',
      djName: 'An Dante',
      djNameNative: '안단테'
    }
  ];

  console.log('2. Updating target document...');
  await db.collection('socials').doc(targetDocId).set({
    imageUrl: imageUrl,
    djName: 'An Dante',
    djNameNative: '안단테',
    djs: updatedDjs,
    description: '목요 까베세오\n\n• 일시: 2026년 7월 9일 (목) 19:30 ~ 23:30\n• DJ: 안단테 (An Dante)\n• 입장료: 13,000원\n• 장소: 안단테 (Tango Cafe Andante, 서울시 마포구 양화로 12길 24 선진빌딩 B1)\n• 특이사항: 10시 이후 입장시 무료 입장 쿠폰 증정',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
