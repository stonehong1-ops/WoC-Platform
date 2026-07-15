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

const posterMapping = {
  // 1. 카멜리아
  'n4MioMSdxqnA3CVfX53N': 'socials/n4MioMSdxqnA3CVfX53N/poster.png',
  // 2. 비다미아
  'R1hayB6of65wiDA27Q0U': 'socials/1777917312916_vidamia1.jpg',
  // 3. 로라밀
  'oFqiigaztVEnlojaFpuG': 'socials/posters/poster_oFqiigaztVEnlojaFpuG_1780612375073.jpg',
  // 4. 금요쁘락
  'X5DOqBguAJfWHmOd2yUu': 'socials/1780465935211_en_paz_friday_practica.png',
  // 5. 화엔쁘락
  'en_paz_tuesday_practica': 'socials/1780465935211_en_paz_friday_practica.png',
  // 6. 누베르
  'hEvFnQySTM3XtPCWShRd': 'socials/1777917312916_vidamia1.jpg'
};

async function run() {
  console.log('Restoring original poster imageUrls for En Paz socials...');
  
  for (const [docId, filePath] of Object.entries(posterMapping)) {
    console.log(`Processing doc: ${docId} -> ${filePath}`);
    const file = bucket.file(filePath);
    
    // 파일이 실제로 존재하는지 체크
    const [exists] = await file.exists();
    if (!exists) {
      console.error(`[-] File does not exist in storage: ${filePath}`);
      continue;
    }

    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    console.log(`[+] Public Url: ${imageUrl}`);

    await db.collection('socials').doc(docId).set({
      imageUrl: imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`[SUCCESS] Restored image for ${docId}`);
    console.log('------------------------------------');
  }

  console.log('ALL EN PAZ POSTERS RESTORED SUCCESSFULLY!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
