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
  // 1. La Melodia (일요)
  '5GhmrJXdNzdte53Qs1uD': 'socials/5GhmrJXdNzdte53Qs1uD/poster_la_melodia.jpg',
  // 2. 화요 오렌지
  'EqZPQLbM3rDh1C3xdGLU': 'socials/EqZPQLbM3rDh1C3xdGLU/poster.jpg',
  // 3. 목요 까베세오
  'FlfaKe3IE2P5Ldx5Gr8O': 'socials/1780503492365_andante.jpg',
  // 4. 토요 까베세오
  'QeCGlfbf6oJrlEUoswjL': 'socials/1780301988117_andante sat.jpg',
  // 5. 토요 애프터눈 ONE
  'YzYzfVNnYqPJ7riMwPWT': 'socials/1780301851526_andante sat day.jpg',
  // 6. 일요 알롱가
  'nNxPVNAsmjvnZsyc73T8': 'socials/1780302386259_andante.jpg',
  // 7. 금요 올라 Hola / LUMINOSO
  'iNmsCS86KtAqMLFAeqfE': 'socials/1780302386259_andante.jpg',
  // 8. 금요 뮤롱가
  'BrP6IxFlHSpxA37nKpmZ': 'socials/1780302386259_andante.jpg',
  // 9. 금요 알밀
  'ly4uuyXjO3Cnhnd9dsCD': 'socials/ly4uuyXjO3Cnhnd9dsCD/poster.png',
  // 10. 일요 줄리
  'qJ8IAzDvW8JLj5zD1YXV': 'socials/qJ8IAzDvW8JLj5zD1YXV/1780633419518_poster.png',
  // 11. 일요 히로
  'd1bZMMcG1KSBBm4dMdEe': 'socials/d1bZMMcG1KSBBm4dMdEe/poster_20260628.jpg',
  // 12. 7/17 금요 낮 까베세오 팝업
  'popup_andante_cabeceo_20260717': 'socials/1780503492365_andante.jpg'
};

async function run() {
  console.log('Restoring original poster imageUrls for Andante club socials...');
  
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

  console.log('ALL POSTERS RESTORED SUCCESSFULLY!');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
