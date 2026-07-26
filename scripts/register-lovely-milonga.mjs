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
  console.log('=== STARTING LOVELY MILONGA REGISTRATION ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784856386104.jpg',
    'socials/lovely_milonga_regular/poster_20260808.jpg',
    'image/jpeg'
  );

  // 2. 소셜 등록
  await db.collection('socials').doc('lovely_milonga_regular').set({
    title: 'Lovely Milonga',
    titleNative: '러블리밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6, // 토요일
    recurrence: '2nd', // 매월 둘째주 토요일
    startTime: '18:00',
    endTime: '21:30',
    venueId: '3XagPuu2bmBorzqMPNk3', // 실루엣
    venueName: 'Silhouette',
    venueNameNative: '실루엣',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KOREA',
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Best',
    djNameNative: '베스트',
    djs: [{
      id: 'dj-best-20260808',
      date: '2026-08-08',
      djName: 'Best',
      djNativeName: '베스트',
      djNameNative: '베스트'
    }],
    organizerId: 'manual_lovely_rachel',
    organizerName: 'Rachel',
    organizerNameNative: '레이첼',
    description: "매월 둘째 주 토요일, 분당 정자동 실루엣에서 열리는 러블리밀롱가 (Lovely Milonga) 👒✨\n\n와인과 음악, 그리고 좋은 사람들이 함께하는 특별한 여름밤을 즐겨보세요! 탱고 열정 가득한 DJ 베스트 님의 감각적인 선곡과 함께합니다.\n\n• 일시: 8월 8일 (토) PM 6:00 ~ 9:30\n• DJ: 베스트 (Best)\n• Org: 레이첼 (Rachel)\n• 스페셜 혜택: 와인, 떡, 아이스망고, 스낵 제공\n• 장소: 분당 정자역 실루엣 (정자동 23-1 지파크프라자 5층)\n• 입장료: 13,000원\n• 테이블 예약: 010-9921-4045\n• 주차: 건물 내 1시간 무료 등록 가능 (이외 정자동 공용환승주차장 권장)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== LOVELY MILONGA REGISTRATION COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
