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
  const docId = 'otra_millim_saturday_milonga';
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783459495993.jpg';

  console.log('1. Uploading Millim poster to storage...');
  const destPath = `socials/${docId}/poster.jpg`;
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: { contentType: 'image/jpeg' }
  });
  await bucket.file(destPath).makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded Image URL:', imageUrl);

  console.log('2. Creating Firestore document...');
  const djs = [
    { id: 'dj-londonhong-20260704', date: '2026-07-04', djName: 'London Hong', djNameNative: '런던홍' },
    { id: 'dj-nova-20260711', date: '2026-07-11', djName: 'Nova', djNameNative: '노바' },
    { id: 'dj-nova-20260718', date: '2026-07-18', djName: 'Nova', djNameNative: '노바' },
    { id: 'dj-nova-20260725', date: '2026-07-25', djName: 'Nova', djNameNative: '노바' }
  ];

  await db.collection('socials').doc(docId).set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Millim Milonga',
    titleNative: '밀림',
    dayOfWeek: 6,
    recurrence: 'every',
    startTime: '19:30',
    endTime: '23:00',
    venueId: 'pCX88Jyhy0EzxbyBi4Nb', // 오뜨라
    venueName: 'Otra',
    venueNameNative: '오뜨라',
    imageUrl: imageUrl,
    djName: 'Nova',
    djNameNative: '노바',
    djs: djs,
    organizerId: 'manual_otra_managers',
    organizerName: 'Otra Managers',
    organizerNameNative: '오뜨라 매니저단',
    organizerIds: ['manual_otra_managers'],
    organizerNames: ['Otra Managers'],
    organizerNativeNames: ['오뜨라 매니저단'],
    description: "매주 토요일 저녁 오뜨라에서 열리는 정규 밀롱가 '밀림(Millim)' 입니다.\n생동감 넘치는 에너지를 마음껏 즐겨보세요!\n\n• 시간: 매주 토요일 PM 7:30 ~ 11:00\n• DJ: 노바 (Nova)\n• Managers: 블랑, 탈린, 제이크, 노바, 릴라, 샤샤, 티제이, 별\n• 테이블 예약: Tallinn Gianni Lee에게 메세지 또는 Kakaotalk ID : SPL26\n• 장소: 오뜨라 탱고 클럽 (Otra Tango Club - 서울 마포구 홍익로5안길 20 지하 1층)",
    country: 'KR',
    city: 'SEOUL',
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('[SUCCESS] Millim Saturday Milonga created successfully!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
