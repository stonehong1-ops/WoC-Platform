import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const brainDir = 'C:/Users/stone/.gemini/antigravity/brain/77584f7a-10ee-43e5-a1b6-5a48a55e20e7';

async function uploadImage(filename, docId) {
  const filePath = path.join(brainDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return '';
  }

  const fileExtension = path.extname(filename).toLowerCase();
  const contentType = fileExtension === '.png' ? 'image/png' : 'image/jpeg';
  const destPath = `socials/${docId}/poster${fileExtension}`;
  
  console.log(`Uploading ${filename} to ${destPath}...`);
  const file = bucket.file(destPath);
  const buffer = fs.readFileSync(filePath);
  
  await file.save(buffer, {
    metadata: {
      contentType: contentType,
      cacheControl: 'public, max-age=31536000'
    }
  });
  
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log(`Uploaded successfully! URL: ${publicUrl}`);
  return publicUrl;
}

async function run() {
  // 1. 카멜리아 (Camelia) 업데이트
  const cameliaId = 'n4MioMSdxqnA3CVfX53N';
  console.log(`Updating Camelia document ${cameliaId}...`);
  const cameliaPosterUrl = await uploadImage('media__1782773137440.png', cameliaId);

  const newCameliaDj = {
    date: '2026-07-01',
    djName: 'Gianluca',
    djNameNative: '지안루카',
    id: 'dj-gianluca-2026-07-01'
  };

  const cameliaDoc = await db.collection('socials').doc(cameliaId).get();
  let cameliaDjs = [];
  if (cameliaDoc.exists) {
    cameliaDjs = cameliaDoc.data().djs || [];
  }
  // 7/1 중복 제거 후 추가
  cameliaDjs = cameliaDjs.filter(d => d.date !== '2026-07-01');
  cameliaDjs.push(newCameliaDj);

  const cameliaDescription = '수까멜 CAMELIA\n\n• 일시: 2026년 7월 1일 (수) PM 7:30 ~ 11:30\n• DJ: Gianluca (지안루카)\n• Org: 까를로스 (Carlos)\n• 장소: 엔빠스 (En Paz - 서울 서초구 반포대로30길 82 B1)\n• 문의: 카톡 ID tanguerocarlos';

  await db.collection('socials').doc(cameliaId).update({
    imageUrl: cameliaPosterUrl,
    djs: cameliaDjs,
    djName: 'Gianluca',
    djNameNative: '지안루카',
    description: cameliaDescription
  });
  console.log('Camelia document updated successfully!');

  // 2. 밀롱가 우노 (milonga UNO) 업데이트
  const unoId = 'fWIzPkYwXL3IGwPKd6gw';
  console.log(`Updating Milonga Uno document ${unoId}...`);
  const unoPosterUrl = await uploadImage('media__1782773198370.png', unoId);

  const newUnoDj = {
    date: '2026-07-01',
    djName: 'Ban-A',
    djNameNative: '반아',
    id: 'dj-bana-2026-07-01'
  };

  const unoDoc = await db.collection('socials').doc(unoId).get();
  let unoDjs = [];
  if (unoDoc.exists) {
    unoDjs = unoDoc.data().djs || [];
  }
  // 7/1 중복 제거 후 추가
  unoDjs = unoDjs.filter(d => d.date !== '2026-07-01');
  unoDjs.push(newUnoDj);

  const unoDescription = '밀롱가 우노 milonga UNO\n\n• 일시: 2026년 7월 1일 (수) PM 8:00 ~ PM 12:00 (20:00 > 24:00)\n• DJ: Ban-A (반아)\n• Org: Augusto Kim & Silver Kim (아우구스토 & 실버)\n• 장소: 오나다 (Tango O Nada)\n\n"즐겁고 편하게 한잔 하고 싶으면 들러요~"\n#매월첫째수요일 #오나다 #낭만밀롱가우노';

  await db.collection('socials').doc(unoId).update({
    imageUrl: unoPosterUrl,
    djs: unoDjs,
    djName: 'Ban-A',
    djNameNative: '반아',
    organizerId: 'manual_augusto_silver',
    organizerName: 'Augusto & Silver',
    organizerNameNative: '아우구스토 & 실버',
    organizerIds: ['manual_augusto', 'manual_silver'],
    organizerNames: ['Augusto', 'Silver'],
    organizerNativeNames: ['아우구스토', '실버'],
    description: unoDescription
  });
  console.log('Milonga Uno document updated successfully!');
}

run().then(() => {
  console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
