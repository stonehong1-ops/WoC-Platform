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

  console.log("Registering Pista Monday Practica regular event...");

  const newSocial = {
    type: "regular", // 정기 스케줄!
    subCategory: "practica", // 쁘락띠까!
    title: "Pista Monday Practica",
    titleNative: "피스타 월요 쁘락띠까",
    organizerId: "conan",
    organizerName: "Conan",
    organizerNameNative: "코난",
    organizerIds: ["conan"],
    organizerNames: ["Conan"],
    organizerNativeNames: ["코난"],
    venueId: matchedVenueId,
    venueName: matchedVenueData ? matchedVenueData.name : "Tango Pista",
    venueNameNative: matchedVenueData ? matchedVenueData.nameKo : "피스타",
    imageUrl: "/images/pista_monday_practica.jpg",
    startTime: "19:00",
    endTime: "24:00",
    country: "KR",
    city: "Seoul",
    district: "마포구",
    dayOfWeek: 1, // 1 (월요일)
    recurrence: "every",
    price: "10,000",
    description: "매주 월요일 자율 쁘락\n\n[이용 요금]\n• 1회: 10,000원\n• 월정액: 25,000원\n\n* 가이드 없는 자율 쁘락\n* 4인용 발레바 구비\n* 쁘락지기: 코난 (010-7751-8259)",
    organizerPhone: "010-7751-8259",
    staffNames: ["코난"],
    createdAt: admin.firestore.Timestamp.now()
  };

  const docRef = await db.collection("socials").add(newSocial);
  console.log(`Successfully added Pista Monday Practica regular event! ID = ${docRef.id}`);
}

run().catch(console.error);
