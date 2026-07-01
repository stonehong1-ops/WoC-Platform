import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const brainDir = 'C:/Users/stone/.gemini/antigravity/brain/77584f7a-10ee-43e5-a1b6-5a48a55e20e7';

async function uploadImage(filename, docId) {
  if (!filename) return '';
  const filePath = path.join(brainDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return '';
  }

  const fileExtension = path.extname(filename).toLowerCase();
  const contentType = fileExtension === '.png' ? 'image/png' : 'image/jpeg';
  const destPath = `socials/${docId}/poster${fileExtension}`;
  
  console.log(`Uploading ${filename} to ${destPath}...`);
  const file = bucket.file(destPath);
  const buffer = fs.readFileSync(filePath);
  
  await file.save(buffer, {
    metadata: {
      contentType: contentType,
      cacheControl: 'public, max-age=31536000'
    }
  });
  
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log(`Uploaded successfully! URL: ${publicUrl}`);
  return publicUrl;
}

async function run() {
  // --- 1. 이미지 파일 업로드 ---
  const pCalendarUrl = await uploadImage('media__1782773569678.png', 'pista_calendar_202607');
  const pMonUrl = await uploadImage('media__1782773578696.jpg', '5uTDbVd36Pa0KAxJXJQH');
  const pDayUrl = await uploadImage('media__1782773585221.jpg', '82e5OLQtPv4sG4Qj53jk');
  const pSunUrl = await uploadImage('media__1782773591306.jpg', 'pista_sunday_practica');
  const s242Url = await uploadImage('media__1782773641727.png', 'busan_studio242_mondaypractica');
  const amigaUrl = await uploadImage('media__1782773704398.png', 'W0rG3vtQnBFr2vIhcFGC');
  const cam1Url = await uploadImage('media__1782773876593.png', 'WDU3IQ16GJXtj2mR4asg');
  const cam2Url = await uploadImage('media__1782773884572.jpg', 'popup_caminito_amigo_20260717');
  const cam3Url = await uploadImage('media__1782773893343.jpg', 'popup_caminito_beginner_20260720');
  const oCalendarUrl = await uploadImage('media__1782773990318.png', 'onada_calendar_202607');
  const arrabalUrl = await uploadImage('media__1782774110772.png', 'Mwmi59l3oW3TwrQJJaSP');
  const localCalendarUrl = await uploadImage('media__1782774503768.png', 'local_calendar_202607');
  const balsamicUrl = await uploadImage('media__1782774674934.png', 'valsamix_20260712');
  const sabelleUrl = await uploadImage('media__1782774680761.jpg', 'popup_sabelle_20260725');
  const andanteUrl = await uploadImage('media__1782774704488.png', 'YzYzfVNnYqPJ7riMwPWT');
  const tantolocoUrl = await uploadImage('media__1782775085241.png', 'q1s26mCgT2h40KhIGQxE');
  const tangofireUrl = await uploadImage('media__1782775424915.jpg', 'lp3DufRSyK0S49pkOKnE');
  const casaUrl = await uploadImage('media__1782775616355.jpg', 'bb1YNxoL4iXtfEdDtUbJ');

  // --- 2. 누락 지방 베뉴 신규 등록 ---
  console.log('Creating local venues...');
  const venuesData = {
    ulsan_deluna: { name: 'Delluna', nameKo: '델루나', city: 'ULSAN', address: '울산광역시 남구 왕생로 45번길 6 6층' },
    pohang_postango: { name: 'Postango', nameKo: '포스탱고', city: 'POHANG', address: '경상북도 포항시 남구 중앙로 153 3층' },
    jinju_tangopeople: { name: 'Tango People', nameKo: '탱고피플', city: 'JINJU', address: '경상남도 진주시 평거로 3층' },
    suncheon_tango: { name: 'Suncheon Tango', nameKo: '순천탱고', city: 'SUNCHEON', address: '전라남도 순천시 대석3길 7 2층' },
    daegu_abrazo: { name: 'Abrazos', nameKo: '아브라소', city: 'DAEGU', address: '대구광역시 중구 동덕로 36번길 24 2층' },
    masan_parkmitango: { name: 'Parkmi Tango', nameKo: '박미탱고', city: 'CHANGWON', address: '경상남도 창원시 마산합포구 창동거리길 24-2' },
    gwangju_mivida: { name: 'Mivida', nameKo: '미비다', city: 'GWANGJU', address: '광주광역시 동구 중앙로 162-1 5층' },
    cheongju_abrazo: { name: 'Abrazos', nameKo: '청주 아브라소', city: 'CHEONGJU', address: '충청북도 청주시 상당로 120 2층' }
  };

  for (const [id, data] of Object.entries(venuesData)) {
    await db.collection('venues').doc(id).set({
      ...data,
      country: 'KR',
      createdAt: admin.firestore.Timestamp.now()
    }, { merge: true });
  }

  // --- 3. 피스타 관련 정기 문서 업데이트 ---
  console.log('Updating Pista Monday Practica...');
  await db.collection('socials').doc('5uTDbVd36Pa0KAxJXJQH').update({
    imageUrl: pMonUrl,
    staffNames: ['코난', '추우']
  });

  const dayPracticaIds = ['82e5OLQtPv4sG4Qj53jk', 'sDR7G2GDyPFmsZ5imddI', 'EOOvigAsxOAS9XhJ3PD4', 'EfT2eoD5mpvIKEJvomnD'];
  for (const id of dayPracticaIds) {
    console.log(`Updating Daytime Practica ${id}...`);
    await db.collection('socials').doc(id).update({
      imageUrl: pDayUrl,
      staffNames: ['추우']
    });
  }

  console.log('Creating/Updating regular Sunday Practica...');
  await db.collection('socials').doc('pista_sunday_practica').set({
    type: 'regular',
    subCategory: 'practica',
    title: 'Pista Sunday Practica',
    titleNative: '피스타 일요 쁘락띠카',
    dayOfWeek: 0,
    recurrence: 'every',
    startTime: '10:00',
    endTime: '16:00',
    venueId: 'xVJsZb5y34WjlqP5iHDr', // 올바른 피스타 베뉴 ID
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    imageUrl: pSunUrl,
    staffNames: ['추우'],
    description: '7월 한정 일요일 피스타 쁘락띠카\n\n• 1차: 10 AM ~ 1 PM\n• 2차: 1 PM ~ 4 PM\n• 쁘락지기: 추우 (010-8480-3114)\n• 1회: 10,000원\n* 7/5(일)은 낮 밀롱가(밀빠소)로 인해 2차 쁘락은 쉬어갑니다!',
    country: 'KR',
    city: 'SEOUL',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  console.log('Updating Abrazo Milonga djs...');
  const abrazoDjs = [
    { date: '2026-07-01', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260701' },
    { date: '2026-07-08', djName: 'Arman', djNameNative: '아르만', id: 'dj-arman-20260708' },
    { date: '2026-07-15', djName: 'Cynthia', djNameNative: '신시아', id: 'dj-cynthia-20260715' },
    { date: '2026-07-22', djName: 'Isabelle', djNameNative: '이사벨', id: 'dj-isabelle-20260722' },
    { date: '2026-07-29', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260729' }
  ];
  await db.collection('socials').doc('B2aYZK9mZF6zUUpQEUw1').update({
    djs: abrazoDjs,
    djName: 'Henry',
    djNameNative: '헨리'
  });

  console.log('Updating The PISTA djs...');
  const thePistaDjs = [
    { date: '2026-07-04', djName: 'Eddy', djNameNative: '에디', id: 'dj-eddy-20260704' },
    { date: '2026-07-11', djName: 'Hug', djNameNative: '허그', id: 'dj-hug-20260711' },
    { date: '2026-07-18', djName: 'Gianluca', djNameNative: '지안루카', id: 'dj-gianluca-20260718' },
    { date: '2026-07-25', djName: 'Mint', djNameNative: '민트', id: 'dj-mint-20260725' }
  ];
  await db.collection('socials').doc('zkZm9gZvHdnSPzSOR5Gp').update({
    djs: thePistaDjs,
    djName: 'Eddy',
    djNameNative: '에디'
  });

  console.log('Updating Pista Night Milonga djs...');
  const nightDjs = [
    { date: '2026-07-04', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260704' },
    { date: '2026-07-11', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260711' },
    { date: '2026-07-18', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260718' },
    { date: '2026-07-25', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260725' }
  ];
  await db.collection('socials').doc('mWo82j5uPi2esEU6qvj6').update({
    djs: nightDjs,
    djName: 'Henry',
    djNameNative: '헨리'
  });

  console.log('Updating HappG Mil for 3rd Anniversary...');
  await db.collection('socials').doc('eoH5L0XrTxkOIojB958u').update({
    djs: [{ date: '2026-07-03', djName: 'Ajit bubber', djNameNative: '아짓 버버', id: 'dj-ajit-20260703' }],
    djName: 'Ajit bubber',
    djNameNative: '아짓 버버',
    organizerName: 'HappgDay & Gonz',
    organizerNameNative: '해피데이 & 곤즈',
    description: '3주년 해피IG밀 🎂\n\n• 일시: 7월 3일 (금) 20:00 ~ 26:00 (익일 02:00)\n• DJ: Ajit bubber (India)\n• Org: 해피데이 & 곤즈'
  });

  console.log('Updating Muse Mil for 7/24...');
  await db.collection('socials').doc('v0zd2tN2sQpDRW0lSwAi').update({
    djs: [{ date: '2026-07-24', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260724' }],
    djName: 'TBA',
    djNameNative: '미정'
  });

  console.log('Updating Vivimil...');
  await db.collection('socials').doc('69W8ZzKMol1EQt5DCwZQ').update({
    djs: [{ date: '2026-07-19', djName: 'Vivian', djNameNative: '비비안', id: 'dj-vivian-20260719' }],
    djName: 'Vivian',
    djNameNative: '비비안'
  });

  console.log('Updating The Best Milonga...');
  await db.collection('socials').doc('rtuePGJdy69F3binuUCd').update({
    djs: [{ date: '2026-07-26', djName: 'Arbol', djNameNative: '아르볼', id: 'dj-arbol-20260726' }],
    djName: 'Arbol',
    djNameNative: '아르볼'
  });

  console.log('Updating Milpasso...');
  await db.collection('socials').doc('milpasso_milonga_20260705').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'MILPASSO',
    titleNative: '밀빠소',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-05T00:00:00Z')),
    startTime: '14:00',
    endTime: '18:00',
    djName: 'Victor',
    djNameNative: '빅터',
    djs: [{ date: '2026-07-05', djName: 'Victor', djNameNative: '빅터', id: 'dj-victor-20260705' }],
    organizerId: 'manual_ian',
    organizerName: 'Ian',
    organizerNameNative: '이안',
    organizerIds: ['manual_ian'],
    organizerNames: ['Ian'],
    organizerNativeNames: ['이안'],
    venueId: 'xVJsZb5y34WjlqP5iHDr', // 올바른 피스타 베뉴 ID
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    imageUrl: pCalendarUrl,
    description: '밀빠소 일요 낮밀\n\n• 일시: 7월 5일 (일) 14:00 ~ 18:00\n• DJ: Victor\n• Org: 이안\n* 2차 쁘락은 쉬어갑니다!',
    country: 'KR',
    city: 'SEOUL'
  }, { merge: true });
  await db.collection('socials').doc('popup_milpasso_20260705').delete();

  console.log('Adding Pista Friday popups...');
  await db.collection('socials').doc('popup_pista_grand_20260710').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Diego & Aldana Grand Milonga',
    titleNative: '디에고 & 알다나 그랜드 밀롱가',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-10T00:00:00Z')),
    startTime: '20:00',
    endTime: '26:00',
    djName: 'Agnes',
    djNameNative: '아그네스',
    djs: [{ date: '2026-07-10', djName: 'Agnes', djNameNative: '아그네스', id: 'dj-agnes-20260710' }],
    organizerId: 'manual_eve',
    organizerName: 'Eve',
    organizerNameNative: '이브',
    organizerIds: ['manual_eve'],
    organizerNames: ['Eve'],
    organizerNativeNames: ['이브'],
    venueId: 'xVJsZb5y34WjlqP5iHDr',
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    imageUrl: pCalendarUrl,
    description: 'SPECIAL 디에고 & 알다나 Grand Milonga\n\n• 일시: 7월 10일 (금) 20:00 ~ 26:00 (익일 02:00)\n• DJ: Agnes\n• Org: 이브',
    country: 'KR',
    city: 'SEOUL'
  }, { merge: true });

  await db.collection('socials').doc('popup_pista_maje_20260717').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Maje Milonga',
    titleNative: '마제밀',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-17T00:00:00Z')),
    startTime: '19:00',
    endTime: '23:00',
    djName: 'Mano',
    djNameNative: '마노',
    djs: [{ date: '2026-07-17', djName: 'Mano', djNameNative: '마노', id: 'dj-mano-20260717' }],
    organizerId: 'manual_marco_jacob',
    organizerName: 'Marco & Jacob',
    organizerNameNative: '마르코 & 제이콥',
    organizerIds: ['manual_marco', 'manual_jacob'],
    organizerNames: ['Marco', 'Jacob'],
    organizerNativeNames: ['마르코', '제이콥'],
    venueId: 'xVJsZb5y34WjlqP5iHDr',
    venueName: 'Tango Pista',
    venueNameNative: '피스타',
    imageUrl: pCalendarUrl,
    description: '마제밀 (탱3-발3-밀3-AM3)\n\n• 일시: 7월 17일 (금) 19:00 ~ 23:00\n• DJ: Mano\n• Org: 마르코 & 제이콥',
    country: 'KR',
    city: 'SEOUL'
  }, { merge: true });

  // --- 4. 아미가 밀롱가 업데이트 ---
  console.log('Updating Amiga Milonga...');
  const amigaDjs = [
    { date: '2026-07-11', djName: 'Epitone', djNameNative: '에피톤', id: 'dj-epitone-20260711' },
    { date: '2026-08-08', djName: 'Babi', djNameNative: '바비', id: 'dj-babi-20260808' },
    { date: '2026-09-12', djName: 'Jini', djNameNative: '지니', id: 'dj-jini-20260912' },
    { date: '2026-10-10', djName: 'Lucila', djNameNative: '루씰라', id: 'dj-lucila-20261010' },
    { date: '2026-11-14', djName: 'Nakhwayusu', djNameNative: '낙화유수', id: 'dj-nakhwayusu-20261114' },
    { date: '2026-12-12', djName: 'H.JUN', djNameNative: '에이치준', id: 'dj-hjun-20261212' }
  ];
  await db.collection('socials').doc('W0rG3vtQnBFr2vIhcFGC').update({
    imageUrl: amigaUrl,
    djs: amigaDjs,
    djName: 'Epitone',
    djNameNative: '에피톤',
    organizerId: 'manual_grace_louis_jessie',
    organizerName: 'Grace, Louis, Jessie',
    organizerNameNative: '그레이스, 루이스, 제시',
    organizerIds: ['manual_grace', 'manual_louis', 'manual_jessie'],
    organizerNames: ['Grace', 'Louis', 'Jessie'],
    organizerNativeNames: ['그레이스', '루이스', '제시'],
    staffNames: ['벨제붑', '서영', '잼잼'],
    description: '📢 아미가 밀롱가 하반기 일정 공지 📢\n설렘 가득 유쾌하고 따뜻한 아브라소가 있는 아미가밀롱가\n\n• 7/11: 에피톤 (서울)\n• 8/8: 바비 (대전)\n• 9/12: 지니 (대전)\n• 10/10: 루씰라 (부산) @아수까 (핸썸밀 연합)\n• 11/14: 낙화유수 (서울)\n• 12/12: H.JUN (서울, 아미가 1주년)\n\n• 시간: PM 9시 ~ AM 1시\n• 장소: 대전아수까 (아주카르 - 대전 유성구 대학로 127-1)\n• 입장료: 12,000원'
  });

  console.log('Adding 8/16 Amiga & Humil union popup...');
  await db.collection('socials').doc('popup_amiga_dia_20260816').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Amiga & Humil Special Milonga',
    titleNative: '휴밀 & 아미가 Special 밀롱가',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-08-16T00:00:00Z')),
    startTime: '14:00',
    endTime: '23:00',
    djName: 'Babi',
    djNameNative: '바비',
    djs: [{ date: '2026-08-16', djName: 'Babi', djNameNative: '바비', id: 'dj-babi-20260816' }],
    organizerId: 'manual_grace_louis_jessie',
    organizerName: 'Grace, Louis, Jessie',
    organizerNameNative: '그레이스, 루이스, 제시',
    organizerIds: ['manual_grace', 'manual_louis', 'manual_jessie'],
    organizerNames: ['Grace', 'Louis', 'Jessie'],
    organizerNativeNames: ['그레이스', '루이스', '제시'],
    venueId: 'gmSqw4sSUBWeX4jIvoGV',
    venueName: 'Tango Cafe Dia',
    venueNameNative: '탱고카페디아',
    imageUrl: localCalendarUrl,
    description: '대구에서 만나는 아미가! 유쾌한 웃음, 따뜻한 아브라소\n\n• 일시: 8월 16일 (일) 14:00 ~ 23:00\n🔹️휴밀: PM 2:00 ~ 6:00\n🔹️아미가: PM 7:00 ~ 11:00\n• DJ: 바비 (Babi - 대전)\n• 장소: 대구 탱고카페디아',
    country: 'KR',
    city: 'DAEGU',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  // --- 5. 스튜디오242 월요 쁘락 업데이트 ---
  console.log('Updating Studio 242 Monday Practica...');
  await db.collection('socials').doc('busan_studio242_mondaypractica').update({
    imageUrl: s242Url,
    organizerId: 'manual_clara_anna',
    organizerName: 'Clara & Anna',
    organizerNameNative: '클라라 & 안나',
    organizerIds: ['manual_clara', 'manual_anna'],
    organizerNames: ['Clara', 'Anna'],
    organizerNativeNames: ['클라라', '안나'],
    description: '월요일은 쁘락입니다\n땅고를 연습하고 싶은 그대를 위한 자율과 타율이 공존하는 시간~\n편안한 복장으로 가볍게 오세요.\n\n• 일시: 매주 월요일 저녁 8시 ~ 11시\n• 입장료: 10,000원 (3개월 등록 시 100,000원)\n• 장소: 스튜디오 242 (부산진구 부전동 242-32)\n• 문의: 클라라 (010-9325-6055)\n• 계좌: 우리은행 정진주 773-148295-02-001'
  });

  // --- 6. 대전 까미니또 업데이트 및 팝업 추가 ---
  console.log('Updating Caminito First Sat Milonga...');
  await db.collection('socials').doc('WDU3IQ16GJXtj2mR4asg').update({
    imageUrl: cam1Url,
    djs: [{ date: '2026-07-04', djName: 'Haena', djNameNative: '해나', id: 'dj-haena-20260704' }],
    djName: 'Haena',
    djNameNative: '해나'
  });

  console.log('Adding Caminito popup events...');
  await db.collection('socials').doc('popup_caminito_amigo_20260717').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Amigo Milonga',
    titleNative: '아미고 밀롱가',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-17T00:00:00Z')),
    startTime: '20:00',
    endTime: '23:30',
    djName: 'Yugamdoc',
    djNameNative: '유감독',
    djs: [{ date: '2026-07-17', djName: 'Yugamdoc', djNameNative: '유감독', id: 'dj-yugamdoc-20260717' }],
    organizerId: 'manual_caminito',
    organizerName: 'Caminito',
    organizerNameNative: '까미니또',
    organizerIds: ['manual_caminito'],
    organizerNames: ['Caminito'],
    organizerNativeNames: ['까미니또'],
    venueId: 'vImTEXhc9Jcs6HWcMvoe',
    venueName: 'Caminito',
    venueNameNative: '까미니또',
    imageUrl: cam2Url,
    description: '대전 까미니또 아미고 밀롱가\n\n• 일시: 7월 17일 (금) 20:00 ~ 23:30 (8시 ~ 11시 30분)\n• DJ: 유감독님 (대전)\n• 입장료: 10,000원 (정기회원 5,000원)\n• 장소: 대전 까미니또 (유성 계룡로66번길 5 3층)',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  await db.collection('socials').doc('popup_caminito_beginner_20260720').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Beginner Milonga',
    titleNative: '초급밀롱가',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-20T00:00:00Z')),
    startTime: '20:00',
    endTime: '22:30',
    djName: 'Wolkwang',
    djNameNative: '월광',
    djs: [{ date: '2026-07-20', djName: 'Wolkwang', djNameNative: '월광', id: 'dj-wolkwang-20260720' }],
    organizerId: 'manual_caminito',
    organizerName: 'Caminito',
    organizerNameNative: '까미니또',
    organizerIds: ['manual_caminito'],
    organizerNames: ['Caminito'],
    organizerNativeNames: ['까미니또'],
    venueId: 'vImTEXhc9Jcs6HWcMvoe',
    venueName: 'Caminito',
    venueNameNative: '까미니또',
    imageUrl: cam3Url,
    description: '초급이지만 고급같은 밀롱가 (월요 수업과 함께하는 초급밀롱가)\n\n• 일시: 7월 20일 (월) 20:00 ~ 22:30 (월요수업 19:00 ~ 19:50)\n• DJ: 월광 (까미니또)\n• 입장료: 10,000원 (정기회원 Free)\n• 장소: 대전 까미니또 (유성 계룡로66번길 5 3층)',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  // --- 7. 대전 오나다 업데이트 및 팝업 추가 ---
  console.log('Updating Daejeon Onada regular socials...');
  await db.collection('socials').doc('oVWQT5PCGg2RUcKeX8qW').update({
    imageUrl: oCalendarUrl,
    djs: [{ date: '2026-07-03', djName: 'If', djNameNative: '이프', id: 'dj-if-20260703' }],
    djName: 'If',
    djNameNative: '이프'
  });

  const satOnadaDoc = await db.collection('socials').doc('S7dzFrXEnq1WnDIjgDgx').get();
  let satDjs = [];
  if (satOnadaDoc.exists) {
    satDjs = satOnadaDoc.data().djs || [];
  }
  satDjs = satDjs.filter(d => d.date !== '2026-07-04' && d.date !== '2026-07-11');
  satDjs.push(
    { date: '2026-07-04', djName: 'Udong', djNameNative: '우동', id: 'dj-udong-20260704' },
    { date: '2026-07-11', djName: 'Rumali', djNameNative: '루말리', id: 'dj-rumali-20260711' }
  );
  await db.collection('socials').doc('S7dzFrXEnq1WnDIjgDgx').update({
    imageUrl: oCalendarUrl,
    djs: satDjs,
    djName: 'Udong',
    djNameNative: '우동'
  });

  await db.collection('socials').doc('baCPAjVOe8Ihv3K21WOa').update({
    imageUrl: oCalendarUrl,
    djs: [{ date: '2026-07-25', djName: 'Gwenchanayu', djNameNative: '괜찮아유', id: 'dj-gwenchanayu-20260725' }],
    djName: 'Gwenchanayu',
    djNameNative: '괜찮아유'
  });

  await db.collection('socials').doc('daejeon_jjin_milonga_20260718').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Daejeon JJin Milonga',
    titleNative: '대전 찐밀롱가',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-18T00:00:00Z')),
    startTime: '21:00',
    endTime: '25:00',
    djName: 'Primera',
    djNameNative: '프리메라',
    djs: [{ date: '2026-07-18', djName: 'Primera', djNameNative: '프리메라', id: 'dj-primera-20260718' }],
    organizerId: 'manual_onada',
    organizerName: 'Daejeon Onada',
    organizerNameNative: '대전 오나다',
    organizerIds: ['manual_onada'],
    organizerNames: ['Daejeon Onada'],
    organizerNativeNames: ['대전 오나다'],
    venueId: 'Ui2cNpoNKhFAFjyN3vy7',
    venueName: 'Onada',
    venueNameNative: '대전오나다',
    imageUrl: oCalendarUrl,
    description: '대전 오나다 프리메라 & 찐밀\n\n• 일시: 7월 18일 (토) PM 9:00 ~ AM 1:00\n• DJ: Primera (프리메라)',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  console.log('Adding Daejeon Onada popups...');
  await db.collection('socials').doc('popup_onada_centre_20260710').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Centremil',
    titleNative: '센뜨레밀',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-10T00:00:00Z')),
    startTime: '21:00',
    endTime: '25:00',
    djName: 'Centre',
    djNameNative: '센뜨레',
    djs: [{ date: '2026-07-10', djName: 'Centre', djNameNative: '센뜨레', id: 'dj-centre-20260710' }],
    organizerId: 'manual_onada',
    organizerName: 'Daejeon Onada',
    organizerNameNative: '대전 오나다',
    organizerIds: ['manual_onada'],
    organizerNames: ['Daejeon Onada'],
    organizerNativeNames: ['대전 오나다'],
    venueId: 'Ui2cNpoNKhFAFjyN3vy7',
    venueName: 'Onada',
    venueNameNative: '대전오나다',
    imageUrl: oCalendarUrl,
    description: '대전 오나다 센뜨레밀\n\n• 일시: 7월 10일 (금) PM 9:00 ~ AM 1:00\n• DJ: Centre',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  await db.collection('socials').doc('popup_onada_babi_20260717').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Babimil',
    titleNative: '바비밀',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-17T00:00:00Z')),
    startTime: '21:00',
    endTime: '25:00',
    djName: 'Babi',
    djNameNative: '바비',
    djs: [{ date: '2026-07-17', djName: 'Babi', djNameNative: '바비', id: 'dj-babi-20260717' }],
    organizerId: 'manual_onada',
    organizerName: 'Daejeon Onada',
    organizerNameNative: '대전 오나다',
    organizerIds: ['manual_onada'],
    organizerNames: ['Daejeon Onada'],
    organizerNativeNames: ['대전 오나다'],
    venueId: 'Ui2cNpoNKhFAFjyN3vy7',
    venueName: 'Onada',
    venueNameNative: '대전오나다',
    imageUrl: oCalendarUrl,
    description: '대전 오나다 바비밀\n\n• 일시: 7월 17일 (금) PM 9:00 ~ AM 1:00\n• DJ: Babi',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  await db.collection('socials').doc('popup_onada_prack_20260724').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Prackmil',
    titleNative: '쁘락밀',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-24T00:00:00Z')),
    startTime: '21:00',
    endTime: '25:00',
    djName: 'Prack',
    djNameNative: '쁘락',
    djs: [{ date: '2026-07-24', djName: 'Prack', djNameNative: '쁘락', id: 'dj-prack-20260724' }],
    organizerId: 'manual_onada',
    organizerName: 'Daejeon Onada',
    organizerNameNative: '대전 오나다',
    organizerIds: ['manual_onada'],
    organizerNames: ['Daejeon Onada'],
    organizerNativeNames: ['대전 오나다'],
    venueId: 'Ui2cNpoNKhFAFjyN3vy7',
    venueName: 'Onada',
    venueNameNative: '대전오나다',
    imageUrl: oCalendarUrl,
    description: '대전 오나다 쁘락밀\n\n• 일시: 7월 24일 (금) PM 9:00 ~ AM 1:00\n• DJ: Prack',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  await db.collection('socials').doc('popup_onada_geum_20260731').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Geummil',
    titleNative: '금밀',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-31T00:00:00Z')),
    startTime: '21:00',
    endTime: '25:00',
    djName: 'Geum',
    djNameNative: '금',
    djs: [{ date: '2026-07-31', djName: 'Geum', djNameNative: '금', id: 'dj-geum-20260731' }],
    organizerId: 'manual_onada',
    organizerName: 'Daejeon Onada',
    organizerNameNative: '대전 오나다',
    organizerIds: ['manual_onada'],
    organizerNames: ['Daejeon Onada'],
    organizerNativeNames: ['대전 오나다'],
    venueId: 'Ui2cNpoNKhFAFjyN3vy7',
    venueName: 'Onada',
    venueNameNative: '대전오나다',
    imageUrl: oCalendarUrl,
    description: '대전 오나다 금밀\n\n• 일시: 7월 31일 (금) PM 9:00 ~ AM 1:00\n• DJ: Geum',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  // --- 8. 부산 아라발 밀롱가 업데이트 ---
  console.log('Updating Arrabal Milonga...');
  await db.collection('socials').doc('Mwmi59l3oW3TwrQJJaSP').update({
    imageUrl: arrabalUrl,
    djs: [{ date: '2026-07-01', djName: 'Federico', djNameNative: '페데리코', id: 'dj-federico-20260701' }],
    djName: 'Federico',
    djNameNative: '페데리코',
    organizerId: 'manual_selene',
    organizerName: 'Selene',
    organizerNameNative: '셀린',
    organizerIds: ['manual_selene'],
    organizerNames: ['Selene'],
    organizerNativeNames: ['셀린'],
    price: '12,000',
    startTime: '20:00',
    endTime: '23:00',
    venueId: '1eykxj8fWMhHJ7ZtAjVP',
    venueName: 'Corteño',
    venueNameNative: '코르테뇨',
    description: '부산 수요일 아라발 밀롱가 (Busan Wednesday Milonga Arrabal)\n\n• 일시: 7월 1일 (수) 20:00 ~ 23:00\n• DJ: Federico (페데리코)\n• Org: 셀린 (Selene)\n• 장소: 꼬르떼뇨 스튜디오 (부산진구 신천대로 62번길 73 4층)\n• 입장료: 12,000원\n• 예약/문의: 셀린 (010-4860-0919)'
  });

  // --- 9. 달빛 쁘락 업데이트 ---
  console.log('Updating Moonlight Practica venue...');
  await db.collection('socials').doc('S5tT98NNmiJpIiMZYKmV').update({
    venueId: '6Z5SuLBNSGZezwBgJ5r0',
    venueName: 'Ocho',
    venueNameNative: '오초',
    description: '매주 월요일 달빛쁘락 🌙\n잘 보여주기 위한 춤이 아니라 서로를 존중하며 함께 머무는 춤을 지향합니다.\n천천히, 하지만 함께 계속 걸어가요.\n\n• 일시: 매주 월요일 20:00 ~ 23:00\n• 입장료: 15,000원\n• 장소: 스튜디오 오초 (서울 마포구 월드컵북로2길 57, B1)\n* 7월 첫 주 월요일(7월 6일)부터는 스튜디오 오초에서 진행됩니다!'
  });

  // --- 10. 엔빠스 발사믹 & 사베리 밀롱가 업데이트 및 추가 ---
  console.log('Updating En Paz socials...');
  await db.collection('socials').doc('valsamix_20260712').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'ValSaMix',
    titleNative: '발사믹 밀롱가',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-12T00:00:00Z')),
    startTime: '18:00',
    endTime: '22:00',
    djName: 'Henry',
    djNameNative: '헨리',
    djs: [{ date: '2026-07-12', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260712' }],
    organizerId: 'manual_elsa_isabelle',
    organizerName: 'Elsa & Isabelle',
    organizerNameNative: '엘사 & 이사벨',
    organizerIds: ['manual_elsa', 'manual_isabelle'],
    organizerNames: ['Elsa', 'Isabelle'],
    organizerNativeNames: ['엘사', '이사벨'],
    venueId: 'Hgy2FrsR7F5jJvKMtOK3',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스',
    imageUrl: balsamicUrl,
    description: '발사믹 밀롱가 (VALS AM MIX MILONGA)\n#발스가 2배인 딴다 구성 (탱탱발AM 탱발밀AM)\n\n• 일시: 7월 12일 (일) PM 6:00 ~ 10:00\n• DJ: Henry (헨리)\n• Org: 엘사 & 이사벨\n• 장소: 엔빠스 스튜디오 (서울 서초구 반포대로30길 82)\n• 입장료: 13,000원\n• 문의: 이사벨 (010-8850-6520), 엘사 (010-8547-6711)',
    country: 'KR',
    city: 'SEOUL',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  await db.collection('socials').doc('popup_sabelle_20260725').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'SABELL.E',
    titleNative: '사베리밀',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-25T00:00:00Z')),
    startTime: '19:00',
    endTime: '23:00',
    djName: 'Isabelle',
    djNameNative: '이사벨',
    djs: [{ date: '2026-07-25', djName: 'Isabelle', djNameNative: '이사벨', id: 'dj-isabelle-20260725' }],
    organizerId: 'manual_isabelle',
    organizerName: 'Isabelle',
    organizerNameNative: '이사벨',
    organizerIds: ['manual_isabelle'],
    organizerNames: ['Isabelle'],
    organizerNativeNames: ['이사벨'],
    venueId: 'Hgy2FrsR7F5jJvKMtOK3',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스',
    imageUrl: sabelleUrl,
    description: '사베리밀롱가 (SABELL.E - 우리가 좋아하는 곡만!)\n#KPOP 인 가요딴다가 정해져 있는 게 특징 (탱탱발AM 탱탱밀GAYO)\n\n• 일시: 7월 25일 (토) PM 7:00 ~ 11:00\n• DJ: Isabelle (이사벨)\n• 장소: 엔빠스 스튜디오 (서울 서초구 반포대로30길 82)\n• 입장료: 13,000원',
    country: 'KR',
    city: 'SEOUL',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  await db.collection('socials').doc('popup_sabelle_20260726').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'SABELL.E',
    titleNative: '사베리밀',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-26T00:00:00Z')),
    startTime: '18:00',
    endTime: '22:00',
    djName: 'Isabelle',
    djNameNative: '이사벨',
    djs: [{ date: '2026-07-26', djName: 'Isabelle', djNameNative: '이사벨', id: 'dj-isabelle-20260726' }],
    organizerId: 'manual_isabelle',
    organizerName: 'Isabelle',
    organizerNameNative: '이사벨',
    organizerIds: ['manual_isabelle'],
    organizerNames: ['Isabelle'],
    organizerNativeNames: ['이사벨'],
    venueId: 'Hgy2FrsR7F5jJvKMtOK3',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스',
    imageUrl: sabelleUrl,
    description: '사베리밀롱가 (SABELL.E - 우리가 좋아하는 곡만!)\n#KPOP 인 가요딴다가 정해져 있는 게 특징 (탱탱발AM 탱탱밀GAYO)\n\n• 일시: 7월 26일 (일) PM 6:00 ~ 10:00\n• DJ: Isabelle (이사벨)\n• 장소: 엔빠스 스튜디오 (서울 서초구 반포대로30길 82)\n• 입장료: 13,000원',
    country: 'KR',
    city: 'SEOUL',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  // --- 11. 안단테 애프터눈 밀롱가 업데이트 ---
  console.log('Updating Andante Afternoon Milonga...');
  await db.collection('socials').doc('YzYzfVNnYqPJ7riMwPWT').update({
    imageUrl: andanteUrl,
    organizerId: 'manual_dan_a',
    organizerName: 'Dan-a Choi',
    organizerNameNative: '최단아',
    organizerIds: ['manual_dan_a'],
    organizerNames: ['Dan-a Choi'],
    organizerNativeNames: ['최단아'],
    description: '🌿 Afternoon Milonga (AM) 🌿\n안단테의 활기차고 여유로운 낮밀롱가\n토요일 오후 3시, Tango 2 + AM 2 구성으로 힐링 AM과 탱고 감성 가득한 음악이 함께합니다.\n\n• 일시: 매주 토요일 15:00 ~ 19:00\n• 장소: 안단테 (Tango Andante - 서울 마포구 양화로12길 24)\n• 입장료: 13,000원\n• 혜택:\n1. 4인 테이블 예약 시 로버트 몬다비 와인 1병 풀 세팅 제공\n2. 낮밀(AM) + 까베세오 저녁밀 함께 오시면 낮밀 프리티켓 증정 (한 번에 구입 시)'
  });

  // --- 12. 딴또로꼬 업데이트 ---
  console.log('Updating Tanto Loco Milonga...');
  await db.collection('socials').doc('q1s26mCgT2h40KhIGQxE').update({
    imageUrl: tantolocoUrl,
    djs: [{ date: '2026-07-05', djName: 'Ban-A', djNameNative: '반아', id: 'dj-bana-20260705' }],
    djName: 'Ban-A',
    djNameNative: '반아',
    organizerId: 'manual_martini',
    organizerName: 'Martini',
    organizerNameNative: '마티니',
    organizerIds: ['manual_martini'],
    organizerNames: ['Martini'],
    organizerNativeNames: ['마티니'],
    startTime: '19:00',
    endTime: '24:00',
    venueId: '6Z5SuLBNSGZezwBgJ5r0', // 클럽 오초
    venueName: 'Ocho Tango Club',
    venueNameNative: '클럽오초',
    description: 'Tanto Loco 딴또로꼬\n매월 첫번째 일요일, 딴또로꼬와 함께해요!\n\n• 일시: 7월 5일 (일) 19:00 ~ 24:00 (오후 7시 - 12시)\n• DJ: 반아 (Ban-A) 님\n• Org: 마티니 (Martini)\n• 장소: 클럽 오초 (Ocho Tango Club - 서울 마포구 월드컵북로2길 57, B1)\n• 예약/문의: 마티니 (카톡 chongssa)'
  });

  // --- 13. 탱고 파이어 (화밀) 업데이트 ---
  console.log('Updating Tango Fire Milonga...');
  const fireDjs = [
    { date: '2026-06-16', djName: 'Gianluca', djNameNative: '쟌루카', id: 'dj-gianluca-20260616' },
    { date: '2026-06-30', djName: 'Gonz', djNameNative: '곤즈', id: 'dj-gonz-20260630' }
  ];
  await db.collection('socials').doc('lp3DufRSyK0S49pkOKnE').update({
    imageUrl: tangofireUrl,
    djs: fireDjs,
    djName: 'Gonz',
    djNameNative: '곤즈',
    organizerId: 'manual_iri_cecil',
    organizerName: 'Iri & Cecil',
    organizerNameNative: '이리 & 세실',
    organizerIds: ['manual_iri', 'manual_cecil'],
    organizerNames: ['Iri', 'Cecil'],
    organizerNativeNames: ['이리', '세실'],
    description: 'Tango Fire 화요밀롱가 (화밀)\n이리 & 세실의 특강과 함께하는 정제되고 든든한 화요 밀롱가\n\n• 일시: 매주 화요일 20:30 ~ 24:00\n• 6/30 (오늘) DJ: 곤즈 (Gonz) 님\n• 6/30 특강: 이리 & 세실 (주제: 살롱 공연의 꽃 히로 엔로스케)\n• 장소: 라 벤따나 (La Ventana - 서울 마포구 잔다리로 48)\n• 문의/연락처: 이리 (010-2200-3859), 세실 (010-5020-1433)'
  });

  // --- 14. 까사 밀롱가 업데이트 ---
  console.log('Updating Casa Milonga...');
  const casaDjs = [
    { djId: 'DbmJ8WktrCXBLsiHgqBJM9Nc7BQ2', id: '0e677306-7b89-4b76-9110-abe12cce38fc', date: '2026-06-09', djNativeName: '나초', djName: 'Nacho' },
    { djName: 'Eugene', date: '2026-06-16', id: 'dj_ka7bzhudw', djNameNative: '유진' },
    { date: '2026-06-30', djName: 'Rachael', djNameNative: '레이첼', id: 'dj-rachael-20260630' },
    { djId: 'DbmJ8WktrCXBLsiHgqBJM9Nc7BQ2', date: '2026-07-28', id: 'jwkgpl0dq_1780454439810', djName: 'Nacho', djNativeName: '나초' }
  ];
  await db.collection('socials').doc('bb1YNxoL4iXtfEdDtUbJ').update({
    imageUrl: casaUrl,
    djs: casaDjs,
    djName: 'Rachael',
    djNameNative: '레이첼',
    organizerId: 'manual_geff',
    organizerName: 'Geff',
    organizerNameNative: '게프',
    organizerIds: ['manual_geff'],
    organizerNames: ['Geff'],
    organizerNativeNames: ['게프'],
    description: 'CASA 까사 밀롱가 (Música & Pista & Corazón)\n매주 화요일 클럽 오초에서 즐기는 따뜻한 까사 밀롱가\n\n• 일시: 매주 화요일 20:00 ~ 24:00 (오후 8시 ~ 12시)\n• 6/30 (오늘) DJ: 레이첼 (Rachael - Rachael JeongWon Kim) 님\n• Org: 게프 (Geff)\n• 장소: 클럽 오초 (Ocho Tango Club - 서울 마포구 월드컵북로2길 57, B1)\n• 테이블 예약: 게프 (010-2852-4416 / 카톡 GEFF2010)'
  });

  // --- 15. 지방 7월 전체 일정 동기화 ---
  console.log('Syncing local July schedules...');

  // (1) 대구 아브라소 월요 월롱가
  await db.collection('socials').doc('daegu_abrazo_monday_wallonga').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Wallonga',
    titleNative: '월롱가',
    dayOfWeek: 1,
    recurrence: 'every',
    startTime: '20:00',
    endTime: '23:00',
    venueId: 'daegu_abrazo',
    venueName: 'Abrazos',
    venueNameNative: '아브라소',
    imageUrl: localCalendarUrl,
    description: '대구 아브라소 월요 월롱가\n\n• 일시: 매주 월요일 20:00 ~ 23:00',
    country: 'KR',
    city: 'DAEGU'
  }, { merge: true });

  // (2) 부산 이데알 화요 화밀
  await db.collection('socials').doc('busan_ideal_tuesday_hwamil').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Hwamil',
    titleNative: '화밀',
    dayOfWeek: 2,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '23:30',
    venueId: 'hF6R1lIMNly8DJIiNGvD',
    venueName: 'Ideal Studio',
    venueNameNative: '이데알 스튜디오',
    imageUrl: localCalendarUrl,
    description: '부산 이데알 화요 화밀\n\n• 일시: 매주 화요일 20:30 ~ 23:30',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (3) 대전 라붐 대전탱고
  const dtDjs = [
    { date: '2026-07-07', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260707' },
    { date: '2026-07-14', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260714' },
    { date: '2026-07-21', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260721' },
    { date: '2026-07-28', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260728' }
  ];
  await db.collection('socials').doc('daejeon_laboom_tuesday_milonga').set({
    djs: dtDjs,
    imageUrl: localCalendarUrl
  }, { merge: true });

  // (4) 대전 아주카르 땅겐미
  await db.collection('socials').doc('daejeon_azucar_wednesday_ttanggenmi').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Ttanggenmi',
    titleNative: '땅겐미',
    dayOfWeek: 3,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '23:30',
    venueId: 'xt3luTQV7HG8Xnpgged1',
    venueName: 'Azucar',
    venueNameNative: '아주카르',
    imageUrl: localCalendarUrl,
    description: '대전 아주카르 땅겐미 (매주 수 20:30 ~ 23:30)\n* 4주차는 연합밀로 진행됩니다!',
    country: 'KR',
    city: 'DAEJEON'
  }, { merge: true });

  // (5) 청주 아브라소 우르끼차
  await db.collection('socials').doc('cheongju_abrazo_wednesday_urquiza').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Urquiza',
    titleNative: '우르끼차',
    dayOfWeek: 3,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '23:30',
    venueId: 'cheongju_abrazo',
    venueName: 'Abrazos',
    venueNameNative: '청주 아브라소',
    imageUrl: localCalendarUrl,
    description: '청주 아브라소 우르끼차\n\n• 일시: 매주 수요일 20:30 ~ 23:30',
    country: 'KR',
    city: 'CHEONGJU'
  }, { merge: true });

  // (6) 대구 DIA 수DDD
  await db.collection('socials').doc('daegu_dia_wednesday_ddd').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'DDD',
    titleNative: '수DDD',
    dayOfWeek: 3,
    recurrence: 'every',
    startTime: '21:00',
    endTime: '24:00',
    venueId: 'gmSqw4sSUBWeX4jIvoGV',
    venueName: 'Tango Cafe Dia',
    venueNameNative: '탱고카페디아',
    imageUrl: localCalendarUrl,
    description: '대구 DIA 수DDD\n\n• 일시: 매주 수요일 21:00 ~ 24:00',
    country: 'KR',
    city: 'DAEGU'
  }, { merge: true });

  // (7) 부산 아미고 가또 쁘락가
  await db.collection('socials').doc('busan_amigo_wednesday_gato').set({
    type: 'regular',
    subCategory: 'practica',
    title: 'Gato Practica',
    titleNative: '가또 쁘락가',
    dayOfWeek: 3,
    recurrence: 'every',
    startTime: '21:15',
    endTime: '23:15',
    venueId: 'yDPFxKHTP2yZhNljkTlY',
    venueName: 'Amigo',
    venueNameNative: '아미고',
    imageUrl: localCalendarUrl,
    description: '부산 아미고 가또 쁘락가\n\n• 일시: 매주 수요일 21:15 ~ 23:15',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (8) 창원 마린탱고 마수밀
  const msDjs = [
    { date: '2026-07-22', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260722' },
    { date: '2026-07-29', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260729' }
  ];
  await db.collection('socials').doc('5GRXeyWEjcGmlD2MeakT').set({
    djs: msDjs,
    imageUrl: localCalendarUrl
  }, { merge: true });

  // (9) 청주 아우라 라플라타
  const rpDjs = [
    { date: '2026-07-02', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260702' },
    { date: '2026-07-09', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260709' },
    { date: '2026-07-16', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260716' },
    { date: '2026-07-23', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260723' },
    { date: '2026-07-30', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260730' }
  ];
  await db.collection('socials').doc('ezGoPc7VBQGwd2fpA7Ul').set({
    djs: rpDjs,
    imageUrl: localCalendarUrl
  }, { merge: true });

  // (10) 울산 델루나 울산탱고
  await db.collection('socials').doc('ulsan_deluna_thursday_milonga').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Ulsan Tango',
    titleNative: '울산탱고',
    dayOfWeek: 4,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '23:30',
    venueId: 'ulsan_deluna',
    venueName: 'Delluna',
    venueNameNative: '델루나',
    imageUrl: localCalendarUrl,
    description: '울산 델루나 울산탱고\n\n• 일시: 매주 목요일 20:30 ~ 23:30',
    country: 'KR',
    city: 'ULSAN'
  }, { merge: true });

  // (11) 진주 탱고피플 진주밀
  await db.collection('socials').doc('jinju_tangopeople_thursday_milonga').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Jinju Milonga',
    titleNative: '진주밀',
    dayOfWeek: 4,
    recurrence: 'every',
    startTime: '20:00',
    endTime: '23:00',
    venueId: 'jinju_tangopeople',
    venueName: 'Tango People',
    venueNameNative: '탱고피플',
    imageUrl: localCalendarUrl,
    description: '진주 탱고피플 진주밀\n\n• 일시: 매주 목요일 20:00 ~ 23:00',
    country: 'KR',
    city: 'JINJU'
  }, { merge: true });

  // (12) 부산 스튜디오242 yTu
  await db.collection('socials').doc('busan_studio242_thursday_ytu').set({
    type: 'regular',
    subCategory: 'practica',
    title: 'yTu',
    titleNative: 'yTu',
    dayOfWeek: 4,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '23:30',
    venueId: 'pF774OWFKzQOmFDnTzLC',
    venueName: 'Studio 242',
    venueNameNative: '스튜디오242',
    imageUrl: localCalendarUrl,
    description: '부산 스튜디오242 yTu\n\n• 일시: 매주 목요일 20:30 ~ 23:30',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (13) 부산 이데알 갈매기밀롱가
  await db.collection('socials').doc('busan_ideal_thursday_galmaegi').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Galmaegi Milonga',
    titleNative: '갈매기밀롱가',
    dayOfWeek: 4,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '24:30',
    venueId: 'hF6R1lIMNly8DJIiNGvD',
    venueName: 'Ideal Studio',
    venueNameNative: '이데알 스튜디오',
    imageUrl: localCalendarUrl,
    description: '부산 이데알 갈매기밀롱가\n\n• 일시: 매주 목요일 20:30 ~ 24:30',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (14) 창원 미노체 헨땅
  await db.collection('socials').doc('changwon_minoche_friday_henttang').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Mi Noche Friday Henttang',
    titleNative: '창원 헨땅',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '23:30',
    venueId: 'H3rcQ0UeSXR2HMM3Sdwd',
    venueName: 'Tango Club Mi Noche',
    venueNameNative: '미노체',
    imageUrl: localCalendarUrl,
    description: '창원 미노체 헨땅\n\n• 일시: 매주 금요일 20:30 ~ 23:30',
    country: 'KR',
    city: 'CHANGWON'
  }, { merge: true });

  // (15) 포항 포스탱고 바모스
  await db.collection('socials').doc('pohang_postango_friday_vamos').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Vamos',
    titleNative: '바모스',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '20:30',
    endTime: '23:30',
    venueId: 'pohang_postango',
    venueName: 'Postango',
    venueNameNative: '포스탱고',
    imageUrl: localCalendarUrl,
    description: '포항 포스탱고 바모스\n\n• 일시: 매주 금요일 20:30 ~ 23:30',
    country: 'KR',
    city: 'POHANG'
  }, { merge: true });

  // (16) 광주 곤땅고 곤밀롱가
  await db.collection('socials').doc('gwangju_gontango_friday_gonmilonga').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Gon Milonga',
    titleNative: '곤밀롱가',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '21:00',
    endTime: '24:00',
    venueId: 'v_manual_contango',
    venueName: 'CON TANGO',
    venueNameNative: 'S댄스아카데미',
    imageUrl: localCalendarUrl,
    description: '광주 곤땅고 곤밀롱가\n\n• 일시: 매주 금요일 21:00 ~ 24:00',
    country: 'KR',
    city: 'GWANGJU'
  }, { merge: true });

  // (17) 광주 미비다 미모사
  await db.collection('socials').doc('gwangju_mivida_friday_mimosa').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Mimosa',
    titleNative: '미모사',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '21:00',
    endTime: '23:00',
    venueId: 'gwangju_mivida',
    venueName: 'Mivida',
    venueNameNative: '미비다',
    imageUrl: localCalendarUrl,
    description: '광주 미비다 미모사 (매주 금요일 21:00 ~ 23:00)\n* 목요일에서 금요일로 개최 요일이 변경되었습니다!',
    country: 'KR',
    city: 'GWANGJU'
  }, { merge: true });

  // (18) 부산 데땅고 비밀
  await db.collection('socials').doc('busan_detango_friday_bimil').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Bimil',
    titleNative: '비밀',
    dayOfWeek: 5,
    recurrence: 'every',
    startTime: '21:00',
    endTime: '24:00',
    venueId: 'QtvRgFKNdxtrnGKYK4Or',
    venueName: 'Café de Tango',
    venueNameNative: '카페데탱고',
    imageUrl: localCalendarUrl,
    description: '부산 데땅고 비밀\n\n• 일시: 매주 금요일 21:00 ~ 24:00',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (19) 부산 아미고 부산탱고
  await db.collection('socials').doc('busan_amigo_saturday_busantango').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Busan Tango',
    titleNative: '부산탱고',
    dayOfWeek: 6,
    recurrence: 'every',
    startTime: '19:30',
    endTime: '23:30',
    venueId: 'yDPFxKHTP2yZhNljkTlY',
    venueName: 'Amigo',
    venueNameNative: '아미고',
    imageUrl: localCalendarUrl,
    description: '부산 아미고 부산탱고\n\n• 일시: 매주 토요일 19:30 ~ 23:30',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (20) 부산 미오 미오밀롱가
  await db.collection('socials').doc('busan_mio_saturday_mio').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Mio',
    titleNative: '미오',
    dayOfWeek: 6,
    recurrence: 'every',
    startTime: '21:30',
    endTime: '01:30',
    venueId: 'EiT5ufanIXxiY4qaRnbJ',
    venueName: 'Tango mio',
    venueNameNative: '탱고미오',
    imageUrl: localCalendarUrl,
    description: '부산 미오 미오밀롱가\n\n• 일시: 매주 토요일 21:30 ~ 01:30',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (21) 부산 스튜디오242 마이포
  const mpDjs = [
    { date: '2026-07-11', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260711' },
    { date: '2026-07-18', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260718' },
    { date: '2026-07-25', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260725' }
  ];
  await db.collection('socials').doc('xPKHbji68xMB4QegT4Zo').set({
    djs: mpDjs,
    imageUrl: localCalendarUrl
  }, { merge: true });

  // (22) 부산 이데알 뿌에르또 땅고
  const ptDjs = [
    { date: '2026-07-05', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260705' },
    { date: '2026-07-12', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260712' },
    { date: '2026-07-19', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260719' },
    { date: '2026-07-26', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260726' }
  ];
  await db.collection('socials').doc('fApjgip6uUZc63E4grqi').set({
    djs: ptDjs,
    imageUrl: localCalendarUrl
  }, { merge: true });

  // (23) 부산 데땅고 엔조이 부3밀
  await db.collection('socials').doc('busan_detango_sunday_bu3mil').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Enjoy Bu3mil',
    titleNative: '엔조이 부3밀',
    dayOfWeek: 0,
    recurrence: '1st, 3rd, 5th',
    startTime: '16:00',
    endTime: '20:00',
    venueId: 'QtvRgFKNdxtrnGKYK4Or',
    venueName: 'Café de Tango',
    venueNameNative: '카페데탱고',
    imageUrl: localCalendarUrl,
    description: '부산 데땅고 엔조이 부3mil (1,3,5주차 일요일 16:00 ~ 20:00)',
    country: 'KR',
    city: 'BUSAN'
  }, { merge: true });

  // (24) 부산 데땅고 밀롱가 R&D
  const rdDjs = [
    { date: '2026-07-12', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260712' },
    { date: '2026-07-26', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260726' }
  ];
  await db.collection('socials').doc('1EYcXa9cMjC5yKcgroBr').set({
    djs: rdDjs,
    imageUrl: localCalendarUrl
  }, { merge: true });

  // (25) 대전 아주카르 일요밀롱가
  const azDjs = [
    { date: '2026-07-05', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260705' },
    { date: '2026-07-12', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260712' },
    { date: '2026-07-19', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260719' },
    { date: '2026-07-26', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260726' }
  ];
  await db.collection('socials').doc('MyiJArhCuCSwXoO0dXEi').set({
    djs: azDjs,
    imageUrl: localCalendarUrl
  }, { merge: true });

  // (26) 부산 이데알 8주년 파티
  await db.collection('socials').doc('basMjXc0pCPbcPUwMpfb').update({
    imageUrl: localCalendarUrl,
    description: '이데알 스튜디오 8주년 & 사라이데알 2주년 파티 (1부 낮밀)\n\n• 일시: 7월 18일 (토) 14:30 ~ 19:00'
  });
  await db.collection('socials').doc('JPvhznJWC16joMpUcrlg').update({
    imageUrl: localCalendarUrl,
    description: '이데알 스튜디오 8주년 & 사라이데알 2주년 파티 (2부 밤밀)\n\n• 일시: 7월 18일 (토) 19:23 ~ 30:00 (익일 06:00)'
  });


  // --- 15. 지방 22개 팝업 일정 대거 일괄 추가 ---
  console.log('Adding 22 local popup events...');
  
  const popups = [
    { id: 'popup_busan_ideal_sunset_20260704', title: 'Sunset Milonga', titleNative: '선셋밀', date: '2026-07-04', startTime: '19:00', endTime: '23:00', venueId: 'hF6R1lIMNly8DJIiNGvD', venueName: 'Ideal Studio', venueNameKo: '이데알 스튜디오', city: 'BUSAN' },
    { id: 'popup_busan_s242_wagle_20260704', title: 'Wagle Wagle Milonga', titleNative: '와글와글', date: '2026-07-04', startTime: '21:00', endTime: '25:00', venueId: 'pF774OWFKzQOmFDnTzLC', venueName: 'Studio 242', venueNameKo: '스튜디오242', city: 'BUSAN' },
    { id: 'popup_daegu_abrazo_unodomingo_20260705', title: 'Uno Domingo', titleNative: '우노도밍고', date: '2026-07-05', startTime: '15:00', endTime: '19:00', venueId: 'daegu_abrazo', venueName: 'Abrazos', venueNameKo: '아브라소', city: 'DAEGU' },
    { id: 'popup_querencia_handsome_20260705', title: 'Handsome Guys', titleNative: '핸섬가이즈', date: '2026-07-05', startTime: '14:00', endTime: '19:00', venueId: 'ou1mM0LgL8gVQPLHtp77', venueName: 'Querencia', venueNameKo: '창원케렌시아', city: 'CHANGWON' },
    { id: 'popup_gwangju_contango_sunset_20260705', title: 'Sunset Milonga', titleNative: '선셋밀', date: '2026-07-05', startTime: '15:00', endTime: '19:00', venueId: 'v_manual_contango', venueName: 'CON TANGO', venueNameKo: 'S댄스아카데미', city: 'GWANGJU' },
    { id: 'popup_querencia_elnido_20260710', title: 'El Nido', titleNative: '엘니도', date: '2026-07-10', startTime: '20:30', endTime: '24:00', venueId: 'ou1mM0LgL8gVQPLHtp77', venueName: 'Querencia', venueNameKo: '창원케렌시아', city: 'CHANGWON' },
    { id: 'popup_jinju_mt_20260711', title: 'MT Milonga', titleNative: 'MT밀롱가', date: '2026-07-11', startTime: '20:00', endTime: '24:00', venueId: 'jinju_tangopeople', venueName: 'Tango People', venueNameKo: '탱고피플', city: 'JINJU' },
    { id: 'popup_busan_ideal_bef_20260711', title: 'Bef Milonga', titleNative: '베프밀', date: '2026-07-11', startTime: '19:00', endTime: '23:00', venueId: 'hF6R1lIMNly8DJIiNGvD', venueName: 'Ideal Studio', venueNameKo: '이데알 스튜디오', city: 'BUSAN' },
    { id: 'popup_daejeon_laboom_tarde_20260712', title: 'Tarde Milonga', titleNative: '따르데', date: '2026-07-12', startTime: '15:00', endTime: '19:00', venueId: 'NHWqAr89gCBFcYtISyF3', venueName: 'LaBoom', venueNameKo: '라붐', city: 'DAEJEON' },
    { id: 'popup_daegu_mariposa_naildeung_20260712', title: 'Naildeung', titleNative: '나일등', date: '2026-07-12', startTime: '15:00', endTime: '19:00', venueId: 'v_daegu_mariposa_1', venueName: 'Mariposa', venueNameKo: '대구 마리뽀사', city: 'DAEGU' },
    { id: 'popup_masan_marintango_20260712', title: 'Marine Milonga', titleNative: '마린밀롱가', date: '2026-07-12', startTime: '15:00', endTime: '19:00', venueId: 'v_manual_marine', venueName: 'Marine Tango', venueNameKo: '마린탱고', city: 'CHANGWON' },
    { id: 'popup_suncheon_som_20260712', title: 'Som Milonga', titleNative: '솜밀롱가', date: '2026-07-12', startTime: '14:00', endTime: '18:00', venueId: 'suncheon_tango', venueName: 'Suncheon Tango', venueNameKo: '순천탱고', city: 'SUNCHEON' },
    { id: 'popup_busan_ideal_geumttong_20260717', title: 'Geum Ttong Milonga', titleNative: '금똥밀', date: '2026-07-17', startTime: '20:30', endTime: '24:30', venueId: 'hF6R1lIMNly8DJIiNGvD', venueName: 'Ideal Studio', venueNameKo: '이데알 스튜디오', city: 'BUSAN' },
    { id: 'popup_gwangju_liber_20260718', title: 'Liber Milonga', titleNative: '리베르밀롱가', date: '2026-07-18', startTime: '19:00', endTime: '23:00', venueId: 'gwangju_liber_tango', venueName: 'Gwangju Liber Tango', venueNameKo: '광주리베르탱고', city: 'GWANGJU' },
    { id: 'popup_cheongju_aura_20260719', title: 'Aura Milonga', titleNative: '아우라', date: '2026-07-19', startTime: '15:00', endTime: '19:00', venueId: 'v_manual_cheongju_aura', venueName: 'Studio Aura', venueNameKo: '아우라 스튜디오', city: 'CHEONGJU' },
    { id: 'popup_gwangju_mivida_omaebulmang_20260725', title: 'Omaebulmang', titleNative: '오매불망', date: '2026-07-25', startTime: '21:00', endTime: '23:00', venueId: 'gwangju_mivida', venueName: 'Mivida', venueNameKo: '미비다', city: 'GWANGJU' },
    { id: 'popup_busan_ideal_sat_daytime_20260725', title: 'Saturday Daytime Milonga', titleNative: '토낮밀', date: '2026-07-25', startTime: '16:00', endTime: '20:00', venueId: 'hF6R1lIMNly8DJIiNGvD', venueName: 'Ideal Studio', venueNameKo: '이데알 스튜디오', city: 'BUSAN' },
    { id: 'popup_busan_ideal_hwasamil_20260725', title: 'Hwasamil', titleNative: '화사밀', date: '2026-07-25', startTime: '19:00', endTime: '23:00', venueId: 'hF6R1lIMNly8DJIiNGvD', venueName: 'Ideal Studio', venueNameKo: '이데알 스튜디오', city: 'BUSAN' },
    { id: 'popup_daejeon_laboom_tora_20260725', title: 'Tora Milonga', titleNative: '토라밀롱가', date: '2026-07-25', startTime: '19:00', endTime: '23:00', venueId: 'NHWqAr89gCBFcYtISyF3', venueName: 'LaBoom', venueNameKo: '라붐', city: 'DAEJEON' },
    { id: 'popup_masan_toucan_20260726', title: 'Toucan Milonga', titleNative: '투칸밀롱가', date: '2026-07-26', startTime: '15:00', endTime: '18:00', venueId: 'masan_parkmitango', venueName: 'Parkmi Tango', venueNameKo: '박미탱고', city: 'CHANGWON' },
    { id: 'popup_gwangju_mivida_chaekgeori_20260726', title: 'Chaekgeori Milonga', titleNative: '책거리밀롱가', date: '2026-07-26', startTime: '15:00', endTime: '19:00', venueId: 'gwangju_mivida', venueName: 'Mivida', venueNameKo: '미비다', city: 'GWANGJU' }
  ];

  for (const pop of popups) {
    await db.collection('socials').doc(pop.id).set({
      type: 'popup',
      subCategory: 'milonga',
      title: pop.title,
      titleNative: pop.titleNative,
      date: admin.firestore.Timestamp.fromDate(new Date(`${pop.date}T00:00:00Z`)),
      startTime: pop.startTime,
      endTime: pop.endTime,
      djName: 'TBA',
      djNameNative: '미정',
      djs: [{ date: pop.date, djName: 'TBA', djNameNative: '미정', id: `dj-tba-${pop.date}` }],
      venueId: pop.venueId,
      venueName: pop.venueName,
      venueNameNative: pop.venueNameKo,
      imageUrl: localCalendarUrl,
      description: `${pop.venueNameKo} ${pop.titleNative}\n\n• 일시: ${pop.date} ${pop.startTime} ~ ${pop.endTime}`,
      country: 'KR',
      city: pop.city,
      createdAt: admin.firestore.Timestamp.now()
    }, { merge: true });
  }

  // --- 16. 추가 소셜 갱신 (6/30 & 7월) ---
  console.log('Applying additional June 30 & July social schedules...');

  // (1) 도라다 밀롱가 (Milonga Dorada, id=KgPDeh5g1N53cdz3pnw1)
  const doradaUrl = await uploadImage('media__1782775738551.png', 'KgPDeh5g1N53cdz3pnw1');
  const doradaDjs = [
    { date: '2026-06-02', djName: 'Brian', djNameNative: '브라이언' },
    { date: '2026-06-14', djName: 'Henry', djNameNative: '헨리' },
    { date: '2026-06-23', djName: 'Natalia', djNameNative: '나탈리아' },
    { date: '2026-06-30', djName: 'Lucca', djNameNative: '루까', id: 'dj-lucca-20260630' }
  ];
  await db.collection('socials').doc('KgPDeh5g1N53cdz3pnw1').update({
    imageUrl: doradaUrl,
    djs: doradaDjs,
    djName: 'Lucca',
    djNameNative: '루까',
    description: '매주 화요일 낮 밀롱가 도라다 (Milonga Dorada)\n\n• 일시: 매주 화요일\n• 6/30 (오늘) 워크숍: 14:00 ~ 15:00 (강사: 제니 & 곡산)\n• 6/30 (오늘) 밀롱가: 15:00 ~ 17:00 (DJ: 루까)\n• 입장료: 워크숍+밀롱가 20,000원 / 밀롱가만 13,000원\n• 장소: 탱고라이프 (강남구 역삼로 109 B1)\n• 문의/예약: 010-9772-4990 (카카오뱅크 3333-18-8414917 김규호)'
  });

  // (2) 발사믹 밀롱가 (ValSaMix, id=valsamix_20260712)
  const balsamicDetailUrl = await uploadImage('media__1782775759788.jpg', 'valsamix_20260712');
  await db.collection('socials').doc('valsamix_20260712').update({
    imageUrl: balsamicDetailUrl,
    description: '색다른 밀롱가를 찾으신다면 발사믹! 딴따 구성 탱탱발AM 탱발밀AM (세 곡씩)\n상콤발랄 행복지수 두 배로 만들어드릴게요 💖\n\n• 일시: 7월 12일 (일) PM 6:00 ~ 10:00\n• DJ: Henry (헨리)\n• Org: 엘사 & 이사벨\n• 7월 발사믹 간식: 맥주 🍺, 감자튀김 🍟, 핑거푸드 🍩\n• 장소: 엔빠스 스튜디오 (반포대로 30길 82 B1)\n• 입장료: 13,000원\n• 예약문의: 010-8547-6711 (엘사 / bada152), 010-8850-6520 (이사벨 / Isabell1400)\n• 카카오뱅크: 3333-26-7756678 김해*'
  });

  // (3) 솔땅 화정 (popup_soltango_hwajeong_20260630)
  const hwajeongUrl = await uploadImage('media__1782775794653.jpg', 'popup_soltango_hwajeong_20260630');
  await db.collection('socials').doc('popup_soltango_hwajeong_20260630').update({
    imageUrl: hwajeongUrl,
    djName: 'Rafaella',
    djNameNative: '라파엘라',
    djs: [{ date: '2026-06-30', djName: 'Rafaella', djNameNative: '라파엘라', id: 'dj-rafaella-20260630' }],
    description: '솔땅 화요 정모 & 특별 공연 (Summer Party) 🌴\n\n• 일시: 6월 30일 (화) PM 8:00 ~ 11:30 (오늘)\n• DJ: 라파엘라 (Rafaella)\n• 특별 공연: 2026 PTC 발스 3위 애비 & 마르끼또 (Abby & Marquito)\n• 장소: 대전 오나다 (Tango Onada)\n• 입장료: 8,000원 (10시 이후 5,000원)'
  });

  // (4) 밀롱가 센트로 (Centro, 신규 regular 등록)
  const centroUrl = await uploadImage('media__1782775831299.jpg', 'centro_milonga_20260711');
  const centroDjs = [
    { date: '2026-07-11', djName: 'Slow Hiro', djNameNative: '슬로우 히로', id: 'dj-slowhiro-20260711' }
  ];
  await db.collection('socials').doc('centro_milonga_20260711').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Milonga Centro',
    titleNative: '밀롱가 센트로',
    dayOfWeek: 6,
    recurrence: '2nd Saturday',
    startTime: '17:00',
    endTime: '21:00',
    venueId: 'v_manual_pan_shinsa',
    venueName: 'Club Pan',
    venueNameNative: '클럽 판',
    imageUrl: centroUrl,
    djName: 'Slow Hiro',
    djNameNative: '슬로우 히로',
    djs: centroDjs,
    organizerId: 'manual_joy_elsa',
    organizerName: 'Joy & Elsa',
    organizerNameNative: '조이 & 엘사',
    organizerIds: ['manual_joy', 'manual_elsa'],
    organizerNames: ['Joy', 'Elsa'],
    organizerNativeNames: ['조이', '엘사'],
    description: '매월 둘째주 토요일 특별한 밀롱가 센트로 🗽\n춤꾼이자 소중한 완소 스텝들과의 즐땅을 기대하세요!\n\n• 일시: 7월 11일 (토) PM 5:00 ~ 9:00\n• DJ: 슬로우 히로 (Slow Hiro)\n• Org: 조이 (010-4373-8808) & 엘사 (010-8547-6711)\n• 장소: 클럽 판 (강남대로 595 경승빌딩 B1, 신사역 4번 출구 앞)\n• 입장료: 13,000원',
    country: 'KR',
    city: 'SEOUL',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  // (5) 엔빠스 주간 일정 (En Paz Weekly)
  const enpazWeeklyUrl = await uploadImage('media__1782775862104.png', 'en_paz_weekly_20260629');

  // 월루미
  await db.collection('socials').doc('sMIEoUSmSRS9UwlxWzvp').update({
    imageUrl: enpazWeeklyUrl,
    djName: 'Morning',
    djNameNative: '모닝',
    djs: [{ date: '2026-06-29', djName: 'Morning', djNameNative: '모닝', id: 'dj-morning-20260629' }],
    organizerName: 'Tris',
    organizerNameNative: '트리스',
    description: '월요일 루미노소 (Wol Luminoso)\n\n• 일시: 매주 월요일 19:30 ~ 23:30\n• 6/29 DJ: 모닝\n• Org: 트리스 (카톡 hjkim0412)'
  });

  // 화엔쁘락 (신규 regular 등록)
  await db.collection('socials').doc('en_paz_tuesday_practica').set({
    type: 'regular',
    subCategory: 'practica',
    title: 'En Paz Tuesday Practica',
    titleNative: '화엔쁘락',
    dayOfWeek: 2,
    recurrence: 'every',
    startTime: '14:00',
    endTime: '17:00',
    venueId: 'Hgy2FrsR7F5jJvKMtOK3',
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스',
    imageUrl: enpazWeeklyUrl,
    description: '화엔쁘락 (화요 오후 쁘락)\n\n• 일시: 매주 화요일 14:00 ~ 17:00\n• 쁘락지기: 반달이 (카톡 HomoLudensDall)\n• 쁘락비: 10,000원',
    country: 'KR',
    city: 'SEOUL',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  // 카멜리아
  await db.collection('socials').doc('n4MioMSdxqnA3CVfX53N').update({
    imageUrl: enpazWeeklyUrl,
    djName: 'Gianluca',
    djNameNative: '지안루카',
    djs: [{ date: '2026-07-01', djName: 'Gianluca', djNameNative: '지안루카', id: 'dj-gianluca-20260701' }],
    organizerName: 'Carlos',
    organizerNameNative: '까를로스',
    description: '까멜리아 수요 밀롱가\n\n• 일시: 매주 수요일 19:30 ~ 23:30\n• 7/1 DJ: 지안루카\n• Org: 까를로스 (카톡 tanguerocarlos)'
  });

  // 금요쁘락
  await db.collection('socials').doc('X5DOqBguAJfWHmOd2yUu').update({
    imageUrl: enpazWeeklyUrl,
    description: '금요쁘락 (금요 오후 쁘락)\n\n• 일시: 매주 금요일 14:00 ~ 17:00\n• 쁘락지기: 아란 & 향연\n• 쁘락비: 10,000원 (문의 카톡 Vidamia1)'
  });

  // 비다미아 (4주년 파티 상세)
  await db.collection('socials').doc('R1hayB6of65wiDA27Q0U').update({
    imageUrl: enpazWeeklyUrl,
    djName: 'Hernan',
    djNameNative: '에르난',
    djs: [{ date: '2026-07-03', djName: 'Hernan', djNameNative: '에르난', id: 'dj-hernan-20260703' }],
    organizerName: 'Aran',
    organizerNameNative: '아란',
    description: '비다미아 금요밀롱가 (4주년 🎂)\n\n• 일시: 매주 금요일 19:00 ~ 23:00\n• 7/3 DJ: 에르난\n• Org: 아란 (카톡 Vidamia1)'
  });

  // 로라밀
  await db.collection('socials').doc('oFqiigaztVEnlojaFpuG').update({
    imageUrl: enpazWeeklyUrl,
    djName: 'Susana',
    djNameNative: '수사나',
    djs: [{ date: '2026-07-04', djName: 'Susana', djNameNative: '수사나', id: 'dj-susana-20260704' }],
    organizerName: 'Ginho Kim',
    organizerNameNative: '김진호',
    description: '로라밀 토요 밀롱가\n\n• 일시: 매주 토요일 19:00 ~ 23:00\n• 7/4 DJ: 수사나\n• Org: 김진호 (010-2249-5073)'
  });

  // 누베르
  await db.collection('socials').doc('hEvFnQySTM3XtPCWShRd').update({
    imageUrl: enpazWeeklyUrl,
    djName: 'See Through',
    djNameNative: '시스루',
    djs: [{ date: '2026-07-05', djName: 'See Through', djNameNative: '시스루', id: 'dj-seethrough-20260705' }],
    organizerName: 'Aron',
    organizerNameNative: '아론',
    description: '누베르 일요 밀롱가 (Nuevo Milonga)\n\n• 일시: 매주 일요일 18:00 ~ 22:00\n• 7/5 DJ: 시스루\n• Org: 아론 (010-6281-8288)'
  });

  // (6) 오렌지 밀롱가 (Orange Milonga, id=EqZPQLbM3rDh1C3xdGLU)
  const orangeUrl = await uploadImage('media__1782775888694.jpg', 'EqZPQLbM3rDh1C3xdGLU');
  const orangeDjs = [
    { date: '2026-06-30', djName: 'Joanne', djNameNative: '조앤', id: 'dj-joanne-20260630' }
  ];
  await db.collection('socials').doc('EqZPQLbM3rDh1C3xdGLU').update({
    imageUrl: orangeUrl,
    djs: orangeDjs,
    djName: 'Joanne',
    djNameNative: '조앤',
    organizerName: 'GaEa Kim',
    organizerNameNative: '가이아',
    description: '오렌지 밀롱가 (Milonga Orange) 🧡\n오롯이 우리만의 탱고, 고혹적인 취미생활\n\n• 일시: 매주 화요일 PM 7:30 ~ 12:00\n• 6/30 (오늘) DJ: 조앤 (Joanne - 부산)\n• Org: 가이아 (010-6373-6967)\n• 장소: 안단테 (Tango Andante)\n• 입장료: 13,000원'
  });

  // --- 17. 추가 소셜 갱신 2 (아브라소, 라노체, 진주 밀롱가 7월 첫째주) ---
  console.log('Applying additional Abrazo, La Noche, and Jinju Milonga schedules...');

  // (1) 아브라소 (Abrazo, B2aYZK9mZF6zUUpQEUw1)
  const abrazoDetailUrl = await uploadImage('media__1782806823508.png', 'B2aYZK9mZF6zUUpQEUw1');
  const finalAbrazoDjs = [
    { date: '2026-07-01', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260701' },
    { date: '2026-07-08', djName: 'Arman', djNameNative: '아르만', id: 'dj-arman-20260708' },
    { date: '2026-07-15', djName: 'Cynthia', djNameNative: '신시아', id: 'dj-cynthia-20260715' },
    { date: '2026-07-22', djName: 'Isabelle', djNameNative: '이사벨', id: 'dj-isabelle-20260722' },
    { date: '2026-07-29', djName: 'Henry', djNameNative: '헨리', id: 'dj-henry-20260729' }
  ];
  await db.collection('socials').doc('B2aYZK9mZF6zUUpQEUw1').update({
    imageUrl: abrazoDetailUrl,
    djs: finalAbrazoDjs,
    djName: 'Henry',
    djNameNative: '헨리',
    organizerName: 'Henry & Arman',
    organizerNameNative: '헨리 & 아르만',
    description: '매주 수요일 아브라소 밀롱가 (Abrazo)\n\n• 일시: 매주 수요일 PM 7:30 ~ 11:30\n• 7/1 DJ: 헨리 (Henry)\n• Org: 헨리 & 아르만\n• 혜택: 헨리표 떡볶이와 와인이 무료 제공 🍷🍢\n• 장소: 피스타 (서울 마포구 월드컵북로6길 49 B1)\n• 입장료: 13,000원 (22:00 이후 8,000원)\n• 예약/문의: 010-5730-0727 (Henry)'
  });

  // (2) 라노체 (La Noche, lanoche_milonga_thursday - 정기 소셜 신규 생성)
  const lanocheUrl = await uploadImage('media__1782806835207.jpg', 'lanoche_milonga_thursday');
  const finalLanocheDjs = [
    { date: '2026-07-02', djName: 'Slow Hiro', djNameNative: '슬로우 히로', id: 'dj-slowhiro-20260702' }
  ];
  await db.collection('socials').doc('lanoche_milonga_thursday').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'La Noche Milonga',
    titleNative: '라노체 밀롱가',
    dayOfWeek: 4,
    recurrence: 'every',
    startTime: '20:00',
    endTime: '24:00',
    venueId: '79lEMskDvGUQQW4o4ZHx', // 서울 오나다
    venueName: 'Onada',
    venueNameNative: '오나다',
    imageUrl: lanocheUrl,
    djName: 'Slow Hiro',
    djNameNative: '슬로우 히로',
    djs: finalLanocheDjs,
    organizerId: 'manual_hyeonwoo',
    organizerName: 'Hyeonwoo',
    organizerNameNative: '현우',
    organizerIds: ['manual_hyeonwoo'],
    organizerNames: ['Hyeonwoo'],
    organizerNativeNames: ['현우'],
    description: '라노체 밀롱가 스물여섯번째 밤 🌜\n\n• 일시: 매주 목요일 PM 8:00 ~ 12:00\n• 7/2 (목) 무료 오픈 특강: 19:30 ~ 20:00 (주제: 소셜에서 활용가능한 간쵸)\n• 7/2 (목) DJ: 슬로우 히로 (Slow Hiro)\n• Org: 현우 (010-7191-5163 / 카톡 reytango)\n• 혜택: 딸기에이드, 레모네이드, 와인 제공\n• 장소: 오나다 (서울 마포구 동교로 193 B1)\n• 입장료: 13,000원',
    country: 'KR',
    city: 'SEOUL',
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  // (3) 진주 밀롱가 (Jinju Milonga, jinju_tangopeople_thursday_milonga)
  const jinjuUrl = await uploadImage('media__1782806858256.png', 'jinju_tangopeople_thursday_milonga');
  const finalJinjuDjs = [
    { date: '2026-07-02', djName: 'Rodrigo', djNameNative: '로드리고', id: 'dj-rodrigo-20260702' }
  ];
  await db.collection('socials').doc('jinju_tangopeople_thursday_milonga').set({
    imageUrl: jinjuUrl,
    djs: finalJinjuDjs,
    djName: 'Rodrigo',
    djNameNative: '로드리고',
    description: '335번째 진주밀롱가 (Jinju Milonga)\n\n• 일시: 매주 목요일 PM 8:00 ~ 11:00\n• 7/2 (목) DJ: 로드리고 (Rodrigo)\n• 연락처: 루핀 (010.2545.2499)\n• 장소: 탱고피플 (경남 진주시 평거로 7 3층)\n• 입장료: 10,000원'
  }, { merge: true });

  // === 5단계: 추가 7월 첫째/셋째 주 소셜 일정 및 포스터 연동 ===
  console.log('Applying additional 7/1~7/17 social schedules...');

  // ① 밀롱가 씨엠쁘레 (Milonga Siempre)
  const siempreUrl = await uploadImage('media__1782830191616.jpg', 'kv30qNOhxpmMlo7fpzAl');
  const siempreDjs = [
    { date: '2026-07-01', djName: 'Jorge', djNameNative: '호르헤', id: 'dj-jorge-20260701' }
  ];
  await db.collection('socials').doc('kv30qNOhxpmMlo7fpzAl').set({
    imageUrl: siempreUrl,
    djs: siempreDjs,
    djName: 'Jorge',
    djNameNative: '호르헤',
    instructorName: 'Miseon',
    instructorNameNative: '미선',
    description: '밀롱가 씨엠쁘레 (Milonga Siempre)\n\n• 일시: 매주 수요일 낮 13:00 ~ 16:00\n  - 13:00 ~ 13:50: 미선의 특강 (강사: 미선)\n  - 14:00 ~ 16:00: 밀롱가 (DJ: 호르헤)\n  - 12:00 ~ : 밀롱가 특강 (수강료 별도)\n• 입장료: 수업+밀롱가 2만원 / 밀롱가만 1.3만원 (정회원 할인제도 운영)\n• 문의: 010-7745-4324\n• 장소: 또도땅고 (Todo Tango, 서울 강남구 언주로172길 7 B1)\n\n연애보다 진한 낭만을, 또도 땅고에서 즐겨보세요.'
  }, { merge: true });

  // ② 제주 화양연화 밀롱가 (Milonga Hwayangyeonhwa)
  const hwayangUrl = await uploadImage('media__1782830246142.png', 'popup_jeju_hwajung_20260704');
  const hwayangDjs = [
    { date: '2026-07-04', djName: 'Flow', djNameNative: '플로우', id: 'dj-flow-20260704' }
  ];
  await db.collection('socials').doc('popup_jeju_hwajung_20260704').set({
    imageUrl: hwayangUrl,
    djs: hwayangDjs,
    djName: 'Flow',
    djNameNative: '플로우',
    organizerId: 'manual_polo',
    organizerName: 'Polo',
    organizerNameNative: '폴로',
    description: '화양연화 밀롱가 (Milonga Hwayangyeonhwa)\n\n• 일시: 2026년 7월 4일 (토요일) PM 7:00 ~ 10:00\n• DJ: 플로우 (Flow)\n• Org: 폴로 (010-9707-7780)\n• 입장료: 10,000원\n• 장소: 위플 스테이 2층 (제주 제주시 연동 260-25)\n• 주차: 호텔옆 전용주차장 무료 이용\n\n제주 여행 오시면 슈즈만 챙기세요~~^^'
  }, { merge: true });

  // ③ 부산 금똥밀 3주년 마지막 파티 (Geum Ttong Milonga)
  const geumttongUrl = await uploadImage('media__1782832744839.png', 'popup_busan_ideal_geumttong_20260717');
  const geumttongDjs = [
    { date: '2026-07-17', djName: 'Ston', djNameNative: '스톤', id: 'dj-ston-20260717' }
  ];
  await db.collection('socials').doc('popup_busan_ideal_geumttong_20260717').set({
    imageUrl: geumttongUrl,
    djs: geumttongDjs,
    djName: 'Ston',
    djNameNative: '스톤',
    startTime: '15:00', // 포스터 시간 반영
    endTime: '19:00',
    description: '금똥밀 3주년 & 마지막 파티 (Friday Ddong Party)\n\n• 일시: 7월 17일 (금) 15:00 ~ 19:00 (제헌절 공휴일)\n• DJ: 스톤 (Ston)\n• 장소: 이데알 (Ideal Studio, 부산 부산진구 부전동 241-41 3층)\n• 입장료: 11,000원\n\n금똥밀 3주년, 그리고 마지막 밤을 함께해 주세요 🌙'
  }, { merge: true });

  // ④ 창원 헨땅 에스뻬라 밀롱가 (Esperar Milonga)
  const henttangUrl = await uploadImage('media__1782832852377.png', 'changwon_minoche_friday_henttang');
  const henttangDjs = [
    { date: '2026-07-03', djName: 'Ston', djNameNative: '스톤', id: 'dj-ston-20260703' }
  ];
  await db.collection('socials').doc('changwon_minoche_friday_henttang').set({
    imageUrl: henttangUrl,
    djs: henttangDjs,
    djName: 'Ston',
    djNameNative: '스톤',
    endTime: '24:00', // 연장 시간 반영
    description: '창원 헨땅 에스뻬라 밀롱가 (Esperar Milonga)\n\n• 일시: 2026년 7월 3일 (금) PM 8:30 ~ 12:00\n• DJ: 스톤 (Ston)\n• 입장료: 11,000원\n• 장소: 미노체 (Tango Club Mi Noche, 창원시 마산합포구 가포로 25 B1)\n• 특이사항: 헨땅 23대 매니저 이·취임식 (매니저: 래빗), 라벨르 드레스 오픈마켓\n\n새로운 시작, 새로운 설렘! 헨땅 23대 운영진 출범 기념 밀롱가에 여러분을 초대합니다.'
  }, { merge: true });

  // ⑤ 청주 라플라타 목요 밀롱가 (Milonga La Plata)
  const laplataUrl = await uploadImage('media__1782832960281.jpg', 'ezGoPc7VBQGwd2fpA7Ul');
  const laplataDjs = [
    { date: '2026-07-02', djName: 'Sofia Yeoreum', djNameNative: '소피아 여름', id: 'dj-sofia-yeoreum-20260702' }
  ];
  await db.collection('socials').doc('ezGoPc7VBQGwd2fpA7Ul').set({
    imageUrl: laplataUrl,
    djs: laplataDjs,
    djName: 'Sofia Yeoreum',
    djNameNative: '소피아 여름',
    description: '청주 라플라타 목요 밀롱가 (Milonga La Plata)\n\n• 일시: 2026년 7월 2일 (목) PM 8:30 ~ 11:30\n• DJ: 소피아 여름 (Sofia Yeoreum)\n• 입장료: 10,000원\n• 장소: 아우라 스튜디오 (Studio AURA, 충청북도 청주시 서원구 사창동 474-3 3층)\n• 계좌: 카카오 3333-14-3960061 조미화'
  }, { merge: true });

  // ⑥ 부산 선셋 밀롱가 (Sunset Milonga)
  const sunsetUrl = await uploadImage('media__1782832984983.jpg', 'popup_busan_ideal_sunset_20260704');
  const sunsetDjs = [
    { date: '2026-07-04', djName: 'Alu', djNameNative: '알루', id: 'dj-alu-20260704' }
  ];
  await db.collection('socials').doc('popup_busan_ideal_sunset_20260704').set({
    imageUrl: sunsetUrl,
    djs: sunsetDjs,
    djName: 'Alu',
    djNameNative: '알루',
    description: '부산 선셋 밀롱가 (Sunset Milonga)\n\n• 일시: 2026년 7월 4일 (토) PM 7:00 ~ 11:00 (매월 첫째 토요일)\n  - 17:00 ~ 18:30: 밀롱가 전 비스트 강사의 알쓸음잡 수업\n• DJ: 알루 (Alu)\n• Org: 선셋 (Sunset)\n• 입장료: 12,000원\n• 장소: 이데알 스튜디오 (IDEAL 3층, 부산 부산진구 부전동 241-41)'
  }, { merge: true });

  // ⑦ 부산 부3밀 (Enjoy Bu3mil)
  const bu3milUrl = await uploadImage('media__1782833085283.png', 'busan_detango_sunday_bu3mil');
  const bu3milDjs = [
    { date: '2026-07-05', djName: 'Nero Kim', djNameNative: '네로', id: 'dj-nero-20260705' }
  ];
  await db.collection('socials').doc('busan_detango_sunday_bu3mil').set({
    imageUrl: bu3milUrl,
    djs: bu3milDjs,
    djName: 'Nero Kim',
    djNameNative: '네로',
    description: '부산 데땅고 엔조이 부3mil (1,3,5주차 일요일 16:00 ~ 20:00)\n\n• 일시: 2026년 7월 5일 (일) PM 4:00 ~ 8:00 (3시 조기 오픈, 차/음악 감상 가능)\n• DJ: 네로 (Nero Kim)\n• Org: 징징이 (Zingzing Lee)\n• 장소: 카페데탱고 (Café de Tango, 부산 남구 용소로 40 B1)'
  }, { merge: true });

  // ⑧ 대구 디디디 (Daegu Dia Doya DDD)
  const dddUrl = await uploadImage('media__1782833215667.png', 'daegu_dia_wednesday_ddd');
  const dddDjs = [
    { date: '2026-07-01', djName: 'Doya', djNameNative: '도야', id: 'dj-doya-20260701' }
  ];
  await db.collection('socials').doc('daegu_dia_wednesday_ddd').set({
    imageUrl: dddUrl,
    djs: dddDjs,
    djName: 'Doya',
    djNameNative: '도야',
    description: '대구 DIA 수DDD\n\n• 일시: 2026년 7월 1일 (수) PM 9:00 ~ 24:00\n• DJ: 도야 (Doya)\n• Org: 도야도야 (010-2980-2935)\n• 입장료: 10,000원 (수요일 수업 수강자 5,000원)\n• 장소: 탱고카페 디아 (Tango Cafe Dia, 대구 북구 침산로 168 엠브로타워 507호)'
  }, { merge: true });

  // ⑨ 부산 이뚜 (Milonga yTu)
  const ytuUrl = await uploadImage('media__1782833409210.png', 'busan_studio242_thursday_ytu');
  const ytuDjs = [
    { date: '2026-07-02', djName: 'Woongi', djNameNative: '웅이', id: 'dj-woongi-20260702' },
    { date: '2026-07-09', djName: 'Rhea', djNameNative: '레아', id: 'dj-rhea-20260709' },
    { date: '2026-07-16', djName: 'Zingzing', djNameNative: '징징', id: 'dj-zingzing-20260716' },
    { date: '2026-07-23', djName: 'Lluvia', djNameNative: '유비아', id: 'dj-lluvia-20260723' },
    { date: '2026-07-30', djName: 'Teo', djNameNative: '테오', id: 'dj-teo-20260730' }
  ];
  await db.collection('socials').doc('busan_studio242_thursday_ytu').set({
    imageUrl: ytuUrl,
    djs: ytuDjs,
    djName: 'Woongi',
    djNameNative: '웅이',
    description: '부산 스튜디오242 yTu\n\n• 일시: 매주 목요일 PM 8:30 ~ 11:30\n• 7월 DJ 라인업:\n  - 7/2: 웅이 (생일 축하밀)\n  - 7/9: 레아 (드레스코드: 시스루)\n  - 7/16: 징징 (맛있는 떡볶이밀)\n  - 7/23: 유비아 (시원한 비어밀)\n  - 7/30: 테오 (AM플러스밀)\n• Org: 안나 (Anna)\n• 장소: 스튜디오 242 (Studio 242, 부산 연제구 중앙대로 1039-1)'
  }, { merge: true });

  // ⑩ 대전 라붐 화요 밀롱가 (La Boom Tuesday Milonga)
  const laboomUrl = await uploadImage('media__1782833359821.png', 'daejeon_laboom_tuesday_milonga');
  const laboomDjs = [
    { date: '2026-06-30', djName: 'Sarah', djNameNative: '세라', id: 'dj-sarah-20260630' }
  ];
  await db.collection('socials').doc('daejeon_laboom_tuesday_milonga').set({
    imageUrl: laboomUrl,
    djs: laboomDjs,
    djName: 'Sarah',
    djNameNative: '세라',
    description: '대전오나다 라붐 화요밀롱가\n\n• 일시: 2026년 6월 30일 (화요일) PM 8:00 ~ 11:30\n• DJ: 세라 (Sarah)\n• Staff: 에비타 (Evita)\n• 입장료: 12,000원 (계좌: 농협 423 02 020908 기영호)\n• 문의: 대전탱고 010-5718-9593\n• 장소: 라붐 (Tango Bar La Boom, 대전 유성구 대학로81번길 32-11 덕일빌딩 B1)'
  }, { merge: true });

  // ⑪ 강남탱고판 12주년 기념 파티 (GTP 12th Anniversary)
  const gtpUrl = await uploadImage('media__1782833382562.jpg', 'gtp_12th_anniversary');
  const gtpDjs = [
    { date: '2026-07-17', djName: 'Gonz', djNameNative: '곤즈', id: 'dj-gonz-20260717' }
  ];
  await db.collection('socials').doc('gtp_12th_anniversary').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'GTP 12th Anniversary Party',
    titleNative: 'GTP 12주년 기념 파티',
    date: '2026-07-17',
    startTime: '19:30',
    endTime: '24:00',
    venueId: 'jNio0nAQ8C4xFb64zu0M', // 클럽 판
    venueName: 'Club PAN',
    venueNameNative: '클럽 판',
    imageUrl: gtpUrl,
    djName: 'Gonz',
    djNameNative: '곤즈',
    djs: gtpDjs,
    organizerId: 'manual_pandora',
    organizerName: 'Pandora',
    organizerNameNative: '판도라',
    description: '강남탱고판(GTP) 12주년 기념 파티 🎉\n\n• 일시: 2026년 7월 17일 (금) 19:30 ~ 24:00 (오픈 19:00)\n• DJ: 곤즈 (Gonz / 최성곤)\n• MC: 요노 (Yono)\n• 스페셜 작가: 오! (Oh!)\n• 드레스코드: 파티 플렉스 (Party Flex)\n• 혜택: 베스트 드레서 30만원 마라비샤 쿠폰 지급\n• 입장료: 30,000원 (후원 테이블 100,000원, 예매 얼리버드 6/30 마감)\n• 문의: 판도라 (010-8709-0340)\n• 장소: 클럽 판 탱고 (서울 강남구 강남대로 595 B1)',
    country: 'KR',
    city: 'SEOUL'
  }, { merge: true });

  // ⑫ 서울 오초 밀롱가 로까 (Milonga Loca)
  const locaUrl = await uploadImage('media__1782833626903.jpg', 'O6Oql4EXX4ZboWkQnBwD');
  const locaDjs = [
    { date: '2026-07-04', djName: 'TBA', djNameNative: '미정', id: 'dj-tba-20260704' }
  ];
  await db.collection('socials').doc('O6Oql4EXX4ZboWkQnBwD').set({
    imageUrl: locaUrl,
    djs: locaDjs,
    description: '밀롱가 로까 (Milonga Loca In Seoul)\n\n• 일시: 2026년 7월 4일 (토요일) 21:00 오픈\n• 특이사항: 옷장털기 2탄 탱고 드레스 벼룩시장\n  - 셀러/스태프: 스텔라 (Stella), 켈리 (Kelly), 아녜스 (Agnes), 포포 (Popo), 세레나 (Serena)\n• 장소: 탱고클럽 오초 (Tango Club Ocho, 서울 마포구 월드컵북로2길 57 지하1층)'
  }, { merge: true });

  // ⑬ 서울 마포 브루호 수요 쁘락띠롱가 (Tango Brujo Practilonga)
  const brujoUrl = await uploadImage('media__1782833547812.jpg', 'mapo_brujo_wednesday_practilonga');
  await db.collection('socials').doc('mapo_brujo_wednesday_practilonga').set({
    type: 'regular',
    subCategory: 'milonga',
    title: 'Tango Brujo Practilonga',
    titleNative: '수요 쁘락띠롱가',
    dayOfWeek: 3,
    recurrence: 'every',
    startTime: '19:30',
    endTime: '22:30',
    venueId: 'dFHFZ2z12DMVTrGxWiMm', // 탱고 브루호
    venueName: 'Tango Brujo',
    venueNameNative: '탱고브루호',
    imageUrl: brujoUrl,
    description: '심장이 걷는 밤, 탱고 쁘락띠롱가\n\n• 일시: 매주 수요일 PM 7:30 ~ 10:30\n• 입장료: 8,000원\n• 장소: 탱고브루호 스튜디오 (서울 마포구 잔다리로 68 B1)\n\n춤도 연습도 놓칠수 없다면 탱고맛집 브루호에서 💚\n연습 중 문의사항이나 가이드가 필요하신 분은 편하게 말씀해주세요.',
    country: 'KR',
    city: 'SEOUL'
  }, { merge: true });

  // ⑭ 서울 마포 오뜨라 밀림 3주년 파티 (Millim 3rd Anniversary)
  const millimUrl = await uploadImage('media__1782833450284.png', 'popup_mapo_otra_millim_20260704');
  const millimDjs = [
    { date: '2026-07-04', djName: 'London Hong', djNameNative: '런던홍', id: 'dj-london-hong-20260704' }
  ];
  await db.collection('socials').doc('popup_mapo_otra_millim_20260704').set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Millim 3rd Anniversary Party',
    titleNative: '밀림 3주년 기념 파티',
    date: '2026-07-04',
    startTime: '19:30',
    endTime: '23:00',
    venueId: 'pCX88Jyhy0EzxbyBi4Nb', // 오뜨라
    venueName: 'Otra',
    venueNameNative: '오뜨라',
    imageUrl: millimUrl,
    djName: 'London Hong',
    djNameNative: '런던홍',
    djs: millimDjs,
    description: '밀림 3주년 기념 파티 (Millim 3rd Anniversary Party) 🏤\n\n• 일시: 2026년 7월 4일 (토) PM 7:30 ~ 11:00\n• DJ: 런던홍 (London Hong)\n• Managers: 블랑, 탈린, 제이크, 노바, 릴라, 샤샤, 티제이, 별\n• 테이블 예약: Kakaotalk ID (SPL26) 또는 탈린에게 메시지\n• 장소: 오뜨라 탱고 클럽 (서울 마포구 홍익로5안길 20 B1)\n\n여러분들의 성원에 힘입어 밀림이 3주년을 맞이했습니다. 오셔서 축하하고 즐겨주세요.',
    country: 'KR',
    city: 'SEOUL'
  }, { merge: true });
}

run().then(() => {
  console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
