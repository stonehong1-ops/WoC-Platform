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
  console.log('=== STARTING DAEGU DDD SOCIALS UPDATE ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784643378388.png',
    'socials/daegu_dia_wednesday_ddd/poster_20260722.png',
    'image/png'
  );

  // 2. 수DDD (daegu_dia_wednesday_ddd) 갱신
  console.log('Updating Wednesday DDD...');
  const wedRef = db.collection('socials').doc('daegu_dia_wednesday_ddd');
  const wedSnap = await wedRef.get();
  let wedDjs = wedSnap.exists ? (wedSnap.data().djs || []) : [];
  
  const doyaDj = {
    id: 'dj-doya-20260722',
    date: '2026-07-22',
    djName: 'Doya',
    djNativeName: '도야',
    djNameNative: '도야'
  };

  const dIdx = wedDjs.findIndex(d => d.date === '2026-07-22');
  if (dIdx >= 0) wedDjs[dIdx] = doyaDj;
  else wedDjs.push(doyaDj);

  await wedRef.set({
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Doya',
    djNameNative: '도야',
    djs: wedDjs,
    description: "내일(수요일)은 DDD! 좋은 음악, 좋은 사람, 그리고 편안한 수요일 밤 🌙\n\n• 일시: 7월 22일 수요일 PM 9:00 ~ 자정\n• DJ: 도야 (Doya)\n• Org: 도야도야 (010-2980-2935)\n• 입장료: 10,000원 (수요일 수업 수강자 5,000원)\n• 장소: 대구 탱고카페 Dia (대구 북구 침산로 168 엠브로타워 507호)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 3. 일DDD (daegu_dia_sunday_ddd) 신규 등록
  console.log('Registering Sunday DDD...');
  await db.collection('socials').doc('daegu_dia_sunday_ddd').set({
    title: 'DDD',
    titleNative: '일DDD',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 0, // 일요일
    recurrence: 'every',
    startTime: '15:00',
    endTime: '19:00',
    venueId: 'gmSqw4sSUBWeX4jIvoGV', // 탱고카페디아
    venueName: 'Tango Cafe Dia',
    venueNameNative: '탱고카페디아',
    price: '10,000 KRW',
    city: 'DAEGU',
    country: 'KR',
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Beast',
    djNameNative: '비스트',
    djs: [{
      id: 'dj-beast-20260726',
      date: '2026-07-26',
      djName: 'Beast',
      djNativeName: '비스트',
      djNameNative: '비스트'
    }],
    organizerId: 'manual_doyadoya',
    organizerName: 'DoyaDoya',
    organizerNameNative: '도야도야',
    description: "여유로운 일요일 오후, 좋은 음악과 함께 즐기는 일DDD 밀롱가 ☀️\n\n• 일시: 매주 일요일 PM 3:00 ~ 7:00\n• 7/26 DJ: 비스트 (Beast)\n• Org: 도야도야 (010-2980-2935)\n• 장소: 대구 탱고카페 Dia (대구 북구 침산로 168 엠브로타워 507호)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== DAEGU DDD SOCIALS UPDATE COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
