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
  console.log('=== STARTING RORA MILONGA UPDATE ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784716062578.jpg',
    'socials/popup_roramilonga_bubble_20260704/poster_20260801.jpg',
    'image/jpeg'
  );

  // 2. 소셜 업데이트
  console.log('Updating Rora Milonga...');
  const ref = db.collection('socials').doc('popup_roramilonga_bubble_20260704');
  const snap = await ref.get();
  let djs = snap.exists ? (snap.data().djs || []) : [];

  const djItem = {
    id: 'dj-deyong-20260801',
    date: '2026-08-01',
    djName: 'Deyong',
    djNativeName: '디져용',
    djNameNative: '디져용'
  };

  const dIdx = djs.findIndex(d => d.date === '2026-08-01');
  if (dIdx >= 0) djs[dIdx] = djItem;
  else djs.push(djItem);

  await ref.set({
    title: 'Rora Milonga Bubble Bubble',
    titleNative: '로라 밀롱가 버블 버블',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6, // 토요일
    recurrence: '1st',
    startTime: '19:00',
    endTime: '23:00',
    venueId: 'en_paz_studio',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Deyong',
    djNameNative: '디져용',
    djs: djs,
    organizerId: 'manual_kimjinho',
    organizerName: 'Jinho Kim',
    organizerNameNative: '김진호',
    description: "한 여름의 시작인 8월 1일 토요일! 로라밀롱가 버블 버블이 뜨거워진 공기를 시원하게 만들어줄 밀롱가를 준비했습니다 🫧\n\n• 일시: 8월 1일 (토) PM 7:00 ~ 11:00\n• DJ: 디져용 (Deyong)\n• Org: 김진호 (010-2249-5073) & 버블티 (010-2530-6636)\n• 장소: 교대 엔빠스 스튜디오 (반포대로30길 82 B1)\n• 입장료: 13,000원\n• 테이블 예약: 010-2249-5073",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== RORA MILONGA UPDATE COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
