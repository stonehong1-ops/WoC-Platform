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
  console.log('=== STARTING MASTER BATCH SOCIAL UPDATES ===');

  // 1. 제주 데스빠시오 스튜디오 장소 신규 등록
  console.log('Registering Jeju Despacio venue...');
  await db.collection('venues').doc('jeju_despacio').set({
    name: 'Despacio',
    nameNative: '데스빠시오',
    city: 'JEJU',
    country: 'KR',
    address: '제주 제주시 함덕서 4길 66',
    createdAt: admin.firestore.Timestamp.now()
  });

  // 2. 제주 한여름 밤의 밀롱가 (U4jzKx156mQwevPfT1B8) 업데이트
  console.log('Updating Jeju Midsummer Night...');
  const summerUrl = await uploadFile('media__1784021203698.png', 'socials/U4jzKx156mQwevPfT1B8/poster_20260725.png', 'image/png');
  const oDoc = await db.collection('socials').doc('U4jzKx156mQwevPfT1B8').get();
  let oDjs = oDoc.data().djs || [];
  const oIdx = oDjs.findIndex(d => d.date === '2026-07-25');
  const targetODj = { id: 'dj-polo-20260725', date: '2026-07-25', djName: 'Polo', djNameNative: '폴로' };
  if (oIdx >= 0) oDjs[oIdx] = targetODj; else oDjs.push(targetODj);
  await db.collection('socials').doc('U4jzKx156mQwevPfT1B8').update({
    imageUrl: summerUrl,
    posterExportUrl: summerUrl,
    djName: 'Polo',
    djNameNative: '폴로',
    djs: oDjs,
    description: "7월 25일 탱고올레 한여름 밤의 밀롱가 🌸\n좋은 음악, 좋은 사람, 그리고 행복한 탱고가 기다립니다. 제주 연동 탱고올레에서 만나요!\n\n• 일시: 7월 25일 (토) 오후 7:00 ~ 10:00\n• DJ / Org: 폴로 (Polo)\n• 장소: 탱고올레 스튜디오 (제주시 연동 260-25 위플 스테이 2층)\n• 입장료: 10,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. 제주 데스빠시오 꼬르띠나 밀롱가 신규 생성
  console.log('Registering Jeju Cortina Milonga...');
  const cortinaUrl = await uploadFile('media__1784021219993.png', 'socials/jeju_despacio_cortina_milonga/poster.png', 'image/png');
  await db.collection('socials').doc('jeju_despacio_cortina_milonga').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Cortina Tango Milonga',
    titleNative: '꼬르띠나 밀롱가',
    venueId: 'jeju_despacio',
    venueName: 'Despacio',
    venueNameNative: '데스빠시오',
    startTime: '19:00',
    endTime: '22:00',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-18T00:00:00+09:00')),
    djName: 'Mamuro',
    djNameNative: '맘으로',
    djs: [{ id: 'dj-mamuro-20260718', date: '2026-07-18', djName: 'Mamuro', djNameNative: '맘으로' }],
    organizerId: 'manual_cielo',
    organizerName: 'Cielo',
    organizerNameNative: '세보르가 시엘로',
    organizerIds: ['manual_cielo'],
    organizerNames: ['Cielo'],
    organizerNativeNames: ['세보르가 시엘로'],
    price: '10,000 KRW',
    country: 'KR',
    city: 'JEJU',
    imageUrl: cortinaUrl,
    posterExportUrl: cortinaUrl,
    description: "제주 데스빠시오 꼬르띠나 밀롱가 (Cortina Tango Milonga) 🌛\n제주에 나들이 오시는 분들 꼭 들려보세요!\n\n• 일시: 2026년 7월 18일 (토) PM 7:00 ~ 10:00\n• DJ: 맘으로\n• Org: 세보르가 시엘로 (Cielo)\n• 장소: 데스빠시오 (제주시 함덕서 4길 66)\n• 입장료: 10,000원\n• 문의: 010-3311-8108 (김성)",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 4. JB 밀롱가 #24 (jbQUuFFZpv2Jsi81mhAN) 업데이트
  console.log('Updating JB Milonga #24...');
  const jbUrl = await uploadFile('media__1784021258962.jpg', 'socials/jbQUuFFZpv2Jsi81mhAN/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('jbQUuFFZpv2Jsi81mhAN').update({
    imageUrl: jbUrl,
    posterExportUrl: jbUrl,
    titleNative: 'JB 밀롱가 #24',
    title: 'JB Milonga #24',
    startTime: '18:30',
    endTime: '22:30',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-18T00:00:00+09:00')),
    djName: 'Miroo',
    djNameNative: '밀어',
    djs: [{ id: 'dj-miroo-20260718', date: '2026-07-18', djName: 'Miroo', djNameNative: '밀어' }],
    organizerId: 'manual_junchi_boonie',
    organizerName: 'Junchi & Boonie',
    organizerNameNative: '준치 & 버니',
    organizerIds: ['manual_junchi', 'manual_boonie'],
    organizerNames: ['Junchi', 'Boonie'],
    organizerNativeNames: ['준치', '버니'],
    price: '13,000 KRW',
    description: "JB 밀롱가 24번째 소식 🌸\nJBmilonga 안에서는 누구라도 반가운 친구로서 인사 나눴으면 해요. 이번 7월에는 특별한 게스트 Nishimura의 방문 소식이 있습니다! 따뜻한 미소로 반겨주세요.\n\n• 일시: 7월 18일 (토) PM 6:30 ~ 10:30\n• DJ: 밀어 (Miroo)\n• Org: 준치 & 버니 (Junchi & Boonie)\n• 장소: 탱고 마젠타 (Tango Magenta - 서울 강남구 선릉로 709 B1)\n• 입장료: 13,000원\n• 문의: 010-4949-5600",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 5. 토이프 밀롱가 (RcwxqCMwdSX5oABMNJeH) 7월 11일 업데이트
  console.log('Updating IF Milonga (Sat)...');
  const ifUrl = await uploadFile('media__1784021306808.png', 'socials/RcwxqCMwdSX5oABMNJeH/poster_20260711.png', 'image/png');
  const ifDoc = await db.collection('socials').doc('RcwxqCMwdSX5oABMNJeH').get();
  let ifDjs = ifDoc.data().djs || [];
  const ifIdx = ifDjs.findIndex(d => d.date === '2026-07-11');
  const targetIfDj = { id: 'dj-hernan-20260711', date: '2026-07-11', djName: 'Hernan', djNameNative: '에르난' };
  if (ifIdx >= 0) ifDjs[ifIdx] = targetIfDj; else ifDjs.push(targetIfDj);
  await db.collection('socials').doc('RcwxqCMwdSX5oABMNJeH').update({
    imageUrl: ifUrl,
    posterExportUrl: ifUrl,
    djName: 'Hernan',
    djNameNative: '에르난',
    djs: ifDjs,
    description: "토이프 밀롱가 (IF Milonga) 🩵\n멋진 디제이 에르난님과 오랜만에 함께하는 토이프의 특별한 토요일 밤!\n\n• 일시: 매주 토요일 PM 2:00 ~ 6:00 (7월 11일 일정)\n• DJ: 에르난 (Hernan)\n• Org: 이프 (010-8030-6833)\n• 장소: 탱고클럽 오초 (Tango Club Ocho - 서울 마포구)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 6. 오초낮밀 스페셜 오렌지 밀롱가 신규 생성
  console.log('Registering Ocho Special Orange Milonga...');
  const orangeOchoUrl = await uploadFile('media__1784021341727.png', 'socials/popup_ocho_orange_20260717/poster.png', 'image/png');
  await db.collection('socials').doc('popup_ocho_orange_20260717').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Ocho Afternoon Special Orange Milonga',
    titleNative: '오초낮밀 스페셜 오렌지 밀롱가',
    venueId: '6Z5SuLBNSGZezwBgJ5r0',
    venueName: 'Ocho',
    venueNameNative: '오초',
    startTime: '14:00',
    endTime: '18:00',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-17T00:00:00+09:00')),
    djName: 'Hernan',
    djNameNative: '에르난',
    djs: [{ id: 'dj-hernan-20260717', date: '2026-07-17', djName: 'Hernan', djNameNative: '에르난' }],
    organizerId: 'manual_gaeakim',
    organizerName: 'GaEa Kim',
    organizerNameNative: '가이아',
    organizerIds: ['manual_gaeakim'],
    organizerNames: ['GaEa Kim'],
    organizerNativeNames: ['가이아'],
    price: '13,000 KRW',
    country: 'KR',
    city: 'SEOUL',
    imageUrl: orangeOchoUrl,
    posterExportUrl: orangeOchoUrl,
    description: "오초낮밀 스페셜 오렌지 밀롱가 🍊 데이트를 신청합니다!\n오직 우리만의 탱고를 그리는 공간, 달달하고 뜨겁게 포옹하는 오렌지밀에서 만나요!\n이벤트 협찬: 춘천탱고마라톤 풀팩 1명 추첨 🎁\n\n• 일시: 7월 17일 (금요일 공휴일) PM 2:00 ~ 6:00\n• DJ: 에르난 (Hernan)\n• Org: 가이아 (GaEa - 010.6373.6967)\n• 장소: 탱고클럽 오초 (Tango Club Ocho)\n• 입장료: 13,000원",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 7. 밀빠소 #002 신규 생성
  console.log('Registering MILPASSO #002...');
  const milpassoUrl = await uploadFile('media__1784021371034.png', 'socials/popup_milpasso_002_20260802/poster.png', 'image/png');
  await db.collection('socials').doc('popup_milpasso_002_20260802').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'MILPASSO #002',
    titleNative: '밀빠소 #002',
    venueId: 'KeCXdyVnLyUMwhsMqR6dDPi2tZy2',
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    startTime: '14:00',
    endTime: '18:00',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-08-02T00:00:00+09:00')),
    djName: 'Henry',
    djNameNative: '헨리',
    djs: [{ id: 'dj-henry-20260802', date: '2026-08-02', djName: 'Henry', djNameNative: '헨리' }],
    organizerId: 'manual_ian',
    organizerName: 'Ian',
    organizerNameNative: '이안',
    organizerIds: ['manual_ian'],
    organizerNames: ['Ian'],
    organizerNativeNames: ['이안'],
    price: '13,000 KRW',
    country: 'KOREA',
    city: 'SEOUL',
    imageUrl: milpassoUrl,
    posterExportUrl: milpassoUrl,
    description: "밀빠소 #002 (MILPASSO #002) 🌟\nMILPASSO는 다시 찾고 싶은 경험을 만듭니다. More Than Tango!\n• EVENT: 라이브 공연, 레이디스 까베세오, 밀빠소 서프라이즈, SNS 후기 이벤트, 포토존\n\n• 일시: 2026년 8월 2일 (일) PM 2:00 ~ 6:00\n• DJ: 헨리 (Henry)\n• Org: 이안 (Ian - 010.5365.7894)\n• 장소: 홍대 피스타 (Tango Pista - 서울 마포구 월드컵북로6길 49 B1)\n• 입장료: 13,000원",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 8. 비비밀 (69W8ZzKMol1EQt5DCwZQ) 업데이트
  console.log('Updating Vivimil...');
  const viviUrl = await uploadFile('media__1784021397017.jpg', 'socials/69W8ZzKMol1EQt5DCwZQ/poster_20260719.jpg', 'image/jpeg');
  const viviDoc = await db.collection('socials').doc('69W8ZzKMol1EQt5DCwZQ').get();
  let viviDjs = viviDoc.data().djs || [];
  const viviIdx = viviDjs.findIndex(d => d.date === '2026-07-19');
  const targetViviDj = { id: 'dj-vivian-20260719', date: '2026-07-19', djName: 'Vivian', djNameNative: '비비안' };
  if (viviIdx >= 0) viviDjs[viviIdx] = targetViviDj; else viviDjs.push(targetViviDj);
  await db.collection('socials').doc('69W8ZzKMol1EQt5DCwZQ').update({
    imageUrl: viviUrl,
    posterExportUrl: viviUrl,
    djName: 'Vivian',
    djNameNative: '비비안',
    djs: viviDjs,
    description: "비비밀 (Vivimil) 7월 파티 🐾 (7월에만 6시 시작!)\n전통탱고 동작 중에 가장 재밌는 '바리다(Barrida) 컨버세이션' 무료 강습 진행 완료!\n\n• 일시: 7월 19일 (일) PM 6:00 ~ 10:00\n  - PM 5:00 ~ 6:00: Barrida 리딩 & 팔로잉, 베리에이션 무료강습 (Vivian)\n• DJ: 비비안 (Vivian)\n• 장소: 홍대 피스타 (Tango Pista)\n• 신청/확인: vivimil.com",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 9. 부엘로 밀롱가 (UQSjZba4UaupwMvcG7wb) 업데이트
  console.log('Updating Milonga Vuelo...');
  const vueloUrl = await uploadFile('media__1784021427726.png', 'socials/UQSjZba4UaupwMvcG7wb/poster_20260719.png', 'image/png');
  const vueloDoc = await db.collection('socials').doc('UQSjZba4UaupwMvcG7wb').get();
  let vueloDjs = vueloDoc.data().djs || [];
  const vueloIdx = vueloDjs.findIndex(d => d.date === '2026-07-19');
  const targetVueloDj = { id: 'dj-yuan-20260719', date: '2026-07-19', djName: 'Yuan', djNameNative: '유안' };
  if (vueloIdx >= 0) vueloDjs[vueloIdx] = targetVueloDj; else vueloDjs.push(targetVueloDj);
  await db.collection('socials').doc('UQSjZba4UaupwMvcG7wb').update({
    imageUrl: vueloUrl,
    posterExportUrl: vueloUrl,
    djName: 'Yuan',
    djNameNative: '유안',
    djs: vueloDjs,
    description: "분당 부엘로 밀롱가 (Milonga Vuelo) 🌸\n여름휴가 테마 밀롱가! 먹거리, 마실거리, 춤출거리가 가득한 부엘로에서 시원하게 힐링해 보아요.\n\n• 일시: 7월 19일 (일) PM 4:00 ~ 8:00\n• DJ: 유안 (Yuan)\n• Org: 월향 & 자보 (Wolhyang & Zabo)\n• 장소: 분당 바일라모스 (분당 수내동 19-4 대덕프라자 빌딩 509호)\n• 입장료: 13,000원\n• 문의: 010-3236-4259",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 10. 엔빠스 주간 일정 전체의 캘린더 포스터 이미지 및 신규 일요 볼베르 팝업 등록
  console.log('Updating En Paz weekly poster & Volver popup...');
  const enpazUrl = await uploadFile('media__1784021458558.jpg', 'socials/en_paz_weekly/poster_20260713.jpg', 'image/jpeg');

  // 엔빠스 일요 볼베르 팝업 생성
  await db.collection('socials').doc('popup_enpaz_volver_20260719').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Volver Milonga',
    titleNative: '볼베르',
    venueId: 'Hgy2FrsR7F5jJvKMtOK3',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    startTime: '18:00',
    endTime: '22:00',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-19T00:00:00+09:00')),
    djName: 'Roca',
    djNameNative: '로까',
    djs: [{ id: 'dj-roca-20260719', date: '2026-07-19', djName: 'Roca', djNameNative: '로까' }],
    organizerId: 'manual_aron',
    organizerName: 'Aron',
    organizerNameNative: '아론',
    price: '13,000 KRW',
    country: 'KR',
    city: 'SEOUL',
    imageUrl: enpazUrl,
    posterExportUrl: enpazUrl,
    description: "엔빠스 일요 볼베르 밀롱가 (Volver Milonga)\n\n• 일시: 7월 19일 (일) PM 6:00 ~ 10:00\n• DJ: 로까 (Roca)\n• Org: 아론 (Aron)\n• 장소: 엔빠스 스튜디오 (En Paz Studio - 서초구 반포대로 30길 82 B1)\n• 예약 및 문의: 010.6281.8288",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 엔빠스 주간 내 정기 일정들의 이미지 갱신
  const enpazDocs = ['sMIEoUSmSRS9UwlxWzvp', 'en_paz_tuesday_practica', 'n4MioMSdxqnA3CVfX53N', 'X5DOqBguAJfWHmOd2yUu', 'R1hayB6of65wiDA27Q0U', 'jams_milonga'];
  for (const docId of enpazDocs) {
    await db.collection('socials').doc(docId).update({
      imageUrl: enpazUrl,
      posterExportUrl: enpazUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 11. 화정 밀롱가 (popup_hwajeong_20260623) 업데이트
  console.log('Updating Hwajeong Milonga...');
  const hwajeongUrl = await uploadFile('media__1784021505655.png', 'socials/popup_hwajeong_20260623/poster_20260714.png', 'image/png');
  const hjDoc2 = await db.collection('socials').doc('popup_hwajeong_20260623').get();
  let hjDjs = hjDoc2.data().djs || [];
  const hjIdx = hjDjs.findIndex(d => d.date === '2026-07-14');
  const targetHjDj = { id: 'dj-belle-20260714', date: '2026-07-14', djName: 'Belle', djNameNative: '벨르' };
  if (hjIdx >= 0) hjDjs[hjIdx] = targetHjDj; else hjDjs.push(targetHjDj);
  await db.collection('socials').doc('popup_hwajeong_20260623').update({
    imageUrl: hwajeongUrl,
    posterExportUrl: hwajeongUrl,
    djName: 'Belle',
    djNameNative: '벨르',
    djs: hjDjs,
    description: "여름을 닮은 HWAJEONG Milonga에 여러분을 초대합니다 🌸\nBahia Rosa를 닮은 Pink & Coral 드레스코드로 여름의 싱그러운 분위기를 즐겨보세요! 레이디들을 위한 웰컴 칵테일 Bahia Rosa가 제공됩니다.\n\n• 일시: 7월 14일 (화) PM 8:00 ~ 11:30\n• DJ: 벨르 (Belle)\n• 드레스코드: 핑크 & 코랄\n• 장소: 탱고 오나다 (Tango O nada - 마포구 동교로 193 B1)\n• 입장료: 8,000원 (10시 이후 5,000원)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 12. 피스타 아브라쏘 (B2aYZK9mZF6zUUpQEUw1) 업데이트
  console.log('Updating Milonga Abrazo...');
  const abrazoUrl = await uploadFile('media__1784021526400.png', 'socials/B2aYZK9mZF6zUUpQEUw1/poster_20260715.png', 'image/png');
  const abDoc = await db.collection('socials').doc('B2aYZK9mZF6zUUpQEUw1').get();
  let abDjs = abDoc.data().djs || [];
  const abIdx = abDjs.findIndex(d => d.date === '2026-07-15');
  const targetAbDj = { id: 'dj-cynthia-20260715', date: '2026-07-15', djName: 'Cynthia', djNameNative: '신시아' };
  if (abIdx >= 0) abDjs[abIdx] = targetAbDj; else abDjs.push(targetAbDj);
  await db.collection('socials').doc('B2aYZK9mZF6zUUpQEUw1').update({
    imageUrl: abrazoUrl,
    posterExportUrl: abrazoUrl,
    djName: 'Cynthia',
    djNameNative: '신시아',
    djs: abDjs,
    description: "수요일 저녁, 피스타 아브라쏘가 있습니다 🌸\n푸짐한 먹거리, 편안한 분위기 속에서 한 주의 피로를 싹 풀어보세요! 10시 이후 특별 할인 혜택과 토요일 더 피스타 무료입장권 제공!\n\n• 일시: 7월 15일 (수) PM 7:30 ~ 11:30\n• DJ: 신시아 (Cynthia)\n• Org: 헨리 & 아르만 (Henry & Arman)\n• 장소: 홍대 피스타 (Tango Pista)\n• 입장료: 13,000원 (10시 이후 8,000원)\n• 예약 및 문의: +82-10-5730-0727 (Henry)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 13. 안단테 오렌지 밀롱가 (EqZPQLbM3rDh1C3xdGLU) 업데이트
  console.log('Updating Orange Milonga...');
  const orangeUrl = await uploadFile('media__1784021550060.jpg', 'socials/EqZPQLbM3rDh1C3xdGLU/poster_20260714.jpg', 'image/jpeg');
  const orDoc = await db.collection('socials').doc('EqZPQLbM3rDh1C3xdGLU').get();
  let orDjs = orDoc.data().djs || [];
  const orIdx = orDjs.findIndex(d => d.date === '2026-07-14');
  const targetOrDj = { id: 'dj-hjun-20260714', date: '2026-07-14', djName: 'H.Jun', djNameNative: 'H 준' };
  if (orIdx >= 0) orDjs[orIdx] = targetOrDj; else orDjs.push(targetOrDj);
  await db.collection('socials').doc('EqZPQLbM3rDh1C3xdGLU').update({
    imageUrl: orangeUrl,
    posterExportUrl: orangeUrl,
    djName: 'H.Jun',
    djNameNative: 'H 준',
    djs: orDjs,
    description: "화요 오렌지 밀롱가 (Orange Milonga) 🍊\n달달하고 뜨겁게 포옹하는 오렌지밀! 이번주 멋진 디제이 H Jun 님과 함께합니다.\n\n• 일시: 매주 화요일 PM 7:30 ~ 12:00 (7월 14일 일정)\n• DJ: H.Jun (H 준)\n• Org: 가이아 (GaEa Kim)\n• 장소: 탱고 안단테 (Tango Andante)\n• 입장료: 13,000원\n• 예약 및 문의: 가이아 (010.6373.6967)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 14. 분당 둘쎄 밀롱가 신규 생성
  console.log('Registering Bundang Dulce Milonga...');
  const dulceUrl = await uploadFile('media__1784021568796.jpg', 'socials/bundang_dulce_milonga_4th_5th_saturday/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('bundang_dulce_milonga_4th_5th_saturday').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Bundang Dulce Summer Milonga',
    titleNative: '분당 둘쎄 밀롱가',
    venueId: '3XagPuu2bmBorzqMPNk3',
    venueName: 'Silhouette (Bundang)',
    venueNameNative: '실루엣',
    startTime: '18:00',
    endTime: '21:30',
    dayOfWeek: 6,
    recurrence: '4th,5th',
    djName: 'Star Shadow',
    djNameNative: '별그림자밟기',
    djs: [{ id: 'dj-starshadow-20260725', date: '2026-07-25', djName: 'Star Shadow', djNameNative: '별그림자밟기' }],
    organizerId: 'manual_hwangjin',
    organizerName: 'Hwangjin',
    organizerNameNative: '황진',
    organizerIds: ['manual_hwangjin'],
    organizerNames: ['Hwangjin'],
    organizerNativeNames: ['황진'],
    price: '13,000 KRW',
    country: 'KR',
    city: 'SEONGNAM',
    imageUrl: dulceUrl,
    posterExportUrl: dulceUrl,
    description: "분당 둘쎄 밀롱가 (Dulce Summer Milonga) 🌳\n갈증나는 탱고의 열정을 시원하게 해소해 줄 둘쎄 밀롱가! 맛있는 갈증해소 수박도 함께 나눕니다.\n\n• 일시: 매월 4, 5째주 토요일 PM 6:00 ~ 9:30 (7월 25일 일정)\n• DJ: 별그림자밟기\n• Org: 황진 (010-3774-2949)\n• 장소: 분당 정자동 실루엣 스튜디오 (지파크프라자 5F)\n• 입장료: 13,000원\n• 주차: 건물 내 1시간 무료 등록 필수",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 15. 강남탱고판 GTP 12주년 파티 (gtp_12th_anniversary) 예매마감 업데이트
  console.log('Updating GTP 12th Anniversary SOLD OUT...');
  const gtpUrl = await uploadFile('media__1784021595876.png', 'socials/gtp_12th_anniversary/poster.png', 'image/png');
  await db.collection('socials').doc('gtp_12th_anniversary').update({
    imageUrl: gtpUrl,
    posterExportUrl: gtpUrl,
    price: '예매마감 (SOLD OUT)',
    description: "⚠️ 현재 예매가 마감되었습니다. 현장 입장은 불가하오니 참고 부탁드립니다.\n\n강남탱고판 GTP 12주년 기념 파티 🌟\n• EVENT: 포토존, 론다 런웨이, 와인 및 푸드 제공\n\n• 일시: 7월 17일 (금요일) PM 7:00 ~ 12:00\n• DJ: 곤즈 (Gonz)\n• MC: 요노 (Yono)\n• Pro Photographer: 오작가 (Oh!)\n• 장소: 클럽 판 (Club PAN - 서울 강남)\n• 입장료: 30,000원\n• 문의: 판도라 (010-8709-0340)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 16. 이그녹스 밀롱가 신규 생성
  console.log('Registering Ignox Milonga...');
  const ignoxUrl = await uploadFile('media__1784021621739.jpg', 'socials/popup_ignox_milonga_20260718/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('popup_ignox_milonga_20260718').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Ignox Milonga',
    titleNative: '이그녹스 밀롱가',
    venueId: 'Hgy2FrsR7F5jJvKMtOK3',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    startTime: '19:00',
    endTime: '23:00',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-18T00:00:00+09:00')),
    djName: 'Yeonpung',
    djNameNative: '연풍',
    djs: [{ id: 'dj-yeonpung-20260718', date: '2026-07-18', djName: 'Yeonpung', djNameNative: '연풍' }],
    organizerId: 'manual_ignox',
    organizerName: 'Ignox',
    organizerNameNative: '이그녹스',
    price: '13,000 KRW',
    country: 'KR',
    city: 'SEOUL',
    imageUrl: ignoxUrl,
    posterExportUrl: ignoxUrl,
    description: "이그녹스 밀롱가 (Ignox Milonga) 🌸\n좋은 음악과 따뜻한 분위기 속에서 이그녹스의 특별한 딴따와 함께 힐링해 보아요.\n시그니처 김말이와 맛있는 핑거푸드, 와인이 풍성하게 제공됩니다!\n\n• 일시: 2026년 7월 18일 (토) PM 7:00 ~ 11:00\n• DJ: 연풍\n• Org: 이그녹스 (Ignox)\n• 장소: 엔빠스 스튜디오 (En Paz Studio - 서초구 반포대로 30길 82 B1)\n• 입장료: 13,000원\n• 문의: 010-4759-9540",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 17. 마제밀 신규 생성
  console.log('Registering Maje Milonga...');
  const majeUrl = await uploadFile('media__1784021638272.png', 'socials/pista_maje_milonga_3rd_friday/poster.png', 'image/png');
  await db.collection('socials').doc('pista_maje_milonga_3rd_friday').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Milonga Maje',
    titleNative: '마제밀',
    venueId: 'KeCXdyVnLyUMwhsMqR6dDPi2tZy2',
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    startTime: '19:00',
    endTime: '23:00',
    dayOfWeek: 5,
    recurrence: '3rd',
    djName: 'Mano',
    djNameNative: '마노',
    djs: [{ id: 'dj-mano-20260717', date: '2026-07-17', djName: 'Mano', djNameNative: '마노' }],
    organizerId: 'manual_marco_jacob',
    organizerName: 'Marco & Jacob',
    organizerNameNative: '마르코 & 제이콥',
    organizerIds: ['manual_marco', 'manual_jacob'],
    organizerNames: ['Marco', 'Jacob'],
    organizerNativeNames: ['마르코', '제이콥'],
    price: '13,000 KRW',
    country: 'KR',
    city: 'SEOUL',
    imageUrl: majeUrl,
    posterExportUrl: majeUrl,
    description: "매달 셋째 주 금요일에 열리는 마제밀 (Milonga Maje) 🌸\n탱고 3곡, 발스 3곡, 밀롱가 3곡, AM 3곡의 버무림이 있는 신개념 소셜! 즉석 마제 주먹밥과 시원한 수박화채를 준비하고 기다립니다.\n\n• 일시: 매월 셋째 주 금요일 PM 7:00 ~ 11:00 (7월 17일 일정)\n• DJ: 마노 (Mano)\n• Org: 마르코 & 제이콥 (Marco & Jacob)\n• 장소: 홍대 피스타 (Tango Pista - 지하 1층)\n• 입장료: 13,000원\n• 예약 및 문의: 010-8806-9111 (카톡: ycnam0506)",
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('=== MASTER BATCH SOCIAL UPDATES COMPLETED SUCCESSFULLY ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
