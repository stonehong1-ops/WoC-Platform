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

async function runTasks() {
  // 1. 이미지 업로드: 이데알 8주년 포스터
  const localIdealPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781516926343.png';
  const destIdealPath = `socials/ideal_8th_anniversary/poster.png`;
  console.log('Uploading Ideal poster to Storage...');
  await bucket.upload(localIdealPath, {
    destination: destIdealPath,
    metadata: { contentType: 'image/png' }
  });
  const fileIdeal = bucket.file(destIdealPath);
  await fileIdeal.makePublic();
  const idealImageUrl = `https://storage.googleapis.com/${bucket.name}/${destIdealPath}`;
  console.log('Ideal poster URL:', idealImageUrl);

  // 2. 이미지 업로드: 탱고 파이어 포스터
  const localFirePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781517204260.png';
  const destFirePath = `socials/tango_fire_2026_06_16/poster.png`;
  console.log('Uploading Tango Fire poster to Storage...');
  await bucket.upload(localFirePath, {
    destination: destFirePath,
    metadata: { contentType: 'image/png' }
  });
  const fileFire = bucket.file(destFirePath);
  await fileFire.makePublic();
  const fireImageUrl = `https://storage.googleapis.com/${bucket.name}/${destFirePath}`;
  console.log('Tango Fire poster URL:', fireImageUrl);

  // 3. 신규 장소 등록: 이데알 스튜디오
  console.log('Registering Ideal Studio Venue...');
  const venueRef = db.collection('venues').doc();
  const venueId = venueRef.id;
  await venueRef.set({
    id: venueId,
    name: "Ideal Studio",
    nameKo: "이데알 스튜디오",
    address: "부산시 부산진구 신천대로 62번길 62, 3층",
    city: "BUSAN",
    country: "KR",
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Venue registered with ID:', venueId);

  // 4. 이데알 8주년 팝업 2종 등록
  const popups = [
    {
      title: "Ideal's 8th Anniversary & Sarah ideal 2nd (Part 1)",
      titleNative: "이데알 스튜디오 8주년 & 사라이데알 2주년 파티 (1부 낮밀)",
      type: "popup",
      date: admin.firestore.Timestamp.fromDate(new Date("2026-07-18T00:00:00+09:00")),
      venueId: venueId,
      venueName: "Ideal Studio",
      venueNameNative: "이데알 스튜디오",
      city: "BUSAN",
      country: "KOREA",
      price: "",
      currency: "KRW",
      startTime: "14:30",
      endTime: "18:30",
      organizerId: "manual_sarah",
      organizerName: "Sarah Han",
      organizerNameNative: "사라",
      djs: [
        {
          id: 'dj_' + Math.random().toString(36).substring(2, 11),
          date: "2026-07-18",
          djName: "Beast",
          djNameNative: "비스트"
        }
      ],
      djName: "Beast",
      description: "이데알 스튜디오 8주년 & 사라 이데알 2주년 기념 파티 1부(낮밀)입니다. DJ 비스트와 함께 낮부터 축제를 시작하세요! 스페셜 공연(18:30~19:00)과 사진 카푸치노가 함께합니다. 🎶",
      subCategory: "milonga",
      imageUrl: idealImageUrl
    },
    {
      title: "Ideal's 8th Anniversary & Sarah ideal 2nd (Part 2)",
      titleNative: "이데알 스튜디오 8주년 & 사라이데알 2주년 파티 (2부 밤밀)",
      type: "popup",
      date: admin.firestore.Timestamp.fromDate(new Date("2026-07-18T00:00:00+09:00")),
      venueId: venueId,
      venueName: "Ideal Studio",
      venueNameNative: "이데알 스튜디오",
      city: "BUSAN",
      country: "KOREA",
      price: "",
      currency: "KRW",
      startTime: "19:00",
      endTime: "23:30",
      organizerId: "manual_sarah",
      organizerName: "Sarah Han",
      organizerNameNative: "사라",
      djs: [
        {
          id: 'dj_' + Math.random().toString(36).substring(2, 11),
          date: "2026-07-18",
          djName: "Robroy",
          djNameNative: "롭로이"
        }
      ],
      djName: "Robroy",
      description: "이데알 스튜디오 8주년 & 사라 이데알 2주년 기념 파티 2부(밤밀)입니다. DJ 롭로이와 함께 깊어가는 축제의 밤을 즐겨보세요! 스페셜 공연(18:30~19:00)과 사진 카푸치노가 함께합니다. 🎶",
      subCategory: "milonga",
      imageUrl: idealImageUrl
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

  // 5. Tango Fire 화요 정기 소셜 업데이트
  const fireSocialId = 'lp3DufRSyK0S49pkOKnE';
  console.log(`Updating Tango Fire (${fireSocialId})...`);
  const fireRef = db.collection('socials').doc(fireSocialId);
  const fireSnap = await fireRef.get();
  
  if (fireSnap.exists) {
    const fireData = fireSnap.data();
    const djs = fireData.djs || [];
    const targetDate = '2026-06-16';
    
    // DJ 중복 체크 및 추가
    if (!djs.some(d => d.date === targetDate)) {
      djs.push({
        id: 'dj_' + Math.random().toString(36).substring(2, 11),
        date: targetDate,
        djName: "Gianluca",
        djNameNative: "쟌루카"
      });
    } else {
      const idx = djs.findIndex(d => d.date === targetDate);
      djs[idx].djName = "Gianluca";
      djs[idx].djNameNative = "쟌루카";
    }

    djs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const futureDj = djs.find(d => new Date(d.date) >= new Date()) || djs[djs.length - 1];

    await fireRef.update({
      djs,
      djName: futureDj ? futureDj.djName : "Gianluca",
      imageUrl: fireImageUrl,
      venueId: "l2rlntsTJ7KgRkmiaqOW", // Tango Cafe Ideal 매핑 보정
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Tango Fire updated successfully.');
  } else {
    console.log('Warning: Tango Fire social document not found!');
  }

  console.log('All tasks completed successfully!');
}

runTasks()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Task failed:', err);
    process.exit(1);
  });
