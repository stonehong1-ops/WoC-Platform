import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// firebase-admin 초기화 (서비스 어카운트 연동)
const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  admin.initializeApp({
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();

async function run() {
  console.log("Searching for Pista venue...");
  const venuesSnap = await db.collection('venues').get();
  let matchedVenueId = "";
  let matchedVenueData = null;

  venuesSnap.docs.forEach(doc => {
    const data = doc.data();
    const name = (data.name || "").toLowerCase();
    const nameKo = (data.nameKo || "").toLowerCase();
    if (name.includes("pista") || nameKo.includes("피스타")) {
      matchedVenueId = doc.id;
      matchedVenueData = data;
    }
  });

  if (matchedVenueId) {
    console.log(`Found Pista Venue: ID = ${matchedVenueId}, Name = ${matchedVenueData.nameKo} (${matchedVenueData.name})`);
  } else {
    console.log("Pista venue not found in database. Fallback to default 'pista'.");
    matchedVenueId = "pista";
  }

  // 6월 매주 월(1)/화(2)/수(3)/목(4) 요일 매핑
  const daysOfWeek = [1, 2, 3, 4];
  const dayNames = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday"
  };

  console.log("Registering Pista Daytime Practica regular events...");

  for (const day of daysOfWeek) {
    const newSocial = {
      type: "regular", // 정기 스케줄!
      subCategory: "practica", // 쁘락띠까!
      title: "Pista Daytime Practica",
      titleNative: "피스타 낮 쁘락띠까",
      organizerId: "choowoo",
      organizerName: "Choowoo",
      organizerNameNative: "추우",
      organizerIds: ["choowoo"],
      organizerNames: ["Choowoo"],
      organizerNativeNames: ["추우"],
      venueId: matchedVenueId,
      venueName: matchedVenueData ? matchedVenueData.name : "Tango Pista",
      venueNameNative: matchedVenueData ? matchedVenueData.nameKo : "피스타",
      imageUrl: "/images/pista_daytime_practica.jpg",
      startTime: "14:00",
      endTime: "18:00",
      country: "KR",
      city: "Seoul",
      district: "마포구",
      dayOfWeek: day, // 1 (월), 2 (화), 3 (수), 4 (목)
      recurrence: "every",
      price: "10,000",
      description: "6월 매주 월/화/수/목 자율 쁘락\n\n[이용 요금]\n• 1회: 10,000원\n• 지정 요일 월정액: 25,000원\n• 요일 무제한 낮쁘 월정액: 60,000원\n\n* 가이드 없는 자율 쁘락\n* 4인용 발레바 구비\n* 쁘락지기: 추우 (010-8480-3114)\n\n※ 6/3(수)은 낮 밀롱가로 인해 쉬어갔습니다.",
      organizerPhone: "010-8480-3114",
      staffNames: ["추우"],
      createdAt: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection("socials").add(newSocial);
    console.log(`- Added regular event for ${dayNames[day]} (dayOfWeek: ${day})! ID = ${docRef.id}`);
  }

  console.log("All Pista Daytime Practica events added successfully!");
}

run().catch(console.error);
