import admin from 'firebase-admin';
import fs from 'fs';

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
  const groupId = "tango-pista";
  const venueId = "xVJsZb5y34WjlqP5iHDr";

  console.log(`1. Updating group profile for: ${groupId}...`);
  const groupRef = db.collection('groups').doc(groupId);

  const groupUpdate = {
    address: "서울특별시 마포구 월드컵북로6길 49",
    detailedAddress: "지하 1층 피스타",
    naverMapUrl: "https://naver.me/F75aCYf0",
    googleMapUrl: "https://maps.app.goo.gl/MJZqYfuEq5BGHpwo8?g_st=ac",
    representative: {
      name: "Banny",
      localName: "바니",
      phone: "010-2803-3959",
      email: "uandi4eva@naver.com",
      kakaoId: "canusmile4me"
    },
    socialLinks: {
      facebook: "https://www.facebook.com/jiyu.banny",
      instagram: "https://www.instagram.com/pista.tango/",
      kakaoOpenChat: "https://open.kakao.com/o/g3wPepNh"
    },
    representativeName: "바니 Banny",
    updatedAt: admin.firestore.Timestamp.now()
  };

  await groupRef.update(groupUpdate);
  console.log(`✅ Group tango-pista successfully updated!`);

  console.log(`2. Updating venue profile for: ${venueId}...`);
  const venueRef = db.collection('venues').doc(venueId);

  const venueUpdate = {
    address: "서울특별시 마포구 월드컵북로6길 49 B1 피스타",
    detailAddress: "지하 1층",
    naverMapUrl: "https://naver.me/F75aCYf0",
    googleMapUrl: "https://maps.app.goo.gl/MJZqYfuEq5BGHpwo8?g_st=ac",
    phone: "010-2803-3959",
    socialLinks: {
      facebook: "https://www.facebook.com/jiyu.banny",
      instagram: "https://www.instagram.com/pista.tango/",
      kakaoOpenChat: "https://open.kakao.com/o/g3wPepNh"
    },
    updatedAt: admin.firestore.Timestamp.now()
  };

  await venueRef.update(venueUpdate);
  console.log(`✅ Venue xVJsZb5y34WjlqP5iHDr successfully updated!`);
}

run().catch(console.error);
