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
  const targetDocId = 'popup_daejeon_onada_lumali_20260711';
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783451575972.png';
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

  // date 설정
  const dateVal = admin.firestore.Timestamp.fromDate(new Date('2026-07-11T00:00:00+09:00'));

  // djs 배열 설정
  const updatedDjs = [
    {
      id: 'dj-nero-20260711',
      date: '2026-07-11',
      djName: 'Nero',
      djNameNative: '네로'
    }
  ];

  console.log('2. Writing to Firestore...');
  await db.collection('socials').doc(targetDocId).set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Lumali',
    titleNative: '루말리',
    date: dateVal,
    startTime: '21:00',
    endTime: '02:00',
    venueId: 'Ui2cNpoNKhFAFjyN3vy7', // 대전 오나다
    venueName: 'Onada',
    venueNameNative: '오나다',
    city: 'DAEJEON',
    country: 'KOREA',
    imageUrl: imageUrl,
    djName: 'Nero',
    djNameNative: '네로',
    djs: updatedDjs,
    organizerId: 'manual_minjung_park',
    organizerName: 'Minjung Park',
    organizerNameNative: '박민정',
    price: 'KRW 13000',
    description: '단 하루.\n플로어에 음악이 흐르면 시작되는 짜릿한 설렘의 순간.\n\n땅고. 그리고 설명할 수 없는 끌림.\n저희는 미쳐도 좋은 여름밤을 준비할게요.\n나머진 여러분이 채워 주세요.\n\n• 일시: 2026년 7월 11일 토요일 밤 9시 (9PM TO ??)\n• DJ: 네로 (Nero Kim)\n• Org: 박민정\n• 장소: 대전 오나다 (Tango O Nada)\n• 입장료: 13,000원',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
