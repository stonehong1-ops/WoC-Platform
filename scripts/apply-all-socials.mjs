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
  if (filename.startsWith('/images/')) {
    return filename; // 로컬 정적 이미지 경로 그대로 반환
  }
  
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
  // 1. Andante 베뉴 정보 가져오기
  const andanteDoc = await db.collection('venues').doc('QtjovOcmoPzJ8SPyeZKh').get();
  const andanteData = andanteDoc.exists ? andanteDoc.data() : { name: 'Andante', nameKo: '안단테', city: 'SEOUL', country: 'KR' };

  // 2. PISTA 베뉴 정보 가져오기
  const pistaDoc = await db.collection('venues').doc('zkZm9gZvHdnSPzSOR5Gp').get();
  const pistaData = pistaDoc.exists ? pistaDoc.data() : { name: 'The PISTA', nameKo: '피스타', city: 'SEOUL', country: 'KR' };

  // 3. El Tango 베뉴 정보 가져오기
  const elTangoDoc = await db.collection('venues').doc('xD7IK8hmtllxG3MD2LFS').get();
  const elTangoData = elTangoDoc.exists ? elTangoDoc.data() : { name: 'El Tango', nameKo: '엘땅고', city: 'SEOUL', country: 'KR' };

  // 4. Club PAN 베뉴 정보 가져오기
  const clubPanDoc = await db.collection('venues').doc('nOpG4qOzsVR8OZ1V9PpK').get();
  const clubPanData = clubPanDoc.exists ? clubPanDoc.data() : { name: 'Club PAN', nameKo: '클럽판', city: 'SEOUL', country: 'KR' };

  // 5. Tango Life 베뉴 정보 가져오기
  const tangoLifeDoc = await db.collection('venues').doc('Z8XjPNw7il0B9zilFPGx').get();
  const tangoLifeData = tangoLifeDoc.exists ? tangoLifeDoc.data() : { name: 'Tango Life', nameKo: '탱고라이프', city: 'SEOUL', country: 'KR' };

  // 6. Silhouette 베뉴 정보 가져오기
  const silhouetteDoc = await db.collection('venues').doc('3XagPuu2bmBorzqMPNk3').get();
  const silhouetteData = silhouetteDoc.exists ? silhouetteDoc.data() : { name: 'Silhouette', nameKo: '실루엣', city: 'SEOUL', country: 'KR' };

  // 7. Ocho 베뉴 정보 가져오기
  const ochoDoc = await db.collection('venues').doc('6Z5SuLBNSGZezwBgJ5r0').get();
  const ochoData = ochoDoc.exists ? ochoDoc.data() : { name: 'Ocho', nameKo: '오초', city: 'SEOUL', country: 'KR' };

  // 8. El Mar 베뉴 정보 가져오기
  const elMarDoc = await db.collection('venues').doc('v_manual_incheon_elmar').get();
  const elMarData = elMarDoc.exists ? elMarDoc.data() : { name: 'El Mar', nameKo: '엘마르', city: 'INCHEON', country: 'KR' };

  // --- 소셜 이벤트 데이터 배열 정의 ---
  const socialsToRegister = [
    {
      id: 'popup_orange_20260630',
      type: 'popup',
      subCategory: 'milonga',
      title: 'Orange Milonga',
      titleNative: '오렌지 밀롱가',
      date: admin.firestore.Timestamp.fromDate(new Date('2026-06-30T00:00:00Z')),
      startTime: '19:30',
      endTime: '24:00',
      djName: 'Joanne',
      djNameNative: '조앤',
      djs: [{ date: '2026-06-30', djName: 'Joanne', djNameNative: '조앤' }],
      organizerId: 'manual_gaea',
      organizerName: 'GaEa',
      organizerNameNative: '가이아',
      organizerIds: ['manual_gaea'],
      organizerNames: ['GaEa'],
      organizerNativeNames: ['가이아'],
      organizerPhone: '010-6373-6967',
      price: '13,000',
      currency: 'KRW',
      country: 'KR',
      city: andanteData.city || 'SEOUL',
      district: '마포구',
      venueId: 'QtjovOcmoPzJ8SPyeZKh',
      venueName: andanteData.name || 'Andante',
      venueNameNative: andanteData.nameKo || '안단테',
      description: '6/30 (화) 오렌지 밀롱가\n오직 당신과 내가 그리는 공간에서 아름다운 호흡으로\n달달하고 뜨겁게 포옹하는 오렌지밀에서 만나요.\n\n• 일시: 2026년 6월 30일 (화) PM 7:30 ~ 12:00\n• DJ: 조앤 (Joanne - 부산)\n• 장소: 탱고 안단테 (마포구 양화로 12길 24 선진빌딩 B1)\n• 입장료: 13,000원\n• 주최(Org): 가이아 (GaEa Kim)\n• 예약/문의: 가이아 (010-6373-6967)',
      imageFile: 'media__1782619436160.jpg'
    },
    {
      id: 'popup_milpasso_20260705',
      type: 'popup',
      subCategory: 'milonga',
      title: 'Milpasso',
      titleNative: '밀빠소',
      date: admin.firestore.Timestamp.fromDate(new Date('2026-07-05T00:00:00Z')),
      startTime: '14:00',
      endTime: '18:00',
      djName: 'TBD',
      djNameNative: '미정',
      djs: [{ date: '2026-07-05', djName: 'TBD', djNameNative: '미정' }],
      organizerId: 'manual_milpasso',
      organizerName: 'Milpasso',
      organizerNameNative: '밀빠소',
      organizerIds: ['manual_milpasso'],
      organizerNames: ['Milpasso'],
      organizerNativeNames: ['밀빠소'],
      price: 'TBD',
      currency: 'KRW',
      country: 'KR',
      city: pistaData.city || 'SEOUL',
      district: '서초구',
      venueId: 'zkZm9gZvHdnSPzSOR5Gp',
      venueName: pistaData.name || 'The PISTA',
      venueNameNative: pistaData.nameKo || '피스타',
      description: '밀빠소 탱고 살롱 (MILPASSO TANGO SALON) - 오픈 파티\n\n• 일시: 2026년 7월 5일 (일) 14:00 ~ 18:00\n• 장소: 피스타 (The PISTA)\n• 문구: More Than Tango',
      imageFile: 'media__1782619470233.png'
    },
    {
      id: 'popup_on_20260704',
      type: 'popup',
      subCategory: 'milonga',
      title: 'Milonga ON',
      titleNative: '밀롱가 온',
      date: admin.firestore.Timestamp.fromDate(new Date('2026-07-04T00:00:00Z')),
      startTime: '19:00',
      endTime: '23:00',
      djName: 'Alex',
      djNameNative: '알렉스',
      djs: [{ date: '2026-07-04', djName: 'Alex', djNameNative: '알렉스' }],
      organizerId: 'manual_dolf_himi',
      organizerName: 'Dolf & Himi',
      organizerNameNative: '돌프 & 히미',
      organizerIds: ['manual_dolf', 'manual_himi'],
      organizerNames: ['Dolf', 'Himi'],
      organizerNativeNames: ['돌프', '히미'],
      organizerPhone: '010-4395-3391, 010-7702-3238',
      price: 'TBD',
      currency: 'KRW',
      country: 'KR',
      city: elTangoData.city || 'SEOUL',
      district: '서초구',
      venueId: 'xD7IK8hmtllxG3MD2LFS',
      venueName: elTangoData.name || 'El Tango',
      venueNameNative: elTangoData.nameKo || '엘땅고',
      description: '일곱 번째 ‘온(ON)’으로 여러분을 초대합니다.\n이번 7월의 ‘온’은 무더운 여름날, 지친 일상을 벗어나 서로에게 시원한 그늘과 편안한 휴식이 되어줄 공간을 준비했습니다. 🌳✨\n🎧 DJ 알렉스님의 감각적이고 시원하게 흐르는 탱고 선율에 몸을 맡기며, 초여름 밤의 열기를 기분 좋은 설렘으로 채워줄 아름다운 밀롱가를 함께 만들어가요.\n서로를 품어주는 따뜻한 포옹, 그리고 음악 속에서 하나 되는 소중한 순간이 이곳에서 머물기를 바랍니다. 7월 첫째 주 토요일, 엘땅고에서 시원한 쉼표 하나를 찍어보세요.\n\n📍 Milonga ON (일곱 번째 온)\n• 일시: 2026년 7월 4일 (토) 19:00 ~ 23:00\n• DJ: 알렉스\n• 주최(Org): 돌프 & 히미\n• 장소: 엘땅고 (서울 서초구 주흥길 12, 2층)\n• 예약/문의: 돌프 010-4395-3391, 히미 010-7702-3238',
      imageFile: 'media__1782619493265.jpg'
    },
    {
      id: 'popup_26jb_20260704',
      type: 'popup',
      subCategory: 'milonga',
      title: '26JB Milonga',
      titleNative: '26JB 낮밀',
      date: admin.firestore.Timestamp.fromDate(new Date('2026-07-04T00:00:00Z')),
      startTime: '14:00',
      endTime: '18:00',
      djName: 'Woogi',
      djNameNative: '우기',
      djs: [{ date: '2026-07-04', djName: 'Woogi', djNameNative: '우기' }],
      organizerId: 'manual_junchi_boonie',
      organizerName: 'Junchi & Boonie',
      organizerNameNative: '준치 & 부니',
      organizerIds: ['manual_junchi', 'manual_boonie'],
      organizerNames: ['Junchi', 'Boonie'],
      organizerNativeNames: ['준치', '부니'],
      organizerPhone: '010-4949-5600',
      price: '13,000',
      currency: 'KRW',
      country: 'KR',
      city: clubPanData.city || 'SEOUL',
      district: '서초구',
      venueId: 'nOpG4qOzsVR8OZ1V9PpK',
      venueName: clubPanData.name || 'Club PAN',
      venueNameNative: clubPanData.nameKo || '클럽판',
      description: '26JBmilonga 두번째 이야기!!\n“미소하우스”를 만들고픈 사람들,,!\n7월의 첫 주말,, 7/4일(토),, pm2:00~pm6:00\n신사역 클럽판\n아름다운 탱고음악과 즐거운 26낮밀 함께 만들어요,, 어때요,,??\n미소품은 아름다운 당신,, 기다립니당~!^^',
      imageFile: 'media__1782619523856.jpg'
    },
    {
      id: 'popup_dulce_20260627',
      type: 'popup',
      subCategory: 'milonga',
      title: 'Dulce Milonga',
      titleNative: '둘쎄 밀롱가',
      date: admin.firestore.Timestamp.fromDate(new Date('2026-06-27T00:00:00Z')),
      startTime: '18:00',
      endTime: '21:30',
      djName: 'Vincent',
      djNameNative: '뱅상',
      djs: [{ date: '2026-06-27', djName: 'Vincent', djNameNative: '뱅상' }],
      organizerId: 'manual_hwangjin',
      organizerName: 'Hwangjin',
      organizerNameNative: '황진',
      organizerIds: ['manual_hwangjin'],
      organizerNames: ['Hwangjin'],
      organizerNativeNames: ['황진'],
      organizerPhone: '010-3774-2949',
      price: '13,000',
      currency: 'KRW',
      country: 'KR',
      city: silhouetteData.city || 'SEOUL',
      district: '분당구',
      venueId: '3XagPuu2bmBorzqMPNk3',
      venueName: silhouetteData.name || 'Silhouette',
      venueNameNative: silhouetteData.nameKo || '실루엣',
      description: '오늘은~~ 분당 둘쎄 밀롱가 입니다\nno! 어나운스\nno! 퍼포먼스\nonly~~~땅고로 만나는 내가 주인공인 둘쎄 밀롱가로 놀러 오세요\n디제이계의 젠틀맨☆뱅상님☆과 함께 합니다.\n(예정된 디제이, 빌리님의 갑작스런 사정으로 뱅상님께 긴급히 부탁 드리게 됐으니 양해 바랍니다♡)\n\n• 일시: 6/27.토.pm6:00-9:30\n• DJ: 뱅상\n• Org: 황진\n• Fee: 13,000원\n• 장소: 실루엣 (분당구 정자동 23-1 지파크프라자 5F)\n• 주차: 건물 내 1시간 무료등록 필',
      imageFile: 'media__1782619572762.jpg'
    },
    {
      id: 'popup_luminoso_20260628',
      type: 'popup',
      subCategory: 'milonga',
      title: 'Sunday Luminoso',
      titleNative: '일루미',
      date: admin.firestore.Timestamp.fromDate(new Date('2026-06-28T00:00:00Z')),
      startTime: '14:00',
      endTime: '18:00',
      djName: 'Diego Xen',
      djNameNative: '디에고 젠',
      djs: [{ date: '2026-06-28', djName: 'Diego Xen', djNameNative: '디에고 젠' }],
      organizerId: 'manual_trees',
      organizerName: 'Trees',
      organizerNameNative: '트리스',
      organizerIds: ['manual_trees'],
      organizerNames: ['Trees'],
      organizerNativeNames: ['트리스'],
      price: 'TBD',
      currency: 'KRW',
      country: 'KR',
      city: ochoData.city || 'SEOUL',
      district: '마포구',
      venueId: '6Z5SuLBNSGZezwBgJ5r0',
      venueName: ochoData.name || 'Ocho',
      venueNameNative: ochoData.nameKo || '오초',
      description: '🌸 일요일에 만나요! 🌸\n싱그러운 꽃들이 가득한 오후, 좋은 음악과 따뜻한 아브라소가 있는 일루미 (Sunday Luminoso)\n초여름의 햇살처럼 밝고 편안한 분위기 속에서 좋은 사람들과 함께 춤추고, 이야기 나누며 행복한 일요일을 만들어 보세요.\n이번 일루미의 드레스 코드는 Flower 🌸 입니다. 꽃무늬 의상이나 꽃 장식 하나만으로도 충분해요.\n\n• 일시: 2026년 6월 28일 (일) 2:00pm ~ 6:00pm\n• DJ: Diego Xen\n• 장소: Ocho Tango Club (서울 마포구 월드컵북로2길 57, B1)\n• Dress Code: Flower\n• 테이블 예약 문의: 카카오톡 hjkim0412',
      imageFile: 'media__1782619591452.jpg'
    },
    {
      id: 'popup_aires_20260711',
      type: 'popup',
      subCategory: 'milonga',
      title: 'Verano Party',
      titleNative: '인천탱고아이레스 Verano Party',
      date: admin.firestore.Timestamp.fromDate(new Date('2026-07-11T00:00:00Z')),
      startTime: '18:00',
      endTime: '22:30',
      djName: 'Vincent',
      djNameNative: '뱅상',
      djs: [{ date: '2026-07-11', djName: 'Vincent', djNameNative: '뱅상' }],
      organizerId: 'manual_hero_leah',
      organizerName: 'Hero & Leah',
      organizerNameNative: '히어로 & 리아',
      organizerIds: ['manual_hero', 'manual_leah'],
      organizerNames: ['Hero', 'Leah'],
      organizerNativeNames: ['히어로', '리아'],
      organizerPhone: '010-3751-8036, awesomeleah',
      price: '15,000',
      currency: 'KRW',
      country: 'KR',
      city: elMarData.city || 'INCHEON',
      district: '부평구',
      venueId: 'v_manual_incheon_elmar',
      venueName: elMarData.name || 'El Mar',
      venueNameNative: elMarData.nameKo || '엘마르',
      description: '♥ 인천탱고아이레스 Verano party ♥\n😍 \'볼라레\' 시즌6 수료공연 😍\n아이레스만의 건강뷔페식 풍성한 음식은기본, 수료공연과 함께 특별초빙한 그리스&아테네님의 아르헨티나전통민속춤 "챠카레라" 오픈무료특강이있으니 많은참여바랍니다~\n\n• 일시: 7월 11일 (토) PM 6:00 ~ 7:00 챠카레라 무료특강, PM 7:00 ~ 10:30 밀롱가\n• 장소: 인천 부평구 십정동 420-1, 4층 엘마르\n• DJ: 뱅상\n• Org: 히어로 y 리아\n• 파티비: 15,000원 (7/9 목요일까지 입금 시 13,000원)\n• 신한은행 110-441-979184 이연정',
      imageFile: 'media__1782619629571.jpg'
    }
  ];

  // --- 1. 신규 소셜들 업로드 및 삽입 ---
  for (const soc of socialsToRegister) {
    const imageUrl = await uploadImage(soc.imageFile, soc.id);
    const docData = { ...soc, imageUrl };
    delete docData.imageFile;
    
    console.log(`Setting document socials/${soc.id}...`);
    await db.collection('socials').doc(soc.id).set(docData, { merge: true });
    console.log(`Social event ${soc.id} updated/saved!`);
  }

  // --- 2. 아이비 밀롱가 정기(regular) 소셜 업데이트 & 중복 팝업 삭제 ---
  const regularIvyId = '91ck4ojABM1Owcb2Byja';
  console.log(`Updating regular Ivy Milonga document ${regularIvyId}...`);
  
  // Storage에 이미지 업로드해서 public URL 확보
  const ivyPublicUrl = await uploadImage('/images/ivy_milonga_popup.png', regularIvyId);

  // 6월 28일 DJ 데이터 생성
  const newIvyDj = {
    date: '2026-06-28',
    djName: 'Star Shadow Step',
    djNativeName: '별그림자밟기',
    id: 'dj-starshadow-2026-06-28'
  };

  // 기존 djs 데이터 가져와서 중복 제거 및 추가
  const regularIvyDoc = await db.collection('socials').doc(regularIvyId).get();
  let existingDjs = [];
  if (regularIvyDoc.exists) {
    existingDjs = regularIvyDoc.data().djs || [];
  }
  
  // 6/28 날짜 기준 기존 DJ 제거
  existingDjs = existingDjs.filter(d => d.date !== '2026-06-28');
  existingDjs.push(newIvyDj);

  // regular Ivy 문서 업데이트
  await db.collection('socials').doc(regularIvyId).update({
    imageUrl: ivyPublicUrl,
    djs: existingDjs,
    djName: 'Star Shadow Step',
    djNameNative: '별그림자밟기',
    price: '13,000'
  });
  console.log(`Regular Ivy Milonga updated successfully!`);

  // 중복 팝업 삭제 (ivy_milonga_popup_20260628 이전에 생성된 것들 일괄 정리)
  const popupIdsToDelete = ['ivy_milonga_popup_20260628', 'popup_ivy_20260628'];
  for (const pId of popupIdsToDelete) {
    console.log(`Deleting duplicate popup Ivy document ${pId} if exists...`);
    await db.collection('socials').doc(pId).delete();
  }
  console.log('All Ivy Milonga duplicate popups deleted!');
}

run().then(() => {
  console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
