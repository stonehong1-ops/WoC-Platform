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
  const wedId = 'XntnLROqG8oZduaSFlhZ';
  const friId = 'rh3DuAKRkEu5FoZAan5N';
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783453077284.png';

  console.log('1. Uploading images to storage...');
  
  // 수요일 포스터 업로드
  const wedDest = `socials/${wedId}/poster.png`;
  await bucket.upload(localImagePath, {
    destination: wedDest,
    metadata: { contentType: 'image/png' }
  });
  await bucket.file(wedDest).makePublic();
  const wedImageUrl = `https://storage.googleapis.com/${bucket.name}/${wedDest}`;
  
  // 금요일 포스터 업로드
  const friDest = `socials/${friId}/poster.png`;
  await bucket.upload(localImagePath, {
    destination: friDest,
    metadata: { contentType: 'image/png' }
  });
  await bucket.file(friDest).makePublic();
  const friImageUrl = `https://storage.googleapis.com/${bucket.name}/${friDest}`;

  console.log('Wed Image URL:', wedImageUrl);
  console.log('Fri Image URL:', friImageUrl);

  // 2. 수요일 일정 업데이트
  console.log('Updating Wednesday Luminoso Practica...');
  const wedDjs = [
    { id: 'dj-trees-20260701', date: '2026-07-01', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260708', date: '2026-07-08', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260715', date: '2026-07-15', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260722', date: '2026-07-22', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260729', date: '2026-07-29', djName: 'Trees', djNameNative: '트리스' }
  ];
  await db.collection('socials').doc(wedId).set({
    imageUrl: wedImageUrl,
    djName: 'Trees',
    djNameNative: '트리스',
    djs: wedDjs,
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 3. 금요일 일정 업데이트
  console.log('Updating Friday Luminoso Practica...');
  const friDjs = [
    { id: 'dj-trees-20260703', date: '2026-07-03', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260710', date: '2026-07-10', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260717', date: '2026-07-17', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260724', date: '2026-07-24', djName: 'Trees', djNameNative: '트리스' },
    { id: 'dj-trees-20260731', date: '2026-07-31', djName: 'Trees', djNameNative: '트리스' }
  ];
  await db.collection('socials').doc(friId).set({
    imageUrl: friImageUrl,
    djName: 'Trees',
    djNameNative: '트리스',
    djs: friDjs,
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
