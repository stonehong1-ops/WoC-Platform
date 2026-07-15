import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function uploadImage(localPath, destPath, contentType) {
  console.log(`Uploading ${localPath} to ${destPath}...`);
  const fileRef = bucket.file(destPath);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType }
  });
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/${destPath}`;
  console.log(`Uploaded successfully. URL: ${url}`);
  return url;
}

async function run() {
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Puerto Tango Gathering
  const puertoUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783461695239.png",
    "socials/fApjgip6uUZc63E4grqi/poster_20260712.png",
    "image/png"
  );
  
  const puertoRef = db.collection('socials').doc('fApjgip6uUZc63E4grqi');
  const puertoSnap = await puertoRef.get();
  let puertoDjs = [];
  if (puertoSnap.exists && puertoSnap.data().djs) {
    puertoDjs = puertoSnap.data().djs;
  }
  // Remove duplicate 7/12 DJ schedule if exists
  puertoDjs = puertoDjs.filter(d => d.date !== "2026-07-12");
  puertoDjs.push({
    id: "dj-woongi-20260712",
    date: "2026-07-12",
    djName: "Woongi",
    djNameNative: "웅이"
  });

  const puertoDesc = `다가오는 7/12(일) 뿌땅 정모도 맛있는 음식과 멋진 음악 그리고 좋은 사람들이 함께 하는 따뜻한 분위기를 정성껏 준비하겠습니다🥰

• 장소: 서면 이데알 TANGO BAR
• DJ: 웅이님 (DJ Woongi)
• 일시: 7/12(일) PM 6시 ~ 10시`;

  await puertoRef.update({
    imageUrl: puertoUrl,
    posterExportUrl: puertoUrl,
    venueId: "l2rlntsTJ7KgRkmiaqOW",
    venueName: "Tango Cafe Ideal",
    venueNameNative: "서면 이데알",
    djName: "Woongi",
    djNameNative: "웅이",
    djs: puertoDjs,
    description: puertoDesc,
    updatedAt: now
  });
  console.log("Updated socials/fApjgip6uUZc63E4grqi");


  // 2. Lovely Milonga Summer Party
  const lovelyUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783461787843.jpg",
    "socials/popup_lovely_20260711/poster_20260711.jpg",
    "image/jpeg"
  );
  await db.collection('socials').doc('popup_lovely_20260711').update({
    imageUrl: lovelyUrl,
    posterExportUrl: lovelyUrl,
    updatedAt: now
  });
  console.log("Updated socials/popup_lovely_20260711");


  // 3. Daegu Dia Wednesday DDD
  const diaUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783461821759.png",
    "socials/daegu_dia_wednesday_ddd/poster_20260708.png",
    "image/png"
  );
  const diaRef = db.collection('socials').doc('daegu_dia_wednesday_ddd');
  const diaSnap = await diaRef.get();
  let diaDjs = [];
  if (diaSnap.exists && diaSnap.data().djs) {
    diaDjs = diaSnap.data().djs;
  }
  diaDjs = diaDjs.filter(d => d.date !== "2026-07-08");
  diaDjs.push({
    id: "dj-rodrigo-20260708",
    date: "2026-07-08",
    djName: "Rodrigo Roda",
    djNameNative: "로드리고 로다"
  });

  const diaDesc = `탱고 추며 놀기에 딱! 좋은 수요일에 신나고 따뜻한 밀롱가를 기다려봅니다.
DIA에서는 매주 수요일 밀롱가를 열고 있으니, 많은 응원과 격려 부탁드립니다.

• 일시: 2026년 7월 8일 (수) 21:00 @ Dia
• DJ: Rodrigo Roda (로드리고 로다)
• Entrance fee: 10,000 KRW (수요일 수업 수강자 5,000 KRW)
• 장소: 대구광역시 북구 침산로 168 엠브로타워 507호 (Dia)`;

  await diaRef.update({
    imageUrl: diaUrl,
    posterExportUrl: diaUrl,
    djName: "Rodrigo Roda",
    djNameNative: "로드리고 로다",
    djs: diaDjs,
    description: diaDesc,
    updatedAt: now
  });
  console.log("Updated socials/daegu_dia_wednesday_ddd");


  // 4. Tango Fire Tuesday
  const fireUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783461917198.jpg",
    "socials/nUMZ7l8ilMo3XOx0dHaH/poster_20260707.jpg",
    "image/jpeg"
  );
  const fireRef = db.collection('socials').doc('nUMZ7l8ilMo3XOx0dHaH');
  const fireSnap = await fireRef.get();
  let fireDjs = [];
  if (fireSnap.exists && fireSnap.data().djs) {
    fireDjs = fireSnap.data().djs;
  }
  fireDjs = fireDjs.filter(d => d.date !== "2026-07-07");
  fireDjs.push({
    id: "dj-seethrouth-20260707",
    date: "2026-07-07",
    djName: "Seethrouth",
    djNameNative: "시스루"
  });

  const fireDesc = `화요일 파이어 (Tango Fire)

• 일시: 매주 화요일 20:30 ~ 24:00 @ La Ventana (라 벤따나)
• 7/7 DJ: Seethrouth (시스루)
• 장소: 서울시 마포구 서교동 372-2 2층`;

  await fireRef.update({
    imageUrl: fireUrl,
    posterExportUrl: fireUrl,
    djName: "Seethrouth",
    djNameNative: "시스루",
    djs: fireDjs,
    description: fireDesc,
    updatedAt: now
  });
  console.log("Updated socials/nUMZ7l8ilMo3XOx0dHaH");

  console.log("All updates complete.");
}

run().catch(console.error);
