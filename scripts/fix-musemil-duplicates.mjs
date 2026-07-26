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
  console.log('=== STARTING DUP FIXES ===');

  // 1. 로라 밀롱가 포스터 재업로드 및 재갱신 (media__1784715877054.jpg)
  const roraUrl = await uploadFile(
    'media__1784715877054.jpg',
    'socials/popup_roramilonga_bubble_20260704/poster_20260801_fixed.jpg',
    'image/jpeg'
  );
  console.log('Updating Rora Milonga Poster...');
  await db.collection('socials').doc('popup_roramilonga_bubble_20260704').set({
    imageUrl: roraUrl,
    posterExportUrl: roraUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. 뮤즈밀 포스터 업로드 및 갱신 (media__1784716062578.jpg)
  const museUrl = await uploadFile(
    'media__1784716062578.jpg',
    'socials/v0zd2tN2sQpDRW0lSwAi/poster_20260724_fixed.jpg',
    'image/jpeg'
  );
  console.log('Updating Real Musemil Poster...');
  await db.collection('socials').doc('v0zd2tN2sQpDRW0lSwAi').set({
    imageUrl: museUrl,
    posterExportUrl: museUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 3. 중복 생성된 임시 문서 pista_musemil_4th_friday 삭제
  console.log('Deleting duplicate pista_musemil_4th_friday...');
  await db.collection('socials').doc('pista_musemil_4th_friday').delete();

  console.log('=== DUP FIXES COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
