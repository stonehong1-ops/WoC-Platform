import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
}, 'luminoso_app');

const db = admin.firestore(admin.app('luminoso_app'));
const bucket = admin.storage(admin.app('luminoso_app')).bucket();
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
  console.log('=== STARTING LUMINOSO & MILPASSO UPDATES ===');

  // 1. 일요 루미노소 (C0xF4VaGDIRIyt8a2hta) 업데이트
  const sunUrl = await uploadFile(
    'media__1785028727362.jpg',
    'socials/C0xF4VaGDIRIyt8a2hta/poster_20260726.jpg',
    'image/jpeg'
  );
  console.log('Updating Sunday Luminoso...');
  const sunRef = db.collection('socials').doc('C0xF4VaGDIRIyt8a2hta');
  const sunSnap = await sunRef.get();
  let sunDjs = sunSnap.exists ? (sunSnap.data().djs || []) : [];

  const sunDj = {
    id: 'dj-yeonpung-20260726',
    date: '2026-07-26',
    djName: 'Yeonpung',
    djNativeName: '연풍',
    djNameNative: '연풍'
  };

  const sIdx = sunDjs.findIndex(d => d.date === '2026-07-26');
  if (sIdx >= 0) sunDjs[sIdx] = sunDj;
  else sunDjs.push(sunDj);

  await sunRef.set({
    imageUrl: sunUrl,
    posterExportUrl: sunUrl,
    djName: 'Yeonpung',
    djNameNative: '연풍',
    djs: sunDjs,
    description: "7월의 마지막 일요일, 루미노소에서 만나요! 2시의 데이트!! 오초에서 기다릴게요!! 🐧✨\n\n• 일시: 7월 26일 (일) PM 2:00 ~ 6:00\n• DJ: 연풍 (Yeonpung)\n• Org: TREES\n• 드레스코드: Blue (블루)\n• 장소: 오초 (Ocho - 마포구 월드컵북로2길 57 B1)\n• 입장료: 13,000원\n• 테이블 예약 및 문의: 카톡 hjkim0412",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. 월요 루미노소 (sMIEoUSmSRS9UwlxWzvp) 업데이트
  const monUrl = await uploadFile(
    'media__1785028748559.jpg',
    'socials/sMIEoUSmSRS9UwlxWzvp/poster_20260727.jpg',
    'image/jpeg'
  );
  console.log('Updating Monday Luminoso...');
  const monRef = db.collection('socials').doc('sMIEoUSmSRS9UwlxWzvp');
  const monSnap = await monRef.get();
  let monDjs = monSnap.exists ? (monSnap.data().djs || []) : [];

  const monDj = {
    id: 'dj-natalia-20260727',
    date: '2026-07-27',
    djName: 'Natalia Castaño',
    djNativeName: '나탈리아',
    djNameNative: '나탈리아'
  };

  const mIdx = monDjs.findIndex(d => d.date === '2026-07-27');
  if (mIdx >= 0) monDjs[mIdx] = monDj;
  else monDjs.push(monDj);

  await monRef.set({
    imageUrl: monUrl,
    posterExportUrl: monUrl,
    djName: 'Natalia Castaño',
    djNameNative: '나탈리아',
    djs: monDjs,
    description: "이번 월요일, 탱고에 반하다! 💙 한 주의 시작을 가장 아름답게 보내는 방법. 월루미에서 행복한 탱고의 시간을 즐겨보세요! En paz에서 만나요!\n\n💗💗 이번 주는 스페셜 DJ! 💗💗\n🌸🌸 Natalia Castaño 🌸🌸\nDJ Natalia가 특별한 선곡으로 여러분과 함께합니다🧡\n\n• 일시: 7월 27일 (월) PM 7:30 ~ 11:30\n• DJ: Natalia Castaño\n• Org: 트리스 (Tris)\n• 드레스코드: White (화이트)\n• 장소: 교대 엔빠스 스튜디오 (반포대로30길 82 B1)\n• 입장료: 13,000원\n• 테이블 예약: 카카오톡 hjkim0412",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 3. 밀파소 #002 (popup_milpasso_002_20260802) 등록
  const milpassoUrl = await uploadFile(
    'media__1785028691273.jpg',
    'socials/popup_milpasso_002_20260802/poster.jpg',
    'image/jpeg'
  );
  console.log('Registering Milpasso #002...');
  await db.collection('socials').doc('popup_milpasso_002_20260802').set({
    title: 'MILPASSO #002',
    titleNative: '밀파소 #002',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-08-02T00:00:00+09:00')),
    startTime: '14:00',
    endTime: '18:00',
    venueId: 'xVJsZb5y34WjlqP5iHDr', // 피스타
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    price: '13,000 KRW',
    city: 'SEOUL',
    country: 'KOREA',
    imageUrl: milpassoUrl,
    posterExportUrl: milpassoUrl,
    djName: 'Henry',
    djNameNative: '헨리',
    djs: [{
      id: 'dj-henry-20260802',
      date: '2026-08-02',
      djName: 'Henry',
      djNativeName: '헨리',
      djNameNative: '헨리'
    }],
    organizerId: 'manual_ian',
    organizerName: 'Ian',
    organizerNameNative: '이안',
    description: "MILPASSO는 다시 찾고 싶은 경험을 만듭니다. MILPASSO #002 ✈️✨\n\n• 일시: 2026년 8월 2일 (일) PM 2:00 ~ 6:00\n• DJ: 헨리 (Henry)\n• Org: 이안 (Ian)\n• 이벤트:\n- 라이브 공연\n- 레이디스 까베세오\n- MILPASSO Surprise\n- SNS 후기 이벤트\n- 포토존\n• 장소: 홍대 피스타 (마포구 월드컵북로6길 49 B1)\n• 입장료: 13,000원\n• 문의: 010-5365-7894",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('=== LUMINOSO & MILPASSO UPDATES COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
