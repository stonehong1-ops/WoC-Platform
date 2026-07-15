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
  console.log('=== STARTING IDEAL & NOCHE UPDATE BATCH ===');

  // 1. 이데알 8주년 포스터 업로드
  const idealUrl = await uploadFile('media__1783462378973.png', 'socials/busan_ideal_8th_anniversary/poster.png', 'image/png');

  // 2. 이데알 1부 (basMjXc0pCPbcPUwMpfb) 업데이트
  console.log('Updating Ideal Part 1...');
  await db.collection('socials').doc('basMjXc0pCPbcPUwMpfb').update({
    imageUrl: idealUrl,
    posterExportUrl: idealUrl,
    description: "Ideal's 8th Anniversary & Sarah ideal 2nd 1부 (낮밀)\n\n• 일시: 2026년 7월 18일 (토) PM 2:30 ~ 6:30\n• DJ: 비스트 (Beast)\n• Special Performance: pm 6:30 ~ 7:00\n• 장소: 이데알 스튜디오 3층 (부산시 부산진구 신천대로 62번길 62)\n• 문의: 010-2396-0775 (sarah)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. 이데알 2부 (popup_busan_ideal_8th_part2) 신규 등록
  console.log('Registering Ideal Part 2...');
  await db.collection('socials').doc('popup_busan_ideal_8th_part2').set({
    type: 'popup',
    subCategory: 'milonga',
    title: "Ideal's 8th Anniversary & Sarah ideal 2nd (Part 2)",
    titleNative: "이데알 스튜디오 8주년 & 사라이데알 2주년 파티 (2부 저녁밀)",
    venueId: 'hF6R1lIMNly8DJIiNGvD',
    venueName: 'Ideal Studio',
    venueNameNative: '이데알 스튜디오',
    startTime: '19:00',
    endTime: '23:30',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-18T00:00:00+09:00')),
    djName: 'Robroy',
    djNameNative: '롭로이',
    djs: [{ id: 'dj-robroy-20260718', date: '2026-07-18', djName: 'Robroy', djNameNative: '롭로이' }],
    organizerId: 'manual_sarah',
    organizerName: 'Sarah Han',
    organizerNameNative: '사라',
    organizerIds: ['manual_sarah'],
    organizerNames: ['Sarah Han'],
    organizerNativeNames: ['사라'],
    price: '13,000 KRW',
    country: 'KOREA',
    city: 'BUSAN',
    imageUrl: idealUrl,
    posterExportUrl: idealUrl,
    description: "Ideal's 8th Anniversary & Sarah ideal 2nd 2부 (저녁밀)\n\n• 일시: 2026년 7월 18일 (토) PM 7:00 ~ 11:30\n• DJ: 롭로이 (Robroy)\n• Special Performance: pm 6:30 ~ 7:00\n• 장소: 이데알 스튜디오 3층 (부산시 부산진구 신천대로 62번길 62)\n• 문의: 010-2396-0775 (sarah)",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 4. 오나다 라노체 (lanoche_milonga_thursday) 업데이트
  console.log('Updating La Noche...');
  const nocheUrl = await uploadFile('media__1783462492273.jpg', 'socials/lanoche_milonga_thursday/poster_20260709.jpg', 'image/jpeg');
  const nocheDoc = await db.collection('socials').doc('lanoche_milonga_thursday').get();
  let nocheDjs = nocheDoc.data().djs || [];
  const existNocheIdx = nocheDjs.findIndex(d => d.date === '2026-07-09');
  const targetNocheDj = { id: 'dj-gonz-20260709', date: '2026-07-09', djName: 'Gonz', djNameNative: '곤즈' };
  if (existNocheIdx >= 0) {
    nocheDjs[existNocheIdx] = targetNocheDj;
  } else {
    nocheDjs.push(targetNocheDj);
  }
  await db.collection('socials').doc('lanoche_milonga_thursday').update({
    imageUrl: nocheUrl,
    posterExportUrl: nocheUrl,
    djName: 'Gonz',
    djNameNative: '곤즈',
    djs: nocheDjs,
    description: "라노체 밀롱가 🌛\n\n• 일시: 매주 목요일 PM 8:00 ~ 12:00\n• 7/9 (목) 오픈강습: 19:30\n• 7/9 (목) DJ: 곤즈 (Gonz)\n• Org: 현우 (FEE: 13,000원)\n• 장소: 오나다 (서울 마포구 동교로 193 B1)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('=== IDEAL & NOCHE UPDATE BATCH COMPLETED SUCCESSFULLY ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
