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
  console.log('=== STARTING FINAL SOCIALS UPDATE ===');

  // 1. 베뉴 선등록
  const venues = [
    { id: 'bundang_bailamos', name: 'Bailamos', nameKo: '바일라모스', address: '경기 성남시 분당구 수내동 19-4 대덕프라자 빌딩 509호', city: 'SEONGNAM', country: 'KR' },
    { id: 'todotango', name: 'Todo Tango', nameKo: '또도땅고', address: '서울 강남구 신사동 637-15 B1', city: 'SEOUL', country: 'KR' }
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
  urlMap.vuelo = await uploadFile('media__1784545509512.png', 'socials/nZksoQfo12TQJo2e4FvL/poster.png', 'image/png');
  urlMap.siempre = await uploadFile('media__1784545590372.jpg', 'socials/kv30qNOhxpmMlo7fpzAl/poster.jpg', 'image/jpeg');
  urlMap.ignox = await uploadFile('media__1784545639144.jpg', 'socials/popup_ignox_milonga_20260718/poster.jpg', 'image/jpeg');

  // 3. 소셜 정보 반영

  // (1) 부엘로 밀롱가 (nZksoQfo12TQJo2e4FvL)
  console.log('Updating Vuelo Milonga...');
  await db.collection('socials').doc('nZksoQfo12TQJo2e4FvL').set({
    title: 'Milonga Vuelo',
    titleNative: '부엘로 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 0, // 일요일
    recurrence: '3rd',
    startTime: '16:00',
    endTime: '20:00',
    venueId: 'bundang_bailamos',
    venueName: 'Bailamos',
    venueNameNative: '바일라모스',
    price: '13,000 KRW',
    city: 'SEONGNAM',
    country: 'KR',
    imageUrl: urlMap.vuelo,
    posterExportUrl: urlMap.vuelo,
    djName: 'Yuan',
    djNameNative: '유안',
    djs: [{
      id: 'dj-yuan-20260719',
      date: '2026-07-19',
      djName: 'Yuan',
      djNativeName: '유안',
      djNameNative: '유안'
    }],
    organizerId: 'manual_wolhyang_zabo',
    organizerName: 'Wolhyang & Zabo',
    organizerNameNative: '월향 y 자보',
    description: "분당의 대표적인 셋째 주 일요일 오후 밀롱가, 부엘로 밀롱가 (Milonga Vuelo) ✈️\n\n먹거리, 마실거리, 춤출거리 가득한 부엘로에서 특별한 일요일 오후를 보내보세요.\n\n• 일시: 매월 셋째 주 일요일 PM 4:00 ~ 8:00\n• 7/19 DJ: 유안 (자유로운 영혼과 낭만의 댄서)\n• Org: 월향 & 자보\n• 장소: 분당 수내동 바일라모스 (대덕프라자 빌딩 509호)\n• 입장료: 13,000원\n• 문의: 010-3236-4259",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // (2) 밀롱가 씨엠쁘레 (kv30qNOhxpmMlo7fpzAl)
  console.log('Updating Siempre Milonga...');
  await db.collection('socials').doc('kv30qNOhxpmMlo7fpzAl').set({
    title: 'Milonga Siempre',
    titleNative: '밀롱가 씨엠쁘레',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 3, // 수요일
    recurrence: 'every',
    startTime: '13:00',
    endTime: '16:00',
    venueId: 'todotango',
    venueName: 'Todo Tango',
    venueNameNative: '또도땅고',
    price: '13,000 KRW (특강 패키지: 20,000원)',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: urlMap.siempre,
    posterExportUrl: urlMap.siempre,
    djName: 'Terry',
    djNameNative: '테리',
    djs: [{
      id: 'dj-terry-20260715',
      date: '2026-07-15',
      djName: 'Terry',
      djNativeName: '테리',
      djNameNative: '테리'
    }],
    organizerId: 'manual_misun',
    organizerName: 'Misun',
    organizerNameNative: '미선',
    description: "또도땅고에서 매주 수요일 오후 편안한 분위기로 진행되는 낮 밀롱가 '씨엠쁘레' (Milonga Siempre) ☀️\n\n늘 같은 자리에서 새롭게 만나는 특별한 오후 론다에 여러분을 초대합니다.\n\n• 일시: 매주 수요일 PM 1:00 ~ 4:00 (13:00~13:50 미선 원장의 특강 진행)\n• 7/15 DJ: 테리 (Terry)\n• 7/15 특강 주제: 좁은 공간 시퀀스\n• 요금: 밀롱가만 13,000원 / 밀롱가+클래스 20,000원\n• 장소: 또도땅고 (강남구 신사동 637-15 B1)\n• 예약 및 문의: 010-7745-4324\n• 입금계좌: 국민은행 479002-01-272752 (강미선 / 입금 시 '씨엠+닉네임' 기재)",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // (3) 이그녹스 밀롱가 (popup_ignox_milonga_20260718)
  console.log('Updating Ignox Milonga...');
  await db.collection('socials').doc('popup_ignox_milonga_20260718').set({
    imageUrl: urlMap.ignox,
    posterExportUrl: urlMap.ignox,
    price: '13,000 KRW',
    djName: 'Yeonpung',
    djNameNative: '연풍',
    djs: [{
      id: 'dj-yeonpung-20260718',
      date: '2026-07-18',
      djName: 'Yeonpung',
      djNativeName: '연풍',
      djNameNative: '연풍'
    }],
    description: "좋은 음악과 따뜻한 분위기 속에서 함께하는 이그녹스 밀롱가 (Ignox Milonga) 🥂\n\n• 일시: 7월 18일 (토) PM 7:00 ~ 11:00\n• DJ: 연풍\n• 제공: 이그녹스 밀롱가 시그니처 김말이, 간단한 핑거푸드 & 와인\n• 장소: 이그녹스 (피스타 스튜디오 - 마포구 월드컵북로6길 49 B1)\n• 입장료: 13,000원\n• 문의: 010-4759-9540",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== FINAL SOCIALS UPDATE COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
