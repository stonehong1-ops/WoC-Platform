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
const mediaDir = 'C:\\Users\\stone\\.gemini\\antigravity\/\/brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\';

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
  console.log('=== STARTING MUSEMIL REGISTRATION ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784544975975.jpg',
    'socials/pista_musemil_4th_friday/poster.jpg',
    'image/jpeg'
  );

  // 2. 소셜 등록 (MUSEMIL)
  await db.collection('socials').doc('pista_musemil_4th_friday').set({
    title: 'MUSEMIL',
    titleNative: '뮤즈밀',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 5, // 금요일
    recurrence: '4th',
    startTime: '20:00',
    endTime: '24:00',
    venueId: 'pista', // 피스타
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'MAR',
    djNameNative: '마르',
    djs: [{
      id: 'dj-mar-20260724',
      date: '2026-07-24',
      djName: 'MAR',
      djNativeName: '마르',
      djNameNative: '마르' // 하위 호환
    }],
    organizerId: 'manual_pista_team',
    organizerName: 'Pista Team',
    organizerNameNative: '피스타 팀',
    description: "매월 넷째 주 금요일 피스타에서 펼쳐지는 특별하고 매력적인 뮤즈밀 (MUSEMIL) 🌹\n\n• 일시: 7월 24일 금요일 PM 8:00 ~ AM 12:00\n• DJ: 마르 (MAR)\n• 장소: 홍대 피스타 (Tango Pista - 마포구 월드컵북로6길 49 B1)\n• 입장료: 13,000원\n• DJ 마르의 감각적인 음악과 함께 잊지 못할 금요일 밤을 즐겨보세요!",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('=== MUSEMIL REGISTRATION COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
