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
  const targetDocId = 'tHLwhZPcE5V1NGRCR5d4';
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783451485606.jpg';
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
      djNameNative: '파랑우산',
      djName: 'Blue Umbrella',
      date: '2026-06-19',
      id: 'dj_8aem5wlqa'
    },
    {
      date: '2026-06-26',
      djNativeName: '마린',
      djName: 'Marine'
    },
    {
      id: 'dj-diego-20260710',
      date: '2026-07-10',
      djName: 'Diego',
      djNameNative: '디에고'
    }
  ];

  console.log('2. Updating target document...');
  await db.collection('socials').doc(targetDocId).set({
    imageUrl: imageUrl,
    djName: 'Diego',
    djNameNative: '디에고',
    djs: updatedDjs,
    startTime: '21:00',
    endTime: '24:00',
    organizerId: 'manual_best',
    organizerName: 'Best',
    organizerNameNative: '베스트',
    description: '광주 꼰땅고 금요 꼰밀롱가\n\n• 일시: 2026년 7월 10일 (금) PM 9:00 ~ 12:00\n• DJ: 디에고 (Diego)\n• 입장료: 10,000원\n• 장소: CON TANGO (광주시 서구 염화로 103, 4F S댄스스튜디오)\n• 문의: 010-9660-6726 (Best)',
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
