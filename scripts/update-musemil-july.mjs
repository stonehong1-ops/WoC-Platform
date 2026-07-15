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
  const docId = 'v0zd2tN2sQpDRW0lSwAi';
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783459304893.jpg';

  console.log('1. Uploading Musemil poster to storage...');
  const destPath = `socials/${docId}/poster.jpg`;
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: { contentType: 'image/jpeg' }
  });
  await bucket.file(destPath).makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded Image URL:', imageUrl);

  console.log('2. Updating Firestore document...');
  const djs = [
    { id: 'dj-mare-20260724', date: '2026-07-24', djName: 'Mare', djNameNative: '마르' }
  ];

  await db.collection('socials').doc(docId).set({
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Mare',
    djNameNative: '마르',
    djs: djs,
    description: 'MUSEMIL Special Oneday 4th Friday\n매월 4째주 금요일 in PISTA\n7월 24일 (금) pm8:00~am12:00\nDJ 마르\n입장료 13,000원\n\n한달한번 매달 4째 금요일 피스타에서 뮤즈밀이요 💛',
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('[SUCCESS] Musemil 4th Friday updated successfully!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
