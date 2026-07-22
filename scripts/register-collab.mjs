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
const mediaDir = 'C:\\Users\\stone\\.gemini\\antigravity\/\/brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\.user_uploaded\\';

async function uploadFile(localName, destPath, contentType) {
  const localPath = mediaDir + localName;
  console.log(`Uploading ${localName} to ${destPath}...`);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType }
  });
  await bucket.file(destPath).makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
}

async function run() {
  console.log('=== STARTING COLLABORATION MILONGA REGISTRATION ===');

  // 1. 이미지 업로드
  const imageUrl = await uploadFile(
    'media__1784715997185.jpg',
    'socials/popup_bienu_jams_collab_20260810/poster.jpg',
    'image/jpeg'
  );

  // 2. 소셜 등록
  await db.collection('socials').doc('popup_bienu_jams_collab_20260810').set({
    title: "Bienu X Jam's Collaboration Milonga",
    titleNative: '비에누 X 잼스밀롱가 콜라보 밀롱가',
    type: 'popup',
    subCategory: 'milonga',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-08-10T00:00:00+09:00')),
    startTime: '19:00',
    endTime: '23:00',
    venueId: 'v_manual_seoul_andante',
    venueName: 'Tango Andante',
    venueNameNative: '안단테',
    price: '10,000 KRW',
    currency: 'KRW',
    city: 'SEOUL',
    country: 'KR',
    imageUrl: imageUrl,
    posterExportUrl: imageUrl,
    djName: 'Ani & James',
    djNameNative: '애니 y 제임스',
    djs: [{
      id: 'dj-collab-20260810',
      date: '2026-08-10',
      djName: 'Ani & James',
      djNativeName: '애니 y 제임스',
      djNameNative: '애니 y 제임스'
    }],
    organizerId: 'manual_bienu_jams',
    organizerName: "Bienu & Jam's",
    organizerNameNative: '비에누 y 잼스밀롱가',
    description: "비에누와 잼스밀롱가의 특별한 콜라보 밀롱가! 🥂✨\n\n귀엽고 달콤·발랄한 에너지의 애니 DJ와 묵직하고 깊은 감성의 제임스 DJ가 만나 두 배의 매력을 선사합니다. 월요일 저녁 안단테에서 신나게 달려보아요!\n\n• 일시: 2026년 8월 10일 (월) PM 7:00 ~ 11:00\n• DJ: 애니 (Ani) & 제임스 (James)\n• 장소: 안단테 (Tango Andante)\n• 입장료: 10,000원",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('=== COLLABORATION MILONGA REGISTRATION COMPLETED ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
