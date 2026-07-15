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
  const docId = 'daejeon_azucar_wednesday_ttanggenmi';
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783458028509.png';

  console.log('1. Uploading Ttanggenmi poster to storage...');
  const destPath = `socials/${docId}/poster.png`;
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: { contentType: 'image/png' }
  });
  await bucket.file(destPath).makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded Image URL:', imageUrl);

  console.log('2. Updating Firestore document...');
  const djs = [
    { id: 'dj-tbd-20260701', date: '2026-07-01', djName: 'TBD', djNameNative: 'TBD' },
    { id: 'dj-yujin-20260708', date: '2026-07-08', djName: 'Yujin', djNameNative: '유진' },
    { id: 'dj-tbd-20260715', date: '2026-07-15', djName: 'TBD', djNameNative: 'TBD' },
    { id: 'dj-tbd-20260722', date: '2026-07-22', djName: 'TBD', djNameNative: 'TBD' },
    { id: 'dj-tbd-20260729', date: '2026-07-29', djName: 'TBD', djNameNative: 'TBD' }
  ];

  await db.collection('socials').doc(docId).set({
    imageUrl: imageUrl,
    djName: 'Yujin',
    djNameNative: '유진',
    djs: djs,
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('[SUCCESS] Ttanggenmi Wednesday Milonga updated successfully!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
