import admin from 'firebase-admin';
import fs from 'fs';

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

  // 6/12 (금요일) 날짜 객체 생성 (2026년 6월 12일 00:00:00 UTC)
  const eventDate = new Date("2026-06-12T00:00:00Z");

  const newSocial = {
    type: "popup", // 팝업!
    subCategory: "milonga", // 밀롱가!
    title: "Ivy Milonga",
    titleNative: "아이비 밀롱가",
    organizerId: "ivy",
    organizerName: "Ivy",
    organizerNameNative: "아이비",
    organizerIds: ["ivy"],
    organizerNames: ["Ivy"],
    organizerNativeNames: ["아이비"],
    venueId: matchedVenueId,
    venueName: matchedVenueData ? matchedVenueData.name : "Tango Pista",
    venueNameNative: matchedVenueData ? matchedVenueData.nameKo : "피스타",
    imageUrl: "/images/ivy_milonga_popup.png",
    startTime: "20:00",
    endTime: "24:00",
    country: "KR",
    city: "Seoul",
    district: "마포구",
    date: admin.firestore.Timestamp.fromDate(eventDate),
    price: "13,000",
    description: "🎀 아이비밀롱가 놀러오세요 🎀\n어디를 갈까 망설이는 금요일 밤, \n당신이 가장 깊이 몰입할 수 있는 단 하나의 포옹~탱고\n우리 탱고 함께 해요~~\n\n🍒 앵두 같이 먹어요 🍒\n\n• 일시: 6월 12일 (금) PM 20:00 ~ 24:00\n• DJ: 빌리\n• Org: 아이비\n• 입장료: 13,000원\n\n[테이블 예약/문의]\n- 카톡: lvytango\n- 연락처: 010-6226-5453\n\n📍 장소: 홍대 탱고피스타 (마포구 월드컵북로6길 49 B1)",
    djName: "Billy",
    djNameNative: "빌리",
    organizerPhone: "010-6226-5453",
    staffNames: ["아이비"],
    createdAt: admin.firestore.Timestamp.now()
  };

  console.log("Registering Ivy Milonga popup event...");
  const docRef = await db.collection("socials").add(newSocial);
  console.log(`Successfully added Ivy Milonga popup event! ID = ${docRef.id}`);
}

run().catch(console.error);
