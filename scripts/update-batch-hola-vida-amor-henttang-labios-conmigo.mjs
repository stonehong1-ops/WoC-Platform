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
  console.log('=== STARTING SECOND MASTER BATCH SOCIAL UPDATES ===');

  // 1. 안단테 올라 밀롱가 신규 생성
  const holaUrl = await uploadFile('media__1783463131502.png', 'socials/andante_hola_friday_milonga/poster.png', 'image/png');
  await db.collection('socials').doc('andante_hola_friday_milonga').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Milonga Hola',
    titleNative: '올라 밀롱가',
    venueId: 'QtjovOcmoPzJ8SPyeZKh',
    venueName: 'Andante',
    venueNameNative: '안단테',
    startTime: '19:30',
    endTime: '24:00',
    dayOfWeek: 5,
    recurrence: '2nd',
    djName: 'Carlos',
    djNameNative: '까를로스',
    djs: [{ id: 'dj-carlos-20260710', date: '2026-07-10', djName: 'Carlos', djNameNative: '까를로스' }],
    organizerId: 'manual_dana_arman',
    organizerName: 'Dana & Arman',
    organizerNameNative: '단아 & 아르만',
    organizerIds: ['manual_dana', 'manual_arman'],
    organizerNames: ['Dana', 'Arman'],
    organizerNativeNames: ['단아', '아르만'],
    price: '13,000 KRW',
    country: 'KR',
    city: 'SEOUL',
    imageUrl: holaUrl,
    posterExportUrl: holaUrl,
    description: "매월 둘째 금요일 안단테에서 열리는 올라 밀롱가(Milonga Hola) 입니다.\n안녕이라는 따뜻한 인사와 함께 아름다운 탱고 시간을 즐겨보아요!\n\n• 시간: PM 7:30 ~ 12:00\n• DJ: 까를로스 (Carlos)\n• Org: 단아 & 아르만 (with 알밀프렌즈)\n• 테이블 예약: 단아 (카톡 id: pansophy)\n• 장소: 안단테 (Andante - 마포구 홍대)",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('1. Hola Milonga registered.');

  // 2. 광주 금비다 갱신 (gwangju_mivida_friday_mimosa)
  const mividaUrl = await uploadFile('media__1783463151799.jpg', 'socials/gwangju_mivida_friday_mimosa/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('gwangju_mivida_friday_mimosa').update({
    imageUrl: mividaUrl,
    posterExportUrl: mividaUrl,
    titleNative: '금비다 (미모사)',
    title: 'Geum Vida (Mimosa)',
    description: "광주 금요일 밀롱가 '금비다' (미비다 미모사 금요 밀롱가) 입니다.\n\n• 일시: 7월 10일 (금) 오후 9:00 ~\n• 장소: 미비다탱고 스튜디오 5층 (광주 미비다)\n• 이미지: 금비다 오프닝 7월 10일 기념 사진",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('2. Mivida Geumvida updated.');

  // 3. 진주 탱고 아모르 신규 생성
  const jinjuUrl = await uploadFile('media__1783463258959.png', 'socials/jinju_tango_amor_3rd_friday/poster.png', 'image/png');
  await db.collection('socials').doc('jinju_tango_amor_3rd_friday').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Jinju Tango Amor Milonga',
    titleNative: '진주 탱고 아모르 밀롱가',
    venueId: 'jinju_tango_amor_studio',
    venueName: 'Tango Amor Studio',
    venueNameNative: '진주 아모르 스튜디오',
    startTime: '15:00',
    endTime: '19:00',
    dayOfWeek: 5,
    recurrence: '3rd',
    djName: 'Anna',
    djNameNative: '안나',
    djs: [{ id: 'dj-anna-20260717', date: '2026-07-17', djName: 'Anna', djNameNative: '안나' }],
    organizerId: 'manual_maru',
    organizerName: 'Maru',
    organizerNameNative: '마루',
    organizerIds: ['manual_maru'],
    organizerNames: ['Maru'],
    organizerNativeNames: ['마루'],
    price: '12,000 KRW',
    country: 'KR',
    city: 'JINJU',
    imageUrl: jinjuUrl,
    posterExportUrl: jinjuUrl,
    description: "매월 3째주 금요일 낮 진주 아모르 스튜디오에서 열리는 정기 밀롱가 입니다.\n각 동호회 매니저, 오거나이저, 강사는 무료로 입장 가능합니다!\n\n• 시간: PM 3:00 ~ 7:00\n• DJ: 안나 (Anna - 부산)\n• Org: 마루 (Maru)\n• 장소: 진주 아모르 스튜디오 (진주시 남강로 541번지 3층)\n• 입장료: 12,000원\n• 문의: 마루 (010-9337-2609)",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('3. Jinju Tango Amor registered.');

  // 4. 창원 헨땅 에스뻬라 밀롱가 갱신 (changwon_minoche_friday_henttang)
  const henttangUrl = await uploadFile('media__1783463361499.jpg', 'socials/changwon_minoche_friday_henttang/poster.jpg', 'image/jpeg');
  const htDoc = await db.collection('socials').doc('changwon_minoche_friday_henttang').get();
  let htDjs = htDoc.data().djs || [];
  const htIdx = htDjs.findIndex(d => d.date === '2026-07-10');
  const targetHtDj = { id: 'dj-fashion-20260710', date: '2026-07-10', djName: 'Fashion', djNameNative: '패션' };
  if (htIdx >= 0) {
    htDjs[htIdx] = targetHtDj;
  } else {
    htDjs.push(targetHtDj);
  }
  await db.collection('socials').doc('changwon_minoche_friday_henttang').update({
    imageUrl: henttangUrl,
    posterExportUrl: henttangUrl,
    djName: 'Fashion',
    djNameNative: '패션',
    djs: htDjs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('4. Changwon Henttang updated.');

  // 5. 서울 라벤따나 라비오스 갱신 (YtCqTajwGHGCj31BQTyT)
  const labiosUrl = await uploadFile('media__1783463442239.png', 'socials/YtCqTajwGHGCj31BQTyT/poster_20260710.png', 'image/png');
  const lbDoc = await db.collection('socials').doc('YtCqTajwGHGCj31BQTyT').get();
  let lbDjs = lbDoc.data().djs || [];
  const lbIdx = lbDjs.findIndex(d => d.date === '2026-07-10');
  const targetLbDj = { id: 'dj-susana-20260710', date: '2026-07-10', djName: 'Susana', djNameNative: '수사나' };
  if (lbIdx >= 0) {
    lbDjs[lbIdx] = targetLbDj;
  } else {
    lbDjs.push(targetLbDj);
  }
  await db.collection('socials').doc('YtCqTajwGHGCj31BQTyT').update({
    imageUrl: labiosUrl,
    posterExportUrl: labiosUrl,
    djName: 'Susana',
    djNameNative: '수사나',
    djs: lbDjs,
    description: "7월의 라비오스! 맛있는 밀롱가, 라비오스에서 만나요 🍷\n장마철에 딱 어울리는 바삭한 감자전, 양송이 파스타, 상큼 샐러드까지 맛있게 준비할게요!\n\n• 일시: 2026.07.10 금요일 PM 8:00 ~ 12:00\n• DJ: 수사나 (Susana)\n• Org: 철환 (010-9472-6704)\n• 장소: 라 벤따나 (서울 마포구 잔다리로 48, 2층)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('5. Labios updated.');

  // 6. 부산 이데알 콘미고 밀롱가 신규 생성
  const conmigoUrl = await uploadFile('media__1783463464240.jpg', 'socials/busan_ideal_conmigo_4th_saturday/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('busan_ideal_conmigo_4th_saturday').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Milonga Conmigo',
    titleNative: '콘미고 밀롱가',
    venueId: 'hF6R1lIMNly8DJIiNGvD',
    venueName: 'Ideal Studio',
    venueNameNative: '이데알 스튜디오',
    startTime: '14:30',
    endTime: '18:30',
    dayOfWeek: 6,
    recurrence: '4th',
    djName: 'Beast',
    djNameNative: '비스트',
    djs: [{ id: 'dj-beast-20260725', date: '2026-07-25', djName: 'Beast', djNameNative: '비스트' }],
    organizerId: 'manual_beast_turtle',
    organizerName: 'Beast & Turtle',
    organizerNameNative: '비스트 & 거북이',
    organizerIds: ['manual_beast', 'manual_turtle'],
    organizerNames: ['Beast', 'Turtle'],
    organizerNativeNames: ['비스트', '거북이'],
    price: '13,000 KRW',
    country: 'KOREA',
    city: 'BUSAN',
    imageUrl: conmigoUrl,
    posterExportUrl: conmigoUrl,
    description: "매월 넷째주 토요일 낮 부산 이데알 스튜디오에서 열리는 정기 밀롱가 '콘미고(Conmigo)' 입니다.\n밤보다 더 찬란한 낮밀롱가의 즐거움을 함께 만들어 보아요!\n\n• 시간: PM 2:30 ~ 6:30\n• Org: 비스트 & 거북이 (Beast & Turtle)\n• 장소: 이데알 스튜디오 (Ideal Studio - 부산 부산진구 신천대로 62번길 62 3층)\n• 첫 개막일: 2026년 7월 25일",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('6. Conmigo registered.');

  console.log('=== SECOND MASTER BATCH COMPLETED SUCCESSFULLY ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
