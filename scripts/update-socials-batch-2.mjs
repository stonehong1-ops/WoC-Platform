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
  console.log('=== STARTING BATCH SOCIALS UPDATE 2 ===');

  // 1. 베뉴 선등록
  const venues = [
    { id: 'weplay_stay', name: 'Weplay Stay', nameKo: '위플 스테이', address: '제주시 구좌읍 해맞이해안로 1098', city: 'JEJU', country: 'KR' },
    { id: 'windstay_cafe', name: 'Windstay Cafe', nameKo: '윈드스테이 카페', address: '제주시 한림읍 명재로 115', city: 'JEJU', country: 'KR' },
    { id: 'vida_dance_studio', name: 'Vida Dance Studio', nameKo: '비다댄스스튜디오', address: '제주시 중앙로 302', city: 'JEJU', country: 'KR' },
    { id: 'jeju_despacio', name: 'Despacio Studio', nameKo: '데스빠시오', address: '제주시 함덕서4길 66', city: 'JEJU', country: 'KR' },
    { id: 'busan_ideal', name: 'Busan Ideal', nameKo: '부산 이데알', address: '부산 부산진구 서전로37번길 18 지하1층', city: 'BUSAN', country: 'KR' },
    { id: 'gwangju_mivida', name: 'Mivida Tango Studio', nameKo: '미비다 탱고 스튜디오', address: '광주 동구 중앙로 162-1 공차건물 5층', city: 'GWANGJU', country: 'KR' },
    { id: 'yeongdo_dabang', name: 'Yeongdo Dabang', nameKo: '영도다방', address: '서울 마포구 독막로 176 지하1층', city: 'SEOUL', country: 'KR', seoulArea: 'gangbuk' },
    { id: 'daejeon_onada', name: 'Daejeon Onada', nameKo: '대전 오나다', address: '대전 서구 갈마동 343-30 지하1층', city: 'DAEJEON', country: 'KR' }
  ];

  for (const v of venues) {
    const ref = db.collection('venues').doc(v.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`Registering venue: ${v.nameKo}`);
      await ref.set({
        ...v,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // 2. 이미지 업로드
  const urlMap = {};
  const imageUploads = [
    { key: 'tarde', file: 'media__1784540216630.png', dest: 'socials/popup_eltango_tarde_20260624/poster_20260722.png', type: 'image/png' },
    { key: 'labios', file: 'media__1784540206872.jpg', dest: 'socials/YtCqTajwGHGCj31BQTyT/poster_20260717.jpg', type: 'image/jpeg' },
    { key: 'cortina_black', file: 'media__1784540239337.png', dest: 'socials/jeju_despacio_cortina_milonga/poster_black.png', type: 'image/png' },
    { key: 'cortina_color', file: 'media__1784540248933.jpg', dest: 'socials/jeju_despacio_cortina_milonga/poster_color.jpg', type: 'image/jpeg' },
    { key: 'volver', file: 'media__1784540337763.png', dest: 'socials/popup_volver_20260628/poster_20260719.png', type: 'image/png' },
    { key: 'lovely', file: 'media__1784540370289.png', dest: 'socials/popup_lovely_7th_anniversary_20260912/poster.png', type: 'image/png' },
    { key: 'jams', file: 'media__1784540395765.jpg', dest: 'socials/jams_milonga/poster_20260718.jpg', type: 'image/jpeg' },
    { key: 'unavez', file: 'media__1784540524748.jpg', dest: 'socials/popup_eltango_unavez_20260627/poster_20260718.jpg', type: 'image/jpeg' },
    { key: 'pistasimmil', file: 'media__1784540546962.jpg', dest: 'socials/mWo82j5uPi2esEU6qvj6/poster_20260718.jpg', type: 'image/jpeg' },
    { key: 'melodia', file: 'media__1784540578090.jpg', dest: 'socials/la_melodia_1st_3rd_sunday/poster.jpg', type: 'image/jpeg' },
    { key: 'orange', file: 'media__1784540653480.jpg', dest: 'socials/EqZPQLbM3rDh1C3xdGLU/poster_20260721.jpg', type: 'image/jpeg' },
    { key: 'luminoso', file: 'media__1784540671596.jpg', dest: 'socials/sMIEoUSmSRS9UwlxWzvp/poster_20260720.jpg', type: 'image/jpeg' },
    { key: 'raramil', file: 'media__1784540701882.jpg', dest: 'socials/popup_andante_raramil_20260731/poster.jpg', type: 'image/jpeg' },
    { key: 'dulce_gangnam', file: 'media__1784540716816.jpg', dest: 'socials/dulce_milonga_gangnam_1st_sunday/poster.jpg', type: 'image/jpeg' },
    { key: 'milpasso', file: 'media__1784540734366.png', dest: 'socials/popup_milpasso_002_20260802/poster.png', type: 'image/png' },
    { key: 'hwajeong', file: 'media__1784540765327.png', dest: 'socials/popup_hwajeong_20260623/poster_20260721.png', type: 'image/png' },
    { key: 'dorada', file: 'media__1784540862112.jpg', dest: 'socials/dorada_milonga_tuesday/poster.jpg', type: 'image/jpeg' },
    { key: 'jinju', file: 'media__1784540877146.png', dest: 'socials/jinju_tangopeople_thursday_milonga/poster.png', type: 'image/png' },
    { key: 'hongcamel', file: 'media__1784540986876.png', dest: 'socials/popup_ocho_hongcamel_20260719/poster.png', type: 'image/png' },
    { key: 'ochopractica', file: 'media__1784541075663.png', dest: 'socials/popup_ocho_practica_20260718/poster.png', type: 'image/png' },
    { key: 'ryu', file: 'media__1784541132949.png', dest: 'socials/v_manual_seoul_ryu/poster.png', type: 'image/png' },
    { key: 'novice', file: 'media__1784541300637.jpg', dest: 'socials/pista_tuesday_novice_practica/poster.jpg', type: 'image/jpeg' },
    { key: 'gangnam_milonga', file: 'media__1784541332877.png', dest: 'socials/gangnam_milonga_saturday/poster.png', type: 'image/png' },
    { key: 'onada_practica', file: 'media__1784541353638.png', dest: 'socials/daejeon_onada_friday_practica/poster.png', type: 'image/png' },
    { key: 'dooly_1', file: 'media__1784541402843.png', dest: 'socials/eltango_dooly_guide_practica/poster_1.png', type: 'image/png' },
    { key: 'dooly_2', file: 'media__1784541413816.png', dest: 'socials/eltango_dooly_guide_practica/poster_2.png', type: 'image/png' },
    { key: 'dooly_3', file: 'media__1784541419639.png', dest: 'socials/eltango_dooly_guide_practica/poster_3.png', type: 'image/png' },
    { key: 'vamos_juntos', file: 'media__1784541794884.png', dest: 'socials/practica_vamos_juntos_saturday/poster.png', type: 'image/png' },
    { key: 'conmigo_1', file: 'media__1784541845936.jpg', dest: 'socials/busan_ideal_conmigo_4th_saturday/poster_1.jpg', type: 'image/jpeg' },
    { key: 'conmigo_2', file: 'media__1784541849804.png', dest: 'socials/busan_ideal_conmigo_4th_saturday/poster_2.png', type: 'image/png' },
    { key: 'conmigo_3', file: 'media__1784541856246.png', dest: 'socials/busan_ideal_conmigo_4th_saturday/poster_3.png', type: 'image/png' },
    { key: 'mivida_4th', file: 'media__1784542068257.png', dest: 'socials/popup_gwangju_mivida_4th_night_20260912/poster.png', type: 'image/png' },
    { key: 'yeongdo', file: 'media__1784542170333.png', dest: 'socials/popup_yeongdodabang_12tangos_20260808/poster.png', type: 'image/png' }
  ];

  for (const img of imageUploads) {
    urlMap[img.key] = await uploadFile(img.file, img.dest, img.type);
  }

  // 3. 소셜 업데이트 및 신규 등록

  // (1) 엘땅고 오후 밀롱가 따르데
  console.log('Updating Tarde...');
  await db.collection('socials').doc('popup_eltango_tarde_20260624').set({
    title: 'Milonga Tarde',
    titleNative: '엘땅고 오후 밀롱가 따르데',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 3, // 수요일
    recurrence: 'every',
    startTime: '13:00',
    endTime: '16:00',
    venueId: '5Oe69tI6bxPWH41jEo9X',
    venueName: 'El Tango',
    venueNameNative: '엘땅고',
    price: '13,000 KRW',
    currency: 'KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.tarde,
    posterExportUrl: urlMap.tarde,
    djName: 'Juan',
    djNameNative: '후안',
    djs: [{ id: 'dj-juan-20260722', date: '2026-07-22', djName: 'Juan', djNameNative: '후안' }],
    organizerId: 'manual_yoomi',
    organizerName: 'Yoomi',
    organizerNameNative: '유미',
    description: "매주 수요일 오후 엘땅고에서 열리는 시원한 오후 밀롱가 따르데 (Milonga Tarde) 🏖\n\n• 일시: 매주 수요일 PM 1:00 ~ 4:00\n• DJ: 후안 (Juan)\n• Org: 유미 (Yoomi)\n• 장소: 엘땅고 (서초구 주흥길 12 2층)\n• 입장료: 13,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // (2) 제주 정기 토요 라인업 정비
  console.log('Setting up Jeju Saturday socials...');
  // 첫째주 화양연화
  await db.collection('socials').doc('jeju_hwayangyeonhwa_milonga').set({
    title: 'Hwayangyeonhwa Milonga',
    titleNative: '화양연화 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6,
    recurrence: '1st',
    startTime: '19:00',
    endTime: '22:00',
    venueId: 'weplay_stay',
    venueName: 'Weplay Stay',
    venueNameNative: '위플 스테이',
    city: 'JEJU',
    country: 'KR',
    djName: 'Polo',
    djNameNative: '폴로',
    organizerId: 'manual_jeju_hwayang',
    description: "제주 매달 첫째 주 토요일에 열리는 화양연화 밀롱가 🌸\n\n• 장소: 위플 스테이 (제주시 구좌읍 해맞이해안로 1098)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 셋째주 꼬밀 (꼬르띠나)
  await db.collection('socials').doc('jeju_despacio_cortina_milonga').set({
    title: 'Cortina Tango Milonga',
    titleNative: '꼬르띠나 밀롱가 (꼬밀)',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6,
    recurrence: '3rd',
    startTime: '19:00',
    endTime: '22:00',
    venueId: 'jeju_despacio',
    venueName: 'Despacio Studio',
    venueNameNative: '데스빠시오',
    city: 'JEJU',
    country: 'KR',
    imageUrl: urlMap.cortina_black,
    posterExportUrl: urlMap.cortina_black,
    imageUrls: [urlMap.cortina_black, urlMap.cortina_color],
    djName: 'Mameuro',
    djNameNative: '맘으로',
    djs: [{ id: 'dj-mameuro-20260718', date: '2026-07-18', djName: 'Mameuro', djNameNative: '맘으로' }],
    organizerId: 'manual_seborga_cielo',
    organizerName: 'Seborga & Cielo',
    organizerNameNative: '세보르가 y 시엘로',
    price: '10,000 KRW',
    description: "매달 셋째 주 토요일 데스빠시오 스튜디오에서 열리는 꼬르띠나 밀롱가 (꼬밀) 🎶\n\n• 일시: 7월 18일 (토) PM 7:00 ~ 10:00\n• DJ: 맘으로\n• Org: 세보르가, 시엘로\n• 장소: 데스빠시오 스튜디오 (함덕서4길 66)\n• 입장료: 10,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 넷째주 번개 연합밀
  await db.collection('socials').doc('jeju_union_milonga_4th_saturday').set({
    title: 'Jeju Union Milonga',
    titleNative: '제주 번개 연합 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6,
    recurrence: '4th',
    startTime: '19:00',
    endTime: '22:00',
    venueId: 'windstay_cafe',
    venueName: 'Windstay Cafe',
    venueNameNative: '윈드스테이 카페',
    city: 'JEJU',
    country: 'KR',
    description: "제주 매달 넷째 주 토요일, 각 오거들이 연합하여 개최하는 번개 연합 밀롱가 ⚡\n\n• 장소: 윈드스테이 카페 (제주시 한림읍 명재로 115)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // (3) 맛있는 라비오스
  console.log('Updating Labios...');
  await db.collection('socials').doc('YtCqTajwGHGCj31BQTyT').update({
    imageUrl: urlMap.labios,
    posterExportUrl: urlMap.labios,
    djName: 'Samaria',
    djNameNative: '사마리아',
    djs: [{ id: 'dj-samaria-20260717', date: '2026-07-17', djName: 'Samaria', djNameNative: '사마리아' }],
    description: "맛있는 밀롱가, 라비오스 (Milonga Labios) 🍷\n\n7월 17일 제헌절 공휴일을 맞아 평소보다 1시간 일찍 맛있는 음식과 함께 문을 엽니다! 몸보신과 입맛 돋우는 특선 한식/양식 메뉴가 준비되어 있습니다.\n\n• 일시: 7월 17일 (금) PM 7:00 ~ 11:00 (공휴일 조기 오픈)\n• DJ: 사마리아 (Samaria)\n• Org: 철환 (010-9472-6704)\n• 메뉴: 그린 샐러드, 명란 파스타, 삼계 리조또, 새콤달콤 냉국\n• 장소: 라 벤따나 (서울 마포구 잔다리로 48, 2층)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (4) 볼베르 밀롱가 정기 전환
  console.log('Updating Volver to regular...');
  await db.collection('socials').doc('popup_volver_20260628').set({
    title: 'Volver Milonga',
    titleNative: '볼베르 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 0,
    recurrence: '3rd,4th',
    startTime: '18:00',
    endTime: '22:00',
    venueId: 'en_paz_studio',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.volver,
    posterExportUrl: urlMap.volver,
    djName: 'Roca',
    djNameNative: '로카',
    djs: [
      { id: 'dj-roca-20260719', date: '2026-07-19', djName: 'Roca', djNameNative: '로카' },
      { id: 'dj-nakwhayusu-20260726', date: '2026-07-26', djName: 'Nakwhayusu', djNameNative: '낙화유수' }
    ],
    organizerId: 'manual_aron',
    organizerName: 'Aron',
    organizerNameNative: '아론',
    description: "매월 셋째, 넷째 일요일 저녁 엔빠스에서 열리는 볼베르 밀롱가 (Volver Milonga) 🚂\n\n• 일시: 매월 셋째, 넷째 일요일 PM 6:00 ~ 10:00\n• 7/19 DJ: 로카 (Roca)\n• 7/26 DJ: 낙화유수\n• Org: 아론 (Aron - 010.6281.8288)\n• 장소: 엔빠스 스튜디오 (교대역 B1)\n• 입장료: 13,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // (5) 러블리 밀롱가 7주년 파티
  console.log('Registering Lovely 7th Anniversary...');
  await db.collection('socials').doc('popup_lovely_7th_anniversary_20260912').set({
    title: 'Lovely Milonga 7th Anniversary Party',
    titleNative: '러블리밀롱가 7주년 파티',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-09-12T00:00:00+09:00')),
    startTime: '17:30',
    endTime: '21:30',
    venueId: '3XagPuu2bmBorzqMPNk3', // 실루엣
    venueName: 'Silhouette',
    venueNameNative: '실루엣',
    price: '15,000 KRW',
    currency: 'KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.lovely,
    posterExportUrl: urlMap.lovely,
    djName: 'Nero',
    djNameNative: '네로',
    djs: [{ id: 'dj-nero-20260912', date: '2026-09-12', djName: 'Nero', djNameNative: '네로' }],
    organizerId: 'manual_lovely_team',
    description: "함께 걸어온 지난 7년을 추억하며, 러블리밀롱가의 7주년 파티로 여러분을 초대합니다 👑\n\n• 일시: 9월 12일 (토) PM 5:30 ~ 9:30\n• DJ: 네로 (Nero)\n• 장소: 실루엣 (분당 정자동 지파크프라자 5층)\n• 예매: 15,000원 / 현매: 20,000원 (카뱅 3333-21-5422369 ㅅㅇㅇ)\n• 이벤트: 오픈마켓 (라파스 탱고웨어, 발리엔떼 탱고슈즈), 경품추첨, 푸짐한 먹거리와 와인 제공\n• 테이블 예약: 010.9921.4045",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (6) 잼스밀롱가
  console.log('Updating Jams Milonga...');
  await db.collection('socials').doc('jams_milonga').update({
    imageUrl: urlMap.jams,
    posterExportUrl: urlMap.jams,
    djName: 'Ani, Miroo, James',
    djNameNative: '애니, 밀어, 제임스',
    djs: [{ id: 'dj-trio-20260718', date: '2026-07-18', djName: 'Ani, Miroo, James', djNameNative: '애니, 밀어, 제임스' }],
    description: "매월 3주 토요일 저녁 엔빠스에서 열리는 잼스밀롱가 (Jam's Milonga) 🎧\n\n7월의 잼스밀롱가는 세 DJ의 각기 다른 개성과 감성이 담긴 자연스러운 선곡의 딴다가 펼쳐집니다.\n\n• 일시: 7월 18일 (토) PM 7:00 ~ 11:00\n• DJ: 애니, 밀어, 제임스 (3인 연합)\n• Org: 지니, 애니, 티나, 미달이, 봄날여우, 잭, 밀어, 여리, 제이, 티노, 제임스\n• 장소: 엔빠스 (서초구 반포대로30길 82 B1)\n• 입장료: 13,000원 (카카오뱅크 7979-11-31575 김선진)\n• 문의: 지니(bleuamour), 미달이(aylin2012), 봄날여우(elfi)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (7) 엘땅고 우나베스 정기 전환
  console.log('Updating Una Vez to regular...');
  await db.collection('socials').doc('popup_eltango_unavez_20260627').set({
    title: 'Una Vez Milonga',
    titleNative: '엘땅고 토요밀롱가 우나베스 (Una Vez)',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6,
    recurrence: 'every',
    startTime: '19:00',
    endTime: '23:00',
    venueId: '5Oe69tI6bxPWH41jEo9X',
    venueName: 'El Tango',
    venueNameNative: '엘땅고',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.unavez,
    posterExportUrl: urlMap.unavez,
    djName: 'Terius',
    djNameNative: '테리우스',
    djs: [{ id: 'dj-terius-20260718', date: '2026-07-18', djName: 'Terius', djNameNative: '테리우스' }],
    organizerId: 'manual_fish',
    organizerName: 'Fish',
    organizerNameNative: 'Fish',
    description: "매주 토요일 강남 핫플레이스 엘땅고에서 열리는 감성 토요밀롱가 우나베스 (Una Vez) ❤️\n\n• 일시: 7월 18일 (토) PM 7:00 ~ 11:00\n• DJ: 테리우스\n• Org: Fish\n• 장소: 엘땅고 (서초구 주흥길 12 2층)\n• 입장료: 13,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // (8) 피스타 심밀
  console.log('Updating Pista Night Milonga...');
  await db.collection('socials').doc('mWo82j5uPi2esEU6qvj6').update({
    imageUrl: urlMap.pistasimmil,
    posterExportUrl: urlMap.pistasimmil,
    djName: 'Henry',
    djNameNative: '헨리',
    djs: [{ id: 'dj-henry-20260718', date: '2026-07-18', djName: 'Henry', djNameNative: '헨리' }],
    description: "집에 가기 아쉬운 토요일 밤! 신청곡과 야식이 있는 피스타 심야 밀롱가 🌠\n\n맛있는 떡볶이와 엄선된 감성 선곡의 심야 딴다에 놀러오세요.\n\n• 일시: 매주 토요일 밤 11:00 ~ 일요일 새벽 5:00\n• DJ/오거/요리사: 헨리 (010-5730-0727)\n• 장소: 피스타 (서울 마포구 월드컵북로6길 49 B1)\n• 입장료: 13,000원 (더 피스타 참가자 및 4인 이상 단체: 10,000원)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (9) 라 멜로디아
  console.log('Registering La Melodia...');
  await db.collection('socials').doc('la_melodia_1st_3rd_sunday').set({
    title: 'La Melodia',
    titleNative: '라 멜로디아',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 0,
    recurrence: '1st,3rd',
    startTime: '19:00',
    endTime: '23:00',
    venueId: 'v_manual_seoul_andante', // 안단테
    venueName: 'Tango Andante',
    venueNameNative: '안단테',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.melodia,
    posterExportUrl: urlMap.melodia,
    djName: 'Cya',
    djNameNative: '샤',
    djs: [{ id: 'dj-cya-20260719', date: '2026-07-19', djName: 'Cya', djNameNative: '샤' }],
    organizerId: 'manual_melodian_handa',
    organizerName: 'Melodian & Handa',
    organizerNameNative: '멜로디언 y 한다',
    description: "매월 첫째, 셋째 일요일 안단테에서 열리는 아늑하고 편안한 밀롱가 라 멜로디아 (La Melodía) 🎶\n\n• 일시: 7월 19일 (일) PM 7:00 ~ 11:00\n• DJ: 샤 (Cya)\n• Org: 멜로디언, 한다\n• 장소: 안단테 (마포구 양화로12길 24 선진빌딩 B1)\n• 입장료: 13,000원\n• 테이블 예약: 카톡 (ski0001 / handa80)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (10) 안단테 오렌지 밀롱가
  console.log('Updating Orange Milonga...');
  await db.collection('socials').doc('EqZPQLbM3rDh1C3xdGLU').update({
    imageUrl: urlMap.orange,
    posterExportUrl: urlMap.orange,
    djName: 'Loca',
    djNameNative: '로카',
    djs: [{ id: 'dj-loca-20260721', date: '2026-07-21', djName: 'Loca', djNameNative: '로카' }],
    description: "매주 화요일 아름다운 호흡으로 채워지는 고혹적인 취미 생활, 오렌지 밀롱가 🧡\n\n• 일시: 7월 21일 (화) PM 7:30 ~ 12:00\n• DJ: 로카 (Ji Dong Hyeon Loca)\n• Org: 가이아 (GaEa Kim - 010.6373.6967)\n• 장소: 안단테 (마포구 양화로 12-gil 24 선진빌딩 B1)\n• 입장료: 13,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (11) 월요 루미노소
  console.log('Updating Monday Luminoso...');
  await db.collection('socials').doc('sMIEoUSmSRS9UwlxWzvp').update({
    imageUrl: urlMap.luminoso,
    posterExportUrl: urlMap.luminoso,
    djName: 'Sebastian',
    djNameNative: '세바스찬',
    djs: [{ id: 'dj-sebastian-20260720', date: '2026-07-20', djName: 'Sebastian', djNameNative: '세바스찬' }],
    description: "시원한 여름밤, 루미노소와 함께 탱고에 반해 보세요! 드레스 코드는 그린(GREEN)입니다 💚\n\n• 일시: 7월 20일 (월) PM 7:30 ~ 11:30\n• DJ: 세바스찬 (Sebastian)\n• Org: 트리스 (Tris)\n• 장소: 엔빠스 스튜디오 (반포대로30길 82 B1)\n• 테이블 예약: 카톡 hjkim0412 / Cyalu",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (12) 라라밀
  console.log('Registering Rara Mil...');
  await db.collection('socials').doc('popup_andante_raramil_20260731').set({
    title: 'Rara Mil',
    titleNative: '라라밀',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-31T00:00:00+09:00')),
    startTime: '20:00',
    endTime: '24:00',
    venueId: 'v_manual_seoul_andante', // 안단테
    venueName: 'Tango Andante',
    venueNameNative: '안단테',
    price: '13,000 KRW',
    currency: 'KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.raramil,
    posterExportUrl: urlMap.raramil,
    djName: 'Seethrough',
    djNameNative: '시스루',
    djs: [{ id: 'dj-seethrough-20260731', date: '2026-07-31', djName: 'Seethrough', djNameNative: '시스루' }],
    organizerId: 'manual_sarah',
    organizerName: 'Sarah Han',
    organizerNameNative: '사라',
    description: "7월 31일 마지막 금요일! 원타임 온리(One-time Only)!\n사라의 오랜 친구들과 함께하는 특별한 밀롱가 '라라밀'을 엽니다. 🩷🔥\n\n• 일시: 7월 31일 (금) PM 8:00 ~ 12:00\n• DJ: 시스루 (Seethrough)\n• Org: 사라 (Sarah)\n• 장소: 안단테 (Tango Andante)\n• 테이블 예약: 사라 (010.9602.2226)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (13) 강남 둘쎄
  console.log('Registering Gangnam Dulce...');
  await db.collection('socials').doc('dulce_milonga_gangnam_1st_sunday').set({
    title: 'Dulce Milonga Gangnam',
    titleNative: '강남 둘쎄 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 0,
    recurrence: '1st',
    startTime: '18:00',
    endTime: '22:00',
    venueId: 'KgPDeh5g1N53cdz3pnw1', // 탱고라이프
    venueName: 'Tango Life',
    venueNameNative: '탱고라이프',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.dulce_gangnam,
    posterExportUrl: urlMap.dulce_gangnam,
    djName: 'Kako & Taeky',
    djNameNative: 'Kako y 택이',
    djs: [{ id: 'dj-kako-taeky-20260802', date: '2026-08-02', djName: 'Kako & Taeky', djNameNative: 'Kako y 택이' }],
    organizerId: 'manual_hwangjin_nabom',
    organizerName: 'Hwangjin & Nabom',
    organizerNameNative: '황진 y 나봄',
    description: "매월 첫째 주 일요일 저녁 6시 강남 탱고라이프에서 열리는 강남 둘쎄 밀롱가 🌈\n\nLP판의 낭만 Kako(Japan)와 춤신의 음악 택이 두 분의 특별한 콜라보 디제잉이 여름밤을 설레게 할 것입니다.\n\n• 일시: 8월 2일 (일) PM 6:00 ~ 10:00\n• DJ: Kako (Japan) & 택이 (콜라보)\n• Org: 황진, 나봄\n• 장소: 강남 탱고라이프 (역삼로 109 SK허브젠 B1)\n• 입장료: 13,000원\n• 예약 및 문의: 010-3774-2949",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (14) 밀빠소 #002 실사 이미지 교체
  console.log('Updating Milpasso #002 image...');
  await db.collection('socials').doc('popup_milpasso_002_20260802').update({
    imageUrl: urlMap.milpasso,
    posterExportUrl: urlMap.milpasso,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (15) 화정 밀롱가
  console.log('Updating Hwajeong...');
  await db.collection('socials').doc('popup_hwajeong_20260623').update({
    imageUrl: urlMap.hwajeong,
    posterExportUrl: urlMap.hwajeong,
    djName: 'Yamjeon',
    djNameNative: '얌전',
    djs: [{ id: 'dj-yamjeon-20260721', date: '2026-07-21', djName: 'Yamjeon', djNameNative: '얌전' }],
    description: "매주 화요일 오나다에서 펼쳐지는 화정 밀롱가 (Hwajeong Milonga) 🌈\n\n장마 끝 무지개처럼 산뜻한 레인보우 드레스코드 파티로 아름다운 딴다를 준비했습니다.\n\n• 일시: 7월 21일 (화) PM 8:00 ~ 11:30\n• DJ: 얌전 (Yamjeon)\n• 장소: 오나다 (Tango O nada)\n• 입장료: 8천원 (10시 이후 5천원)\n• 드레스코드: 레인보우",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (16) 도라다 밀롱가
  console.log('Registering Dorada Milonga...');
  await db.collection('socials').doc('dorada_milonga_tuesday').set({
    title: 'Milonga Dorada',
    titleNative: '도라다 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 2,
    recurrence: 'every',
    startTime: '15:00',
    endTime: '17:00',
    venueId: 'KgPDeh5g1N53cdz3pnw1', // 탱고라이프
    venueName: 'Tango Life',
    venueNameNative: '탱고라이프',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.dorada,
    posterExportUrl: urlMap.dorada,
    djName: 'Special DJ',
    djNameNative: '스페셜 DJ',
    organizerId: 'manual_vero',
    organizerName: 'Vero',
    organizerNameNative: '베로',
    description: "매주 화요일 강남 탱고라이프에서 열리는 오후의 도라다 밀롱가 🥂\n\n7월 21일 화요일은 베로가 쏘는 '김치부침개 & 하이볼 스페셜 파티'와 함께 가성비 높은 탱고 워크숍도 준비되어 있습니다.\n\n• 일시: 매주 화요일 PM 3:00 ~ 5:00 (14:00~14:50 워크숍)\n• 참가비: 밀롱가만 13,000원 / 워크숍+밀롱가 패키지 20,000원\n• 장소: 강남 탱고라이프 (역삼로 109 SK허브젠 B1)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (17) 진주 밀롱가
  console.log('Updating Jinju Milonga...');
  await db.collection('socials').doc('jinju_tangopeople_thursday_milonga').update({
    imageUrl: urlMap.jinju,
    posterExportUrl: urlMap.jinju,
    djName: 'Huni',
    djNameNative: '훈이',
    djs: [{ id: 'dj-huni-20260723', date: '2026-07-23', djName: 'Huni', djNameNative: '훈이' }],
    description: "매주 목요일 저녁 338번째를 맞이하는 역사 깊은 진주밀롱가 (Jinju Milonga) 🏯\n\n• 일시: 7월 23일 (목) PM 8:00 ~ 11:00\n• DJ: 훈이 (Huni)\n• Org: 루팡 (Lupin - 010.2545.2499)\n• 장소: 진주 평거로 7, 3층 (탱고피플)\n• 입장료: 10,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (18) 홍까멜
  console.log('Registering Hong Camelia...');
  await db.collection('socials').doc('popup_ocho_hongcamel_20260719').set({
    title: 'Hong Camelia Milonga',
    titleNative: '홍까멜 까멜리아',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-19T00:00:00+09:00')),
    startTime: '19:00',
    endTime: '24:00',
    venueId: '3g6tN3z8bpLWH31jEo9X', // 오초
    venueName: 'Tango Club Ocho',
    venueNameNative: '클럽 오초',
    price: '13,000 KRW',
    currency: 'KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.hongcamel,
    posterExportUrl: urlMap.hongcamel,
    djName: 'Sangdam Sojang',
    djNameNative: '상담소장',
    djs: [{ id: 'dj-sangdamsojang-20260719', date: '2026-07-19', djName: 'Sangdam Sojang', djNameNative: '상담소장' }],
    organizerId: 'manual_carlos',
    organizerName: 'Carlos Lee',
    organizerNameNative: '까를로스',
    description: "7월 19일 일요일! 홍대 오초에서 열리는 특별 팝업 까멜리아 '홍까멜' 🌺\n아르헨티나 2026 월드컵 결승 진출을 기념하여 마스크팩 선착순 100명 증정 이벤트를 진행합니다. 오초로 놀러오세요!\n\n• 일시: 7월 19일 (일) PM 7:00 ~ 자정\n• DJ: 상담소장 (Sangdam Sojang)\n• Org: 까를로스 (Carlos)\n• 장소: 클럽 오초 (Tango Club Ocho - 마포구 월드컵북로2길 57 B1)\n• 문의: 까를로스 (카톡 ID: tanguerocarlos)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (19) 오초 토요 쁘락 번개
  console.log('Registering Ocho Saturday Practica...');
  await db.collection('socials').doc('popup_ocho_practica_20260718').set({
    title: 'Ocho Saturday Practica Lightning',
    titleNative: '오초 토요 쁘락 번개 (놀지말고 쁘락)',
    type: 'popup',
    subCategory: 'practica',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-18T00:00:00+09:00')),
    startTime: '17:30',
    endTime: '21:00',
    venueId: '3g6tN3z8bpLWH31jEo9X', // 오초
    venueName: 'Tango Club Ocho',
    venueNameNative: '클럽 오초',
    price: '10,000 KRW',
    currency: 'KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.ochopractica,
    posterExportUrl: urlMap.ochopractica,
    staff: ['Carlos Churri Lee'],
    organizerId: 'manual_carlos',
    organizerName: 'Carlos Lee',
    organizerNameNative: '까를로스',
    description: "7월 18일 토요일 5:30~9:00 pm 오초 스튜디오에서 진행되는 “밀롱게로를 위한 쁘락 번개” (놀지말고 쁘락!) ⚡\n\n• 일시: 7월 18일 (토) PM 5:30 ~ 9:00\n• 쁘락지기: 까를로스 (Carlos Churri Lee - 경력 26년)\n• 내용: 7:30부터 아브라쏘 뽀르떼뇨에 대한 설명과 실습 2탄 진행\n• 대상: 탱고 경력 5년 이상 추천\n• 장소: 오초 스튜디오 (Studio Ocho)\n• 입장료: 10,000원\n• 문의: 카톡 id - tanguerocarlos",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (20) 류 쁘락띠까
  console.log('Updating Ryu Practica...');
  await db.collection('socials').doc('9oYPncz9AwkWJdLSi3cC').update({
    imageUrl: urlMap.ryu,
    posterExportUrl: urlMap.ryu,
    staff: ['마노', '빠로', '카이사르', '케이', '류가'],
    description: "매주 월요일 저녁 홍대 류스튜디오에서 열리는 류 쁘락띠까 (RYU PRACTICA) 🎻\n\n• 일시: 매주 월요일 PM 7:20 ~ 9:50\n• 쁘락지기: 마노, 빠로, 카이사르, 케이, 류가\n• 장소: 류스튜디오 (동교로 266 4층, 역전할맥 건물)\n• 탱고를 추면서 불편한 부분이 있다면 언제든 쁘락지기들과 세심하게 상의해보세요!",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (21) 피스타 화요 밤 노비스 쁘락띠까
  console.log('Registering Pista Tuesday Novice Practica...');
  await db.collection('socials').doc('pista_tuesday_novice_practica').set({
    title: 'Novice Tuesday Night Practica',
    titleNative: '화요일 밤 노비스 쁘락띠까',
    type: 'regular',
    subCategory: 'practica',
    dayOfWeek: 2,
    recurrence: 'every',
    startTime: '18:00',
    endTime: '02:00',
    venueId: 'pista', // 피스타
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    price: '10,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.novice,
    posterExportUrl: urlMap.novice,
    staff: ['Novice'],
    organizerId: 'manual_novice',
    organizerName: 'Novice',
    description: "매주 화요일 밤 피스타에서 열리는 노비스의 자유 쁘락띠까 (가이드 없는 자유 쁘락!) 🌠\n\n• 일시: 매주 화요일 PM 6:00 ~ 익일 새벽 2:00\n• 쁘락지기: 노비스 (Novice)\n• 혜택: 화요 쁘락 참석 시 수요일 '아브라쏘 밀롱가' 무료 입장 티켓 증정!\n• 장소: 피스타 (마포구 월드컵북로6길 49 B1)\n• 입장료: 10,000원 (밤 10시 이후 5,000원)\n• 문의: 010-4941-1287",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (22) 강남 밀롱가
  console.log('Registering Gangnam Milonga...');
  await db.collection('socials').doc('gangnam_milonga_saturday').set({
    title: 'Gangnam Milonga',
    titleNative: '강남 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6,
    recurrence: 'every',
    startTime: '18:30',
    endTime: '22:30',
    venueId: 'KgPDeh5g1N53cdz3pnw1', // 탱고라이프
    venueName: 'Tango Life',
    venueNameNative: '탱고라이프',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.gangnam_milonga,
    posterExportUrl: urlMap.gangnam_milonga,
    djName: 'Kogsan',
    djNameNative: '곡산',
    djs: [{ id: 'dj-kogsan-20260725', date: '2026-07-25', djName: 'Kogsan', djNameNative: '곡산' }],
    organizerId: 'manual_kogsan',
    organizerName: 'Kogsan',
    organizerNameNative: '곡산',
    description: "매주 토요일 밤, 탱고마스터 Julian & Natalia 와 함께하는 강남 밀롱가 💃\n\n밀롱가 부에노스아이레스가 강남 밀롱가로 새롭게 복귀하여 마스터가 상주하며 교류하는 특별한 시간을 만듭니다.\n\n• 일시: 매주 토요일 PM 6:30 ~ 10:30 (18:30 자율쁘락, 19:00 밀롱가 시작)\n• 7/25 DJ: 곡산 (Kogsan)\n• 장소: 강남 탱고라이프 (역삼로 109 SK허브젠 B1)\n• 입장료: 13,000원 (카드 결제 환영)\n• 예약: 010-9772-4990",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (23) 대전 오나다 금요 쁘락데이
  console.log('Registering Daejeon Onada Friday Practica...');
  await db.collection('socials').doc('daejeon_onada_friday_practica').set({
    title: 'Daejeon Onada Friday Practica',
    titleNative: '대전 오나다 금요 쁘락데이',
    type: 'regular',
    subCategory: 'practica',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '20:00',
    endTime: '24:30',
    venueId: 'daejeon_onada',
    venueName: 'Daejeon Onada',
    venueNameNative: '대전 오나다',
    price: '15,000 KRW',
    city: 'DAEJEON',
    country: 'KR',
    imageUrl: urlMap.onada_practica,
    posterExportUrl: urlMap.onada_practica,
    djName: 'Yunsik',
    djNameNative: '윤식',
    djs: [{ id: 'dj-yunsik-20260724', date: '2026-07-24', djName: 'Yunsik', djNameNative: '윤식' }],
    organizerId: 'manual_sonchanghwan',
    organizerName: 'Changhwan Son',
    organizerNameNative: '손창환',
    description: "매주 금요일 대전 오나다에서 펼쳐지는 가이드 쁘락 & 쁘락밀 🎻\n\n• 일시: 매주 금요일 PM 8:00 ~ 9:30 가이드 쁘락 / PM 9:30 ~ 12:30 쁘락밀롱가\n• DJ: 윤식 (Yunsik)\n• Org: 손창환 (010-9472-6704)\n• 참가비: 8시부터 풀타임 15,000원 / 9:30부터 쁘락밀만 10,000원\n• 장소: 대전 오나다 (서구 갈마동 343-30 B1)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (24) 둘리 가이드 쁘락 (복수 이미지)
  console.log('Registering Dooly Guide Practica...');
  await db.collection('socials').doc('eltango_dooly_guide_practica').set({
    title: 'Dooly Guide Practica',
    titleNative: '둘리 가이드 쁘락',
    type: 'regular',
    subCategory: 'practica',
    dayOfWeek: 0,
    recurrence: 'every',
    startTime: '11:00',
    endTime: '14:00',
    venueId: '5Oe69tI6bxPWH41jEo9X', // 엘땅고
    venueName: 'El Tango',
    venueNameNative: '엘땅고',
    price: '20,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.dooly_1,
    posterExportUrl: urlMap.dooly_1,
    imageUrls: [urlMap.dooly_1, urlMap.dooly_2, urlMap.dooly_3],
    staff: ['Dulce', 'Leo'],
    organizerId: 'manual_dulce_leo',
    organizerName: 'Dulce & Leo',
    organizerNameNative: '둘쎄 y 레오',
    description: "매주 일요일 오전 엘땅고에서 펼쳐지는 둘쎄와 레오의 가이드 쁘락 🎻\n\n파트너가 없어도, 혼자 오셔도 각자의 속도에 맞춰 연습과 피드백을 받을 수 있습니다.\n\n• 일시: 매주 일요일 AM 11:00 ~ PM 2:00\n• 쁘락지기: 둘쎄, 레오 (Dulce & Leo)\n• 구성: 자율 쁘락 + 미니 클래스 + 일대일 피드백\n• 장소: 엘땅고 (주흥길 12 2층)\n• 비용: 당일 현장 20,000원 / 1달(4회) 60,000원 / 2달(8회) 100,000원\n• 문의: 010-5162-2325 (둘쎄)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (25) 쁘락 바모스 훈또스
  console.log('Registering Vamos Juntos Practica...');
  await db.collection('socials').doc('practica_vamos_juntos_saturday').set({
    title: 'Vamos Juntos Practica',
    titleNative: '쁘락 바모스 훈또스',
    type: 'regular',
    subCategory: 'practica',
    dayOfWeek: 6,
    recurrence: 'every',
    startTime: '13:00',
    endTime: '17:00',
    venueId: '3g6tN3z8bpLWH31jEo9X', // 오초
    venueName: 'Tango Club Ocho',
    venueNameNative: '클럽 오초',
    price: '10,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.vamos_juntos,
    posterExportUrl: urlMap.vamos_juntos,
    staff: ['Mei', 'Cine', 'Nuria'],
    organizerId: 'manual_vamos_juntos',
    organizerName: 'Vamos Juntos',
    organizerNameNative: '바모스 훈또스',
    description: "매주 토요일 서울 최장 시간인 4시간 대관 쁘락띠까 바모스 훈또스 💜\n\n7월 25일 토요일은 특별 게스트를 초대하여 PM 2:00에 쁘락 연습 노하우 가이드 팁 설명회(약 70분)를 무료로 진행합니다.\n\n• 일시: 매주 토요일 PM 1:00 ~ 5:00\n• 쁘락지킴이: 씨네(010-2768-6637), 누리아(010-8635-9539), 메이(010-2176-7293)\n• 장소: 스튜디오 오초 (홍대입구역 2번출구)\n• 입장료: 10,000원 (4시간 이용)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (26) 부산 꼰미고 낮밀롱가
  console.log('Registering Milonga Conmigo...');
  await db.collection('socials').doc('busan_ideal_conmigo_4th_saturday').set({
    title: 'Milonga Conmigo',
    titleNative: '밀롱가 꼰미고',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6,
    recurrence: '4th',
    startTime: '14:30',
    endTime: '18:30',
    venueId: 'busan_ideal',
    venueName: 'Busan Ideal',
    venueNameNative: '부산 이데알',
    price: '13,000 KRW',
    city: 'BUSAN',
    country: 'KR',
    imageUrl: urlMap.conmigo_1,
    posterExportUrl: urlMap.conmigo_1,
    imageUrls: [urlMap.conmigo_1, urlMap.conmigo_2, urlMap.conmigo_3],
    staff: ['열매', '민설', '바비'],
    organizerId: 'manual_yanghwanhee',
    organizerName: 'Hwanhee Yang',
    organizerNameNative: '양환희',
    description: "매월 넷째 주 토요일 낮, 부산 이데알 탱고바에서 열리는 낮밀롱가 꼰미고 (Milonga Conmigo) ☀️\n\n따뜻한 분위기와 뜨거운 론다를 만드는 미녀 삼총사(열매, 민설, 바비) 스태프들이 여러분을 기다립니다.\n\n• 일시: 매월 넷째 주 토요일 PM 2:30 ~ 6:30 (7/25 첫 오픈 파티!)\n• 스태프: 열매, 민설, 바비\n• Org: 양환희\n• 장소: 부산 이데알 (부에노스 아이레스 탱고 카페 이데알)\n• 입장료: 13,000원",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (27) 광주 미비다 4주년 파티
  console.log('Registering Gwangju Mivida 4th Anniversary...');
  // 토요일 밤파티
  await db.collection('socials').doc('popup_gwangju_mivida_4th_night_20260912').set({
    title: 'Gwangju Mivida 4th Anniversary Night Party',
    titleNative: '광주 미비다 탱고 4주년 토요 밤파티',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-09-12T00:00:00+09:00')),
    startTime: '21:00',
    endTime: '02:00',
    venueId: 'gwangju_mivida',
    venueName: 'Mivida Tango Studio',
    venueNameNative: '미비다 탱고 스튜디오',
    city: 'GWANGJU',
    country: 'KR',
    imageUrl: urlMap.mivida_4th,
    posterExportUrl: urlMap.mivida_4th,
    djName: 'STONE',
    djNameNative: '스톤',
    djs: [{ id: 'dj-stone-20260912', date: '2026-09-12', djName: 'STONE', djNameNative: '스톤' }],
    organizerId: 'manual_mivida_studio',
    description: "광주 미비다 탱고 스튜디오 4주년 토요 밤파티 🥂\n\n• 일시: 9월 12일 (토) PM 9:00 ~ 익일 새벽 2:00\n• DJ: 스톤 (STONE)\n• 장소: 미비다 탱고 스튜디오 (광주 동구 중앙로 162-1 공차건물 5층)\n• 예매 링크: https://forms.gle/8U6kgnfx7eG8Hjdz9",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 일요일 낮파티
  await db.collection('socials').doc('popup_gwangju_mivida_4th_day_20260913').set({
    title: 'Gwangju Mivida 4th Anniversary Day Party',
    titleNative: '광주 미비다 탱고 4주년 일요 낮파티',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-09-13T00:00:00+09:00')),
    startTime: '13:00',
    endTime: '18:00',
    venueId: 'gwangju_mivida',
    venueName: 'Mivida Tango Studio',
    venueNameNative: '미비다 탱고 스튜디오',
    city: 'GWANGJU',
    country: 'KR',
    imageUrl: urlMap.mivida_4th,
    posterExportUrl: urlMap.mivida_4th,
    djName: 'NACHO',
    djNameNative: '나초',
    djs: [{ id: 'dj-nacho-20260913', date: '2026-09-13', djName: 'NACHO', djNameNative: '나초' }],
    organizerId: 'manual_mivida_studio',
    description: "광주 미비다 탱고 스튜디오 4주년 일요 낮파티 ☀️\n\n• 일시: 9월 13일 (일) PM 1:00 ~ 6:00\n• DJ: 나초 (NACHO)\n• 장소: 미비다 탱고 스튜디오 (광주 동구 중앙로 162-1 공차건물 5층)\n• 예매 링크: https://forms.gle/8U6kgnfx7eG8Hjdz9",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (28) 영도문화살롱
  console.log('Registering Yeongdo Cultural Salon...');
  await db.collection('socials').doc('popup_yeongdodabang_12tangos_20260808').set({
    title: '12 Tangos 12 Stories (Yeongdo Cultural Salon)',
    titleNative: '12곡의 탱고 12개의 이야기 (영도문화살롱)',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-08-08T00:00:00+09:00')),
    startTime: '17:00',
    endTime: '19:00',
    venueId: 'yeongdo_dabang',
    venueName: 'Yeongdo Dabang',
    venueNameNative: '영도다방',
    price: '20,000 KRW',
    currency: 'KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.yeongdo,
    posterExportUrl: urlMap.yeongdo,
    djName: 'Ahn Hyungsoo (Guitar)',
    djNameNative: '안형수 (기타)',
    djs: [{ id: 'dj-ahn-20260808', date: '2026-08-08', djName: 'Ahn Hyungsoo (Guitar)', djNameNative: '안형수 (기타)' }],
    organizerId: 'manual_leeseungeun',
    organizerName: 'Seungeun Lee',
    organizerNameNative: '이승은',
    description: "기타로 듣는 12곡의 탱고와 12개의 탱고 이야기, 그리고 춤이 함께하는 특별 팝업 영도문화살롱 ☕\n\n• 일시: 8월 8일 (토) 오후 5:00 ~ 7:00\n• 기타: 안형수 / 이야기: 이승은\n• 장소: 영도다방 (마포구 독막로 176 지하1층, 광흥창역 4번출구)\n• 참가인원: 20명 제한\n• 참가비: 20,000원 (맥주/음료 1병 포함)\n• 예약입금: 국민은행 035801-04-222881 (이승은)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (29) 엔빠스 화요 쁘락지기 반달이 업데이트
  console.log('Updating En Paz Tuesday Practica...');
  await db.collection('socials').doc('en_paz_tuesday_practica').update({
    staff: ['반달이'],
    description: "매주 화요일 오후 엔빠스 스튜디오에서 자유롭게 연습하고 교류하는 화엔쁘락 ☕\n\n• 일시: 매주 화요일 PM 2:00 ~ 5:00\n• 쁘락지기: 반달이\n• 쁘락비: 10,000원\n• 문의: 카톡 HomoLudensDall\n• 장소: 엔빠스 스튜디오 (반포대로30길 82 B1)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (30) 엔빠스 수요일 카멜리아 DJ H.Jun 업데이트
  console.log('Updating Camelia Wednesday DJ...');
  const camRef = db.collection('socials').doc('n4MioMSdxqnA3CVfX53N');
  const camSnap = await camRef.get();
  if (camSnap.exists) {
    let camDjs = camSnap.data().djs || [];
    const hjunDj = { id: 'dj-hjun-20260722', date: '2026-07-22', djName: 'H.Jun', djNameNative: 'H형준' };
    const hIdx = camDjs.findIndex(d => d.date === '2026-07-22');
    if (hIdx >= 0) camDjs[hIdx] = hjunDj;
    else camDjs.push(hjunDj);
    await camRef.update({
      djs: camDjs,
      djName: 'H.Jun',
      djNameNative: 'H형준',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // (31) 엔빠스 금요 쁘락띠까 신규 regular 등록
  console.log('Registering En Paz Friday Practica...');
  await db.collection('socials').doc('en_paz_friday_practica').set({
    title: 'En Paz Friday Practica',
    titleNative: '금요쁘락',
    type: 'regular',
    subCategory: 'practica',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '14:00',
    endTime: '17:00',
    venueId: 'en_paz_studio',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    price: '10,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    staff: ['아란', '향연'],
    organizerId: 'manual_enpaz_team',
    description: "매주 금요일 오후 엔빠스 스튜디오에서 진행되는 금요쁘락 ☕\n\n• 일시: 매주 금요일 PM 2:00 ~ 5:00\n• 쁘락지기: 아란 & 향연\n• 쁘락비: 10,000원\n• 문의: 카톡 Vidamia1",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (32) 엔빠스 금요일 비다미아 신규 regular 등록
  console.log('Registering Vida Mia Milonga...');
  await db.collection('socials').doc('en_paz_vidamia_friday_milonga').set({
    title: 'Vida Mia Milonga',
    titleNative: '비다미아',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '19:00',
    endTime: '23:00',
    venueId: 'en_paz_studio',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    price: '15,000 KRW', // 또는 기본
    city: 'SEOUL',
    country: 'KR',
    djName: 'Anna',
    djNameNative: '안나(부산)',
    djs: [{ id: 'dj-anna-20260724', date: '2026-07-24', djName: 'Anna', djNameNative: '안나(부산)' }],
    organizerId: 'manual_aron',
    organizerName: 'Aron',
    organizerNameNative: '아론',
    description: "매주 금요일 저녁 엔빠스에서 열리는 품격 있는 밀롱가 비다미아 (Vida Mia) 🌹\n\n• 일시: 매주 금요일 PM 7:00 ~ 11:00\n• 7/24 DJ: 안나(부산) (Anna)\n• Org: 아론 (Aron)\n• 예약: 카톡 Vidamia1\n• 장소: 엔빠스 스튜디오 (교대역 B1)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // (33) 엔빠스 토요일 사베리밀 팝업 등록
  console.log('Registering Saveri Mil...');
  await db.collection('socials').doc('popup_enpaz_saverimil_20260725').set({
    title: 'Saveri Mil',
    titleNative: '사베리밀',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-25T00:00:00+09:00')),
    startTime: '19:00',
    endTime: '23:00',
    venueId: 'en_paz_studio',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KR',
    djName: 'Isabel',
    djNameNative: '이사벨',
    djs: [{ id: 'dj-isabel-20260725', date: '2026-07-25', djName: 'Isabel', djNameNative: '이사벨' }],
    organizerId: 'manual_isabel',
    organizerName: 'Isabel',
    organizerNameNative: '이사벨',
    description: "7월 25일 토요일 저녁 엔빠스에서 열리는 사베리밀 (Saveri Mil) 🎵\n\n• 일시: 7월 25일 (토) PM 7:00 ~ 11:00\n• DJ: 이사벨 (Isabel)\n• Org: 이사벨 (Isabel)\n• 예약: 010-8850-6520\n• 장소: 엔빠스 스튜디오 (교대역 B1)",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('=== BATCH SOCIALS UPDATE 2 COMPLETED SUCCESSFULLY ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
