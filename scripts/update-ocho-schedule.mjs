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

async function updateOchoSchedule() {
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781515283084.jpg';
  const destPath = `socials/ocho_weekly_2026_06_15/poster.jpg`;
  
  console.log('Uploading OCHO weekly poster to Storage...');
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  });
  
  const file = bucket.file(destPath);
  console.log('Making poster public...');
  await file.makePublic();
  
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded poster URL:', imageUrl);

  // 1. 기존 정기 소셜 업데이트 명세
  const updates = [
    {
      id: 'maMVsnmrc6lplGXCIr8D', // 무초밀
      name: '무초밀',
      date: '2026-06-15',
      djName: 'H.jun',
      djNameNative: '에이치준'
    },
    {
      id: 'bb1YNxoL4iXtfEdDtUbJ', // 까사
      name: '까사',
      date: '2026-06-16',
      djName: 'Eugene',
      djNameNative: '유진'
    },
    {
      id: 'PxeRaC6Ky260cdfPLFTh', // 수에잇밀
      name: '수에잇밀',
      date: '2026-06-17',
      djName: 'Rodrigo Roda',
      djNameNative: '로드리고 로다'
    },
    {
      id: 'FhUfMtTw6hyg3sdZq734', // 서울밀
      name: '서울밀',
      date: '2026-06-18',
      djName: 'Bana',
      djNameNative: '반아'
    },
    {
      id: 'vQ4SASAdywi4Nj74SsAm', // 클럽 그리셀
      name: '클럽 그리셀',
      date: '2026-06-19',
      djName: 'Epitone',
      djNameNative: '에피톤'
    },
    {
      id: 'RcwxqCMwdSX5oABMNJeH', // 토이프밀롱가
      name: '토이프밀롱가',
      date: '2026-06-20',
      djName: 'Rafael',
      djNameNative: '라파엘'
    },
    {
      id: 'C0xF4VaGDIRIyt8a2hta', // 일 루미 (일루미밀롱가)
      name: '일 루미',
      date: '2026-06-21',
      djName: 'Yeonpung',
      djNameNative: '연풍'
    }
  ];

  for (const item of updates) {
    console.log(`Updating ${item.name} (${item.id})...`);
    const docRef = db.collection('socials').doc(item.id);
    const snap = await docRef.get();
    if (!snap.exists) {
      console.log(`Warning: ${item.name} not found!`);
      continue;
    }
    const data = snap.data();
    const djs = data.djs || [];
    
    // 동일 날짜 DJ 중복 등록 체크 및 추가
    if (!djs.some(d => d.date === item.date)) {
      const randomId = 'dj_' + Math.random().toString(36).substring(2, 11);
      djs.push({
        id: randomId,
        date: item.date,
        djName: item.djName,
        djNameNative: item.djNameNative
      });
    } else {
      // 기존 해당 날짜 DJ 정보 업데이트
      const idx = djs.findIndex(d => d.date === item.date);
      djs[idx].djName = item.djName;
      djs[idx].djNameNative = item.djNameNative;
    }
    
    // 날짜별 오름차순 정렬
    djs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 최신 DJ 이름 지정
    const futureDj = djs.find(d => new Date(d.date) >= new Date()) || djs[djs.length - 1];
    
    await docRef.update({
      djs,
      djName: futureDj ? futureDj.djName : item.djName,
      imageUrl: imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 2. 신규 팝업 2종 등록
  const popups = [
    {
      title: "Camelia",
      titleNative: "까멜리아밀롱가",
      type: "popup",
      date: admin.firestore.Timestamp.fromDate(new Date("2026-06-21T00:00:00+09:00")),
      venueId: "6Z5SuLBNSGZezwBgJ5r0", // Ocho
      venueName: "Ocho",
      venueNameNative: "오초",
      city: "SEOUL",
      country: "KOREA",
      price: "13000",
      currency: "KRW",
      startTime: "19:00",
      endTime: "24:00",
      organizerId: "manual_carlos",
      organizerName: "Carlos",
      organizerNameNative: "까를로스",
      djs: [
        {
          id: 'dj_' + Math.random().toString(36).substring(2, 11),
          date: "2026-06-21",
          djName: "Nacho",
          djNameNative: "나초"
        }
      ],
      djName: "Nacho",
      description: "6월 21일 일요일 저녁 OCHO에서 열리는 까멜리아 밀롱가입니다. DJ 나쵸와 함께 좋은 음악을 즐겨보세요. 🎶",
      subCategory: "milonga",
      imageUrl: imageUrl
    },
    {
      title: "Roca",
      titleNative: "로까밀롱가",
      type: "popup",
      date: admin.firestore.Timestamp.fromDate(new Date("2026-06-21T00:00:00+09:00")),
      venueId: "6Z5SuLBNSGZezwBgJ5r0", // Ocho
      venueName: "Ocho",
      venueNameNative: "오초",
      city: "SEOUL",
      country: "KOREA",
      price: "13000",
      currency: "KRW",
      startTime: "20:00",
      endTime: "02:00",
      organizerId: "manual_popo",
      organizerName: "Popo",
      organizerNameNative: "포포",
      djs: [
        {
          id: 'dj_' + Math.random().toString(36).substring(2, 11),
          date: "2026-06-21",
          djName: "Anes",
          djNameNative: "아네스"
        }
      ],
      djName: "Anes",
      description: "6월 21일 일요일 저녁 OCHO에서 임시 특별 편성으로 개최되는 로까밀롱가입니다. DJ 아네스와 함께 기분 좋게 춤을 즐겨보세요. 🎶",
      subCategory: "milonga",
      imageUrl: imageUrl
    }
  ];

  for (const pop of popups) {
    console.log(`Creating popup ${pop.titleNative}...`);
    const newDocRef = db.collection('socials').doc();
    await newDocRef.set({
      id: newDocRef.id,
      ...pop,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log('Successfully updated OCHO weekly schedule and registered popups!');
}

updateOchoSchedule()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Update failed:', err);
    process.exit(1);
  });
