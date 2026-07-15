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
  const valsId = 'valsamix_20260712';
  const sabSatId = 'popup_sabelle_20260725';
  const sabSunId = 'popup_sabelle_20260726';

  const valsLocalImg = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783460020322.png';
  const sabLocalImg = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783460042871.jpg';

  console.log('1. Uploading posters to storage...');
  
  // 발사믹
  const valsDest = `socials/${valsId}/poster.png`;
  await bucket.upload(valsLocalImg, {
    destination: valsDest,
    metadata: { contentType: 'image/png' }
  });
  await bucket.file(valsDest).makePublic();
  const valsUrl = `https://storage.googleapis.com/${bucket.name}/${valsDest}`;

  // 사베리밀 (토요일)
  const sabSatDest = `socials/${sabSatId}/poster.jpg`;
  await bucket.upload(sabLocalImg, {
    destination: sabSatDest,
    metadata: { contentType: 'image/jpeg' }
  });
  await bucket.file(sabSatDest).makePublic();
  const sabSatUrl = `https://storage.googleapis.com/${bucket.name}/${sabSatDest}`;

  // 사베리밀 (일요일)
  const sabSunDest = `socials/${sabSunId}/poster.jpg`;
  await bucket.upload(sabLocalImg, {
    destination: sabSunDest,
    metadata: { contentType: 'image/jpeg' }
  });
  await bucket.file(sabSunDest).makePublic();
  const sabSunUrl = `https://storage.googleapis.com/${bucket.name}/${sabSunDest}`;

  console.log('Valsamix URL:', valsUrl);
  console.log('Sabelle Sat URL:', sabSatUrl);
  console.log('Sabelle Sun URL:', sabSunUrl);

  // 2. Firestore 업데이트
  console.log('Updating Valsamix document...');
  await db.collection('socials').doc(valsId).set({
    imageUrl: valsUrl,
    posterExportUrl: valsUrl,
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('Updating Sabelle Saturday document...');
  await db.collection('socials').doc(sabSatId).set({
    imageUrl: sabSatUrl,
    posterExportUrl: sabSatUrl,
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('Updating Sabelle Sunday document...');
  await db.collection('socials').doc(sabSunId).set({
    imageUrl: sabSunUrl,
    posterExportUrl: sabSunUrl,
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('[SUCCESS] All Valsamix and Sabelle documents updated successfully!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
