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
  console.log('=== STARTING ENPAZ WEEKLY SCHEDULE UPLOAD ===');

  const groupId = '79hPPpHs0bu2FKNjOrbi';
  const year = 2026;
  const month = 7;
  const weekNum = 4;
  const suffix = `weekly_${weekNum}`;
  const storagePath = `groupScheduleImages/${groupId}/${year}_${month}_${suffix}.jpg`;

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784856738557.jpg',
    storagePath,
    'image/jpeg'
  );

  // 2. 문서 저장
  const docId = `${groupId}_${year}_${month}_${suffix}`;
  console.log(`Saving document ${docId} to groupScheduleImages...`);
  await db.collection('groupScheduleImages').doc(docId).set({
    groupId: groupId,
    imageUrl: imageUrl,
    year: year,
    month: month,
    type: 'weekly',
    weekNum: weekNum,
    uploadedAt: new Date().toISOString(),
    storagePath: storagePath
  });

  console.log('=== ENPAZ WEEKLY SCHEDULE UPLOAD COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
