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

  // 6월 한정 3개 일요일 날짜 (6/7, 6/14, 6/21)
  const targetDates = [
    "2026-06-07T00:00:00Z",
    "2026-06-14T00:00:00Z",
    "2026-06-21T00:00:00Z"
  ];

  console.log("Registering Pista Practica popup events...");

  for (const dateStr of targetDates) {
    const eventDate = new Date(dateStr);
    const dateFormatted = dateStr.split('T')[0];

    const newSocial = {
      type: "popup", // 팝업!
      subCategory: "practica", // 쁘락띠까!
      title: "Pista Practica",
      titleNative: "피스타 쁘락띠까",
      organizerId: "choowoo",
      organizerName: "Choowoo",
      organizerNameNative: "추우",
      organizerIds: ["choowoo"],
      organizerNames: ["Choowoo"],
      organizerNativeNames: ["추우"],
      venueId: matchedVenueId,
      venueName: matchedVenueData ? matchedVenueData.name : "Tango Pista",
      venueNameNative: matchedVenueData ? matchedVenueData.nameKo : "피스타",
      imageUrl: "/images/pista_practica_popup.png",
      startTime: "10:00",
      endTime: "18:00",
      country: "KR",
      city: "Seoul",
      district: "마포구",
      date: admin.firestore.Timestamp.fromDate(eventDate),
      price: "10,000",
      description: "6월 한정 일요일 자율 쁘락\n\n[시간 안내]\n• 1차: 10AM ~ 2PM\n• 2차: 2PM ~ 6PM\n\n* 가이드 없는 자율 쁘락\n* 4인용 발레바 구비\n* 쁘락지기: 추우 (010-8480-3114)\n\n※ 6/28(일)은 슈팅스타 탱고대회 참가로 인해 쉬어갑니다.",
      organizerPhone: "010-8480-3114",
      staffNames: ["추우"],
      createdAt: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection("socials").add(newSocial);
    console.log(`- Added event for ${dateFormatted}! ID = ${docRef.id}`);
  }

  console.log("All Pista Practica events added successfully!");
}

run().catch(console.error);
