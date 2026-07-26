import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
}, 'batch_app');

const db = admin.firestore(admin.app('batch_app'));
const bucket = admin.storage(admin.app('batch_app')).bucket();
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
  console.log('=== STARTING BATCH SOCIALS REGISTRATION ===');

  // 1. 제주 '한여름 밤의 밀롱가' 업로드 및 등록
  const jejuUrl = await uploadFile(
    'media__1784856422093.png',
    'socials/popup_jeju_midsummer_20260725/poster.png',
    'image/png'
  );
  console.log('Registering Jeju Milonga...');
  await db.collection('socials').doc('popup_jeju_midsummer_20260725').set({
    title: "A Midsummer Night's Milonga",
    titleNative: '한여름 밤의 밀롱가',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-25T00:00:00+09:00')),
    startTime: '19:00',
    endTime: '22:00',
    venueId: 'v_manual_jeju_weplaystay',
    venueName: 'Weplay Stay',
    venueNameNative: '위플 스테이',
    price: '10,000 KRW',
    city: 'JEJU',
    country: 'KOREA',
    imageUrl: jejuUrl,
    posterExportUrl: jejuUrl,
    djName: 'Polo',
    djNameNative: '폴로',
    djs: [{
      id: 'dj-polo-20260725',
      date: '2026-07-25',
      djName: 'Polo',
      djNativeName: '폴로',
      djNameNative: '폴로'
    }],
    organizerId: 'manual_polo',
    organizerName: 'Polo',
    organizerNameNative: '폴로',
    description: "제주 연동 위플 스테이 2층 탱고올레 스튜디오에서 펼쳐지는 특별한 한여름 밤의 밀롱가 🌌✨\n\n• 일시: 7월 25일 (토) PM 7:00 ~ 10:00\n• DJ / Org: 폴로 (Polo)\n• 장소: 제주시 연동 260-25 위플 스테이 2층 (탱고올레 스튜디오)\n• 입장료: 10,000원",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. 강남 밀롱가 업로드 및 등록
  const gangnamUrl = await uploadFile(
    'media__1784856479744.jpg',
    'socials/gangnam_milonga_saturday/poster.jpg',
    'image/jpeg'
  );
  console.log('Registering Gangnam Milonga...');
  await db.collection('socials').doc('gangnam_milonga_saturday').set({
    title: 'Gangnam Milonga',
    titleNative: '강남 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 6, // 토요일
    recurrence: 'every',
    startTime: '19:00',
    endTime: '22:30',
    venueId: 'Z8XjPNw7il0B9zilFPGx', // 탱고라이프
    venueName: 'TangoLife',
    venueNameNative: '탱고라이프',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KOREA',
    imageUrl: gangnamUrl,
    posterExportUrl: gangnamUrl,
    djName: 'Kogsan',
    djNameNative: '곡산',
    djs: [{
      id: 'dj-kogsan-20260725',
      date: '2026-07-25',
      djName: 'Kogsan',
      djNativeName: '곡산',
      djNameNative: '곡산'
    }],
    organizerId: 'manual_julian_natalia',
    organizerName: 'Julian & Natalia',
    organizerNameNative: '훌리안 y 나탈리아',
    description: "매주 토요일, 탱고마스터 Julian & Natalia와 함께하며 새롭게 리브랜딩된 강남 밀롱가 (Gangnam Milonga) 🥂✨\n\n최상의 바닥과 음향을 자랑하는 탱고라이프에서 마스터가 상주하며 직접 춤추고 유쾌하게 교류하는 특별한 토요일 밤이 시작됩니다.\n\n• 7/25(토) 마스터클래스 워크숍 일정:\n- 15:00 ~ 탱고 테크닉\n- 16:10 ~ 발스 테크닉\n- 17:20 ~ 밀롱가 테크닉\n• 밀롱가 시간: PM 7:00 ~ 10:30 (18:30부터 자율 쁘락)\n• DJ: 곡산 (Kogsan)\n• 입장료: 13,000원 (토요일 수강생은 밀롱가 예약 10,000원)\n• 워크숍 요금: 1클래스 3만원 / 2클래스 5만원 / 3클래스 7.5만원\n• 풀 패키지 (수업 3개 + 밀롱가): 80,000원\n• 예약 및 문의: 010-9772-4990\n• 계좌: 카카오뱅크 3333-18-8414917 김규호",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 3. 볼베르 밀롱가 등록 및 7/26 일정 추가
  console.log('Registering Volver Milonga...');
  const volverRef = db.collection('socials').doc('popup_volver_20260628');
  const volverSnap = await volverRef.get();
  let volverDjs = volverSnap.exists ? (volverSnap.data().djs || []) : [];

  const volverDj = {
    id: 'dj-nakhwayusu-20260726',
    date: '2026-07-26',
    djName: 'Nakhwayusu',
    djNativeName: '낙화유수',
    djNameNative: '낙화유수'
  };

  const vIdx = volverDjs.findIndex(d => d.date === '2026-07-26');
  if (vIdx >= 0) volverDjs[vIdx] = volverDj;
  else volverDjs.push(volverDj);

  await volverRef.set({
    title: 'Volver Milonga',
    titleNative: '볼베르 밀롱가',
    type: 'regular',
    subCategory: 'milonga',
    dayOfWeek: 0, // 일요일
    recurrence: '3rd,4th', // 매월 세째, 네째 일요일
    startTime: '18:00',
    endTime: '22:00',
    venueId: 'Hgy2FrsR7F5jJvKMtOK3', // 엔빠스 스튜디오
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스 스튜디오',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KOREA',
    djName: 'Nakhwayusu',
    djNameNative: '낙화유수',
    djs: volverDjs,
    organizerId: 'manual_aron',
    organizerName: 'Aron',
    organizerNameNative: '아론',
    description: "매월 셋째, 넷째 일요일 저녁 강남 교대역 엔빠스에서 열리는 볼베르 밀롱가 (Volver Milonga) 🎉\n\n• 일시: 7월 26일 (일) PM 6:00 ~ 10:00\n• DJ: 낙화유수\n• Org: 아론 (010-6281-8288)\n• 장소: 교대 엔빠스 스튜디오 (반포대로30길 82 B1)\n• 입장료: 13,000원",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('=== BATCH SOCIALS REGISTRATION COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
