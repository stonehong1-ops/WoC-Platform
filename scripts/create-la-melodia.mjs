import admin from 'firebase-admin';
import fs from 'fs';

// 서비스 계정 키 파일 로드
const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function createSocial() {
  const socialRef = db.collection('socials').doc();
  const socialId = socialRef.id;
  
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781513939191.jpg';
  const destPath = `socials/${socialId}/poster_la_melodia.jpg`;
  
  console.log('Uploading image to Storage...');
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  });
  
  const file = bucket.file(destPath);
  console.log('Making image public...');
  await file.makePublic();
  
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded image URL:', imageUrl);

  const djRandomId = 'dj_' + Math.random().toString(36).substring(2, 11);
  
  const data = {
    id: socialId,
    title: "La Melodia",
    titleNative: "La Melodía",
    type: "regular",
    dayOfWeek: 0,
    recurrence: "1st,3rd",
    startTime: "19:00",
    endTime: "23:00",
    venueId: "QtjovOcmoPzJ8SPyeZKh",
    venueName: "Andante",
    venueNameNative: "안단테",
    city: "SEOUL",
    country: "KOREA",
    price: "13000",
    currency: "KRW",
    organizerId: "manual_melodian",
    organizerName: "Melodian",
    organizerNameNative: "멜로디언",
    organizerIds: ["manual_melodian", "manual_handa"],
    organizerNames: ["Melodian", "Handa"],
    organizerNativeNames: ["멜로디언", "한다"],
    djs: [
      {
        id: djRandomId,
        date: "2026-06-21",
        djName: "Hoon",
        djNameNative: "훈"
      }
    ],
    djName: "Hoon",
    description: "눈치 보지 않고 편안하게 춤출 수 있는 곳, La Melodía는 이번 주 일요일부터 저녁 7시 ~ 11시, 안단테에서 첫째·셋째 주 일요일 저녁에 열립니다. 좋은 음악이 흐르고, 춤이 자연스럽게 이어지는 곳. La Melodía에서 만나요. 🎶",
    subCategory: "milonga",
    imageUrl: imageUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  console.log('Saving social to Firestore...');
  await socialRef.set(data);
  console.log("Success! Social registered with ID:", socialId);
}

createSocial()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Registration failed:', err);
    process.exit(1);
  });
