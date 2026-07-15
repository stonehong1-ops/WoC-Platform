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

const mediaDir = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\';

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
  console.log('=== STARTING CAMELIA POSTER UPDATE ===');

  const cameliaUrl = await uploadFile('media__1784022819827.png', 'socials/n4MioMSdxqnA3CVfX53N/poster_20260715.png', 'image/png');

  const docRef = db.collection('socials').doc('n4MioMSdxqnA3CVfX53N');
  const doc = await docRef.get();
  let djs = doc.data().djs || [];
  const idx = djs.findIndex(d => d.date === '2026-07-15');
  const targetDj = { id: 'dj-slowhiro-20260715', date: '2026-07-15', djName: 'Slow Hiro', djNameNative: '히로' };
  if (idx >= 0) {
    djs[idx] = targetDj;
  } else {
    djs.push(targetDj);
  }

  await docRef.update({
    imageUrl: cameliaUrl,
    posterExportUrl: cameliaUrl,
    djName: 'Slow Hiro',
    djNameNative: '히로',
    djs: djs,
    description: "수요일 저녁 엔빠스에서 열리는 까멜리아 밀롱가 (Camelia) 🌺\n\n• 일시: 7월 15일 (수) PM 7:30 ~ 11:30\n• DJ: 히로 (Slow Hiro)\n• Org: 까를로스 (Carlos)\n• 장소: 엔빠스 스튜디오 (En Paz Studio - 서초구 반포대로 30길 82 B1)\n• 예약 및 문의: 까를로스 (카톡 ID: tanguerocarlos)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('=== CAMELIA POSTER UPDATE COMPLETED SUCCESSFULLY ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
