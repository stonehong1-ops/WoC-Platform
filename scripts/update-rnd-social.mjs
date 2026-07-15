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
  const targetDocId = '1EYcXa9cMjC5yKcgroBr';
  const duplicateDocId = 'q7hxKlIKeBJQ2uaXHphy';
  
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783450978061.png';
  const destPath = `socials/${targetDocId}/poster.png`;

  console.log('1. Uploading poster image to storage...');
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: { contentType: 'image/png' }
  });

  const file = bucket.file(destPath);
  await file.makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded image URL:', imageUrl);

  // djs 배열 설정
  const updatedDjs = [
    {
      id: 'dj-rob-roy-20260712',
      date: '2026-07-12',
      djName: 'Rob Roy',
      djNameNative: '롭 로이'
    },
    {
      id: 'dj-tba-20260726',
      date: '2026-07-26',
      djName: 'TBA',
      djNameNative: '미정'
    }
  ];

  console.log('2. Updating target document...');
  await db.collection('socials').doc(targetDocId).set({
    imageUrl: imageUrl,
    djName: 'Rob Roy',
    djNameNative: '롭 로이',
    organizerId: 'manual_1781000264205',
    organizerIds: [
      'manual_1781000264205', // Rosso
      'M3O94zN34qOS2xUnTfkZ2ZKT51h2' // Deoks
    ],
    organizerNames: ['Rosso', 'Deoks'],
    organizerNativeNames: ['로소', '덕스'],
    organizerName: 'Rosso & Deoks',
    organizerNameNative: '로소 & 덕스',
    djs: updatedDjs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('3. Deleting duplicate document...');
  await db.collection('socials').doc(duplicateDocId).delete();
  console.log('Duplicate document deleted successfully.');
  
  console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
