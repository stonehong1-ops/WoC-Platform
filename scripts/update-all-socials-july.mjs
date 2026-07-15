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
  console.log('=== STARTING ALL BATCH SOCIAL UPDATES ===');

  // 1. 인무땅 포스터 교체 (oOQT7PhjvQIetwdT9kKc)
  const inmudUrl = await uploadFile('media__1783460673465.jpg', 'socials/oOQT7PhjvQIetwdT9kKc/poster_20260708.jpg', 'image/jpeg');
  await db.collection('socials').doc('oOQT7PhjvQIetwdT9kKc').update({
    imageUrl: inmudUrl,
    posterExportUrl: inmudUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('1. Inmud poster updated.');

  // 2. 류 쁘락띠까 포스터 교체 (9oYPncz9AwkWJdLSi3cC)
  const ryuUrl = await uploadFile('media__1783460707690.jpg', 'socials/9oYPncz9AwkWJdLSi3cC/poster_20260708.jpg', 'image/jpeg');
  await db.collection('socials').doc('9oYPncz9AwkWJdLSi3cC').update({
    imageUrl: ryuUrl,
    posterExportUrl: ryuUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('2. Ryu Practica poster updated.');

  // 3. 수까멜 포스터 교체 + DJ 키요나 갱신 (n4MioMSdxqnA3CVfX53N)
  const cameliaUrl = await uploadFile('media__1783460768136.png', 'socials/n4MioMSdxqnA3CVfX53N/poster_20260708.png', 'image/png');
  const cameliaDoc = await db.collection('socials').doc('n4MioMSdxqnA3CVfX53N').get();
  let cameliaDjs = cameliaDoc.data().djs || [];
  // 7월 8일 일정이 기존에 없으면 추가, 있으면 업데이트
  const existIdx = cameliaDjs.findIndex(d => d.date === '2026-07-08');
  const targetDj = { id: 'dj-kiyona-20260708', date: '2026-07-08', djName: 'Kiyona', djNameNative: '키요나' };
  if (existIdx >= 0) {
    cameliaDjs[existIdx] = targetDj;
  } else {
    cameliaDjs.push(targetDj);
  }
  await db.collection('socials').doc('n4MioMSdxqnA3CVfX53N').update({
    imageUrl: cameliaUrl,
    posterExportUrl: cameliaUrl,
    djName: 'Kiyona',
    djNameNative: '키요나',
    djs: cameliaDjs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('3. Camelia poster & DJ updated.');

  // 4. 제주 칙투칙 밀롱가 신규 생성
  const cheekUrl = await uploadFile('media__1783460731859.jpg', 'socials/jeju_cheek_to_cheek_20260711/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('jeju_cheek_to_cheek_20260711').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Cheek to Cheek Milonga',
    titleNative: '칙투칙 밀롱가',
    venueId: 'jeju_vida_dance_studio',
    venueName: 'Vida Dance Studio',
    venueNameNative: '비다댄스스튜디오',
    startTime: '19:00',
    endTime: '22:00',
    dayOfWeek: 6,
    recurrence: '2nd',
    djName: 'Yanggawi',
    djNameNative: '양가위',
    organizerId: 'manual_jesta',
    organizerName: 'Jesta',
    organizerNameNative: '제스타',
    organizerIds: ['manual_jesta'],
    organizerNames: ['Jesta'],
    organizerNativeNames: ['제스타'],
    price: '10,000 KRW',
    country: 'KR',
    city: 'JEJU',
    imageUrl: cheekUrl,
    posterExportUrl: cheekUrl,
    description: "매월 둘째 주 토요일 늦은 7시 ~ 10시 제주도 비다댄스스튜디오에서 열리는 칙투칙 밀롱가 입니다.\n몸은 시원하게 가슴은 뜨겁게, 시원한 제주에서 함께 땅고를 즐겨보아요!\n\n• 시간: PM 7:00 ~ 10:00\n• DJ: 양가위\n• Org: 제스타\n• 장소: 비다댄스스튜디오 A룸 (제주시 동광로 82 지하, 비번 0852)\n• 입장료: 10,000원\n• 문의: 제스타 (010-4757-4846)",
    djs: [{ id: 'dj-yanggawi-20260711', date: '2026-07-11', djName: 'Yanggawi', djNameNative: '양가위' }],
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('4. Jeju Cheek to Cheek registered.');

  // 5. 대전 바비밀 1주년 갱신 (popup_onada_babi_20260717)
  const bobbyUrl = await uploadFile('media__1783460784658.jpg', 'socials/popup_onada_babi_20260717/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('popup_onada_babi_20260717').update({
    imageUrl: bobbyUrl,
    posterExportUrl: bobbyUrl,
    djName: 'Mint',
    djNameNative: '민트',
    djs: [{ djName: 'Mint', djNameNative: '민트', date: '2026-07-17', id: 'dj-mint-20260717' }],
    startTime: '21:00',
    endTime: '03:00',
    description: "대전 오나다 바비밀\n\n• 일시: 7월 17일 (금) PM 9:00 ~ AM 3:00\n• DJ: Mint (민트)\n\n바비밀 1주년 파티! (1st Anniversary!) 마케팅 직원을 새로 채용했어요. 인사드립니다! 다음날도 대전에서 프리메라&찐밀.",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('5. Bobby Milonga 1st Anniversary updated.');

  // 6. 잼스 밀롱가 셋째주 토요일 갱신 (jams_milonga)
  const jamsUrl = await uploadFile('media__1783460853714.png', 'socials/jams_milonga/poster_20260718.png', 'image/png');
  const jamsDoc = await db.collection('socials').doc('jams_milonga').get();
  let jamsDjs = jamsDoc.data().djs || [];
  const existJamsIdx = jamsDjs.findIndex(d => d.date === '2026-07-18');
  const targetJamsDj = { id: 'dj-jams-20260718', date: '2026-07-18', djName: 'Annie, Mileo, James', djNameNative: '애니, 밀어, 제임스' };
  if (existJamsIdx >= 0) {
    jamsDjs[existJamsIdx] = targetJamsDj;
  } else {
    jamsDjs.push(targetJamsDj);
  }
  await db.collection('socials').doc('jams_milonga').update({
    imageUrl: jamsUrl,
    posterExportUrl: jamsUrl,
    djName: 'Annie, Mileo, James',
    djNameNative: '애니, 밀어, 제임스',
    djs: jamsDjs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('6. Jam\'s Milonga updated.');

  // 7. 마산 마린 밀롱가 갱신 (popup_masan_marintango_20260712)
  const marineUrl = await uploadFile('media__1783460881640.png', 'socials/popup_masan_marintango_20260712/poster.png', 'image/png');
  await db.collection('socials').doc('popup_masan_marintango_20260712').update({
    imageUrl: marineUrl,
    posterExportUrl: marineUrl,
    djName: 'Epitone',
    djNameNative: '에피톤',
    djs: [{ id: 'dj-epitone-2026-07-12', date: '2026-07-12', djName: 'Epitone', djNameNative: '에피톤' }],
    description: "글로벌 DJ 에피톤과 함께하는 특별한 Marine Tango Milonga 마린밀\n\n• 일시: 2026년 7월 12일 (일) 15:00 ~ 19:00\n• DJ: 에피톤 (Epitone)\n• 장소: 마산 합포구 동서서4길 10, 2층\n• 입장료: 12,000원\n• 문의: 010-9354-7773\n\n아르헨티나에서 오신 로드리고님도 함께 합니다. 마린밀로 놀러오세요!",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('7. Marine Milonga updated.');

  // 8. 안단테 뮤롱가 1주년 갱신 (BrP6IxFlHSpxA37nKpmZ)
  const murongaUrl = await uploadFile('media__1783460910862.jpg', 'socials/BrP6IxFlHSpxA37nKpmZ/poster_1st_anniversary.jpg', 'image/jpeg');
  const murongaDoc = await db.collection('socials').doc('BrP6IxFlHSpxA37nKpmZ').get();
  let murongaDjs = murongaDoc.data().djs || [];
  const existMuIdx = murongaDjs.findIndex(d => d.date === '2026-07-17');
  const targetMuDj = { id: 'dj-yeonpoong-20260717', date: '2026-07-17', djName: 'Yeon Poong', djNameNative: '연풍', message: '1주년' };
  if (existMuIdx >= 0) {
    murongaDjs[existMuIdx] = targetMuDj;
  } else {
    murongaDjs.push(targetMuDj);
  }
  await db.collection('socials').doc('BrP6IxFlHSpxA37nKpmZ').update({
    imageUrl: murongaUrl,
    posterExportUrl: murongaUrl,
    djName: 'Yeon Poong',
    djNameNative: '연풍',
    djs: murongaDjs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('8. Muronga 1st Anniversary updated.');

  // 9. 피스타 그랜드밀롱가 (popup_pista_grand_20260710)
  const grandUrl = await uploadFile('media__1783460969264.jpg', 'socials/popup_pista_grand_20260710/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('popup_pista_grand_20260710').update({
    imageUrl: grandUrl,
    posterExportUrl: grandUrl,
    djName: 'Agnes',
    djNameNative: '아네스',
    djs: [{ djName: 'Agnes', djNameNative: '아네스', date: '2026-07-10', id: 'dj-agnes-20260710' }],
    description: "그랜드밀롱가 🏤 - 그런데 친구들과 함께 만드는 특별한 밤 ✨\n\n• 일시: 2026년 7월 10일 (금) PM 8:00 ~ AM 2:00\n• 장소: 피스타 (Tango Pista)\n• DJ: 아네스 (Agnes)\n• 드레스 코드: 블랙 & 화이트 (Black & White)\n• 스페셜 공연: 디에고 & 알다나 (Diego & Aldana)\n• MC: 현이 | 통역: 에이미 | 영상: 리수 | 포토그래퍼: 미도 | 호스트: 이브\n• 서포터즈: 케빈, 나나씨, 웬디, 헨리",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('9. Pista Grand Milonga updated.');

  // 10. 루미노쏘 금요일 (iNmsCS86KtAqMLFAeqfE)
  const lumUrl = await uploadFile('media__1783461026428.jpg', 'socials/iNmsCS86KtAqMLFAeqfE/poster_20260703.jpg', 'image/jpeg');
  await db.collection('socials').doc('iNmsCS86KtAqMLFAeqfE').update({
    imageUrl: lumUrl,
    posterExportUrl: lumUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('10. Luminoso Friday poster updated.');

  // 11. 밀빠소 (milpasso_milonga_20260705)
  const milpassoUrl = await uploadFile('media__1783461077042.jpg', 'socials/milpasso_milonga_20260705/poster_50members.jpg', 'image/jpeg');
  await db.collection('socials').doc('milpasso_milonga_20260705').update({
    imageUrl: milpassoUrl,
    posterExportUrl: milpassoUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('11. Milpasso poster updated.');

  // 12. 오초 7월 월간 이미지 등록
  const ochoMonthlyUrl = await uploadFile('media__1783461116068.jpg', 'groupScheduleImages/ocho/2026_7_monthly.jpg', 'image/jpeg');
  await db.collection('groupScheduleImages').doc('ocho_2026_7_monthly').set({
    groupId: 'ocho',
    imageUrl: ochoMonthlyUrl,
    year: 2026,
    month: 7,
    type: 'monthly',
    uploadedAt: new Date().toISOString(),
    storagePath: 'groupScheduleImages/ocho/2026_7_monthly.jpg'
  });
  console.log('12. Ocho 7M calendar registered.');

  // 13. 그리쎌 밀롱가 (vQ4SASAdywi4Nj74SsAm)
  const gricelUrl = await uploadFile('media__1783461144396.jpg', 'socials/vQ4SASAdywi4Nj74SsAm/poster.jpg', 'image/jpeg');
  await db.collection('socials').doc('vQ4SASAdywi4Nj74SsAm').update({
    imageUrl: gricelUrl,
    posterExportUrl: gricelUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('13. Gricel poster updated.');

  // 14. 찐밀롱가 (R3WnYLqrRstLBA8JUFRS)
  const jjinUrl = await uploadFile('media__1783461166096.png', 'socials/R3WnYLqrRstLBA8JUFRS/poster_20260712.png', 'image/png');
  const jjinDoc = await db.collection('socials').doc('R3WnYLqrRstLBA8JUFRS').get();
  let jjinDjs = jjinDoc.data().djs || [];
  const existJjIdx = jjinDjs.findIndex(d => d.date === '2026-07-12');
  const targetJjDj = { id: 'dj-nacho-20260712', date: '2026-07-12', djName: 'Nacho', djNameNative: '나초' };
  if (existJjIdx >= 0) {
    jjinDjs[existJjIdx] = targetJjDj;
  } else {
    jjinDjs.push(targetJjDj);
  }
  await db.collection('socials').doc('R3WnYLqrRstLBA8JUFRS').update({
    imageUrl: jjinUrl,
    posterExportUrl: jjinUrl,
    djName: 'Nacho',
    djNameNative: '나초',
    djs: jjinDjs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('14. JJin Milonga poster & DJ updated.');

  // 15. 월요일은 쁘락입니다 (busan_studio242_mondaypractica)
  const monPracUrl = await uploadFile('media__1783461285692.png', 'socials/busan_studio242_mondaypractica/poster.png', 'image/png');
  await db.collection('socials').doc('busan_studio242_mondaypractica').update({
    imageUrl: monPracUrl,
    posterExportUrl: monPracUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('15. Busan Monday Practica poster updated.');

  // 16. 대전 아주카르 아미가 밀롱가 (W0rG3vtQnBFr2vIhcFGC)
  const amigaUrl = await uploadFile('media__1783461362329.png', 'socials/W0rG3vtQnBFr2vIhcFGC/poster.png', 'image/png');
  await db.collection('socials').doc('W0rG3vtQnBFr2vIhcFGC').update({
    imageUrl: amigaUrl,
    posterExportUrl: amigaUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('16. Amiga Milonga poster updated.');

  // 17. 무초밀 오거나이저 변경 (maMVsnmrc6lplGXCIr8D)
  await db.collection('socials').doc('maMVsnmrc6lplGXCIr8D').update({
    organizerId: 'manual_mambo_mucho',
    organizerName: 'Mambo Mucho',
    organizerNameNative: '맘보 무쵸',
    organizerIds: ['manual_mambo_mucho'],
    organizerNames: ['Mambo Mucho'],
    organizerNativeNames: ['맘보 무쵸'],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('17. Mucho Mil organizer updated.');

  console.log('=== BATCH SOCIAL UPDATES COMPLETED SUCCESSFULLY ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
