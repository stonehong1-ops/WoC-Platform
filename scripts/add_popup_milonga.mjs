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
  console.log("Searching for Magenta venue...");
  const venuesSnap = await db.collection('venues').get();
  let matchedVenueId = "";
  let matchedVenueData = null;

  venuesSnap.docs.forEach(doc => {
    const data = doc.data();
    const name = (data.name || "").toLowerCase();
    const nameKo = (data.nameKo || "").toLowerCase();
    if (name.includes("magenta") || nameKo.includes("마젠타")) {
      matchedVenueId = doc.id;
      matchedVenueData = data;
    }
  });

  if (matchedVenueId) {
    console.log(`Found Magenta Venue: ID = ${matchedVenueId}, Name = ${matchedVenueData.nameKo} (${matchedVenueData.name})`);
  } else {
    console.log("Magenta venue not found in database. Fallback to default 'magenta'.");
    matchedVenueId = "magenta";
  }

  // 6/20일 (토요일) 날짜 객체 생성 (2026년 6월 20일 00:00:00 UTC)
  const eventDate = new Date("2026-06-20T00:00:00Z");

  const newSocial = {
    type: "popup", // 팝업 밀롱가!
    subCategory: "milonga",
    title: "JB Milonga",
    titleNative: "JB 밀롱가",
    organizerId: "junchi-boonie",
    organizerName: "Junchi & Boonie",
    organizerNameNative: "준치 & 부니",
    organizerIds: ["junchi-boonie"],
    organizerNames: ["Junchi & Boonie"],
    organizerNativeNames: ["준치 & 부니"],
    venueId: matchedVenueId,
    venueName: matchedVenueData ? matchedVenueData.name : "Magenta",
    venueNameNative: matchedVenueData ? matchedVenueData.nameKo : "마젠타",
    imageUrl: "/images/jb_milonga_popup.png",
    startTime: "18:30",
    endTime: "22:00",
    country: "KR",
    city: "Seoul",
    district: "강남구",
    date: admin.firestore.Timestamp.fromDate(eventDate),
    description: "누구라도 환영해요\n편히 함께 즐겨요~~\n많이 놀러오세요~~🤩\n\nWith:\n• Taro Junghoon Moon\n• Nia Tango\n\nFriends:\n• 이동욱\n• 권현아\n• Gatz Xeezia\n• Flora Bibiana\n\nBuddy:\n• 노은실",
    djName: "Eddy",
    djNameNative: "Eddy (박성준)",
    organizerPhone: "010-4949-5600",
    staffNames: [
      "Taro Junghoon Moon",
      "Nia Tango",
      "이동욱",
      "권현아",
      "Gatz Xeezia",
      "Flora Bibiana",
      "노은실"
    ],
    createdAt: admin.firestore.Timestamp.now()
  };

  console.log("Creating new popup milonga document via admin SDK...");
  const docRef = await db.collection("socials").add(newSocial);
  console.log(`Successfully added popup milonga document! ID = ${docRef.id}`);
}

run().catch(console.error);
