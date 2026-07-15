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
  const groupId = '79lEMskDvGUQQW4o4ZHx'; // 서울 오나다
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783460475967.jpg';
  const year = 2026;
  const month = 7;

  console.log('1. Uploading Onada Weekly 1 and Weekly 2 images to storage...');
  
  // 1주차
  const dest1 = `groupScheduleImages/${groupId}/${year}_${month}_weekly_1.jpg`;
  await bucket.upload(localImagePath, {
    destination: dest1,
    metadata: { contentType: 'image/jpeg' }
  });
  await bucket.file(dest1).makePublic();
  const url1 = `https://storage.googleapis.com/${bucket.name}/${dest1}`;

  // 2주차
  const dest2 = `groupScheduleImages/${groupId}/${year}_${month}_weekly_2.jpg`;
  await bucket.upload(localImagePath, {
    destination: dest2,
    metadata: { contentType: 'image/jpeg' }
  });
  await bucket.file(dest2).makePublic();
  const url2 = `https://storage.googleapis.com/${bucket.name}/${dest2}`;

  console.log('Weekly 1 URL:', url1);
  console.log('Weekly 2 URL:', url2);

  // 2. Firestore 등록
  console.log('Registering Weekly 1 doc...');
  const docId1 = `${groupId}_${year}_${month}_weekly_1`;
  await db.collection('groupScheduleImages').doc(docId1).set({
    groupId,
    imageUrl: url1,
    year,
    month,
    type: 'weekly',
    weekNum: 1,
    uploadedAt: new Date().toISOString(),
    storagePath: dest1
  });

  console.log('Registering Weekly 2 doc...');
  const docId2 = `${groupId}_${year}_${month}_weekly_2`;
  await db.collection('groupScheduleImages').doc(docId2).set({
    groupId,
    imageUrl: url2,
    year,
    month,
    type: 'weekly',
    weekNum: 2,
    uploadedAt: new Date().toISOString(),
    storagePath: dest2
  });

  console.log('[SUCCESS] Onada Weekly 1 & 2 schedule images registered successfully!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
