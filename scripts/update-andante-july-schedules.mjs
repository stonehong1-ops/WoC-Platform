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

async function run() {
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1783451702166.png';
  const destPath = `socials/andante_calendar_202607/poster.png`;

  console.log('1. Uploading calendar image to storage...');
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: { contentType: 'image/png' }
  });

  const file = bucket.file(destPath);
  await file.makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Uploaded image URL:', imageUrl);

  // 1. 화요 오렌지 (EqZPQLbM3rDh1C3xdGLU)
  console.log('Updating Orange (EqZPQLbM3rDh1C3xdGLU)...');
  await db.collection('socials').doc('EqZPQLbM3rDh1C3xdGLU').set({
    imageUrl: imageUrl,
    djName: 'Loca',
    djNameNative: '로까',
    djs: [
      { id: 'dj-nacho-20260707', date: '2026-07-07', djName: 'Nacho', djNameNative: '나초' },
      { id: 'dj-hjun-20260714', date: '2026-07-14', djName: 'H. Jun', djNameNative: '에이치준' },
      { id: 'dj-loca-20260721', date: '2026-07-21', djName: 'Loca', djNameNative: '로까' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. 목요 까베세오 (FlfaKe3IE2P5Ldx5Gr8O)
  console.log('Updating Cabeceo Thu (FlfaKe3IE2P5Ldx5Gr8O)...');
  await db.collection('socials').doc('FlfaKe3IE2P5Ldx5Gr8O').set({
    imageUrl: imageUrl,
    djName: 'Hug',
    djNameNative: '허그',
    djs: [
      { id: 'dj-andante-20260709', date: '2026-07-09', djName: 'An Dante', djNameNative: '안단테' },
      { id: 'dj-siro-20260716', date: '2026-07-16', djName: 'Siro', djNameNative: '시로' },
      { id: 'dj-hug-20260723', date: '2026-07-23', djName: 'Hug', djNameNative: '허그' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 3. 금요 올라 Hola (iNmsCS86KtAqMLFAeqfE)
  console.log('Updating Hola Fri (iNmsCS86KtAqMLFAeqfE)...');
  await db.collection('socials').doc('iNmsCS86KtAqMLFAeqfE').set({
    imageUrl: imageUrl,
    djName: 'Carlos',
    djNameNative: '카를로스',
    djs: [
      { id: 'dj-carlos-20260710', date: '2026-07-10', djName: 'Carlos', djNameNative: '카를로스' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 4. 금요 뮤롱가 (BrP6IxFlHSpxA37nKpmZ)
  console.log('Updating Muronga Fri (BrP6IxFlHSpxA37nKpmZ)...');
  await db.collection('socials').doc('BrP6IxFlHSpxA37nKpmZ').set({
    imageUrl: imageUrl,
    djName: 'Yeon Poong',
    djNameNative: '연풍',
    djs: [
      { id: 'dj-yeonpoong-20260717', date: '2026-07-17', djName: 'Yeon Poong', djNameNative: '연풍' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 5. 금요 알밀 (ly4uuyXjO3Cnhnd9dsCD)
  console.log('Updating Al Mil Fri (ly4uuyXjO3Cnhnd9dsCD)...');
  await db.collection('socials').doc('ly4uuyXjO3Cnhnd9dsCD').set({
    imageUrl: imageUrl,
    djName: 'Carmen',
    djNameNative: '카르멘',
    djs: [
      { id: 'dj-carmen-20260724', date: '2026-07-24', djName: 'Carmen', djNameNative: '카르멘' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 6. 토요 까베세오 (QeCGlfbf6oJrlEUoswjL)
  console.log('Updating Cabeceo Sat (QeCGlfbf6oJrlEUoswjL)...');
  await db.collection('socials').doc('QeCGlfbf6oJrlEUoswjL').set({
    imageUrl: imageUrl,
    djName: 'Hiro',
    djNameNative: '히로',
    djs: [
      { id: 'dj-gianluca-20260711', date: '2026-07-11', djName: 'Gianluca', djNameNative: '지안루카' },
      { id: 'dj-mark-20260718', date: '2026-07-18', djName: 'Mark', djNameNative: '마크' },
      { id: 'dj-hiro-20260725', date: '2026-07-25', djName: 'Hiro', djNameNative: '히로' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 7. 토요 ONE / A.M. (YzYzfVNnYqPJ7riMwPWT)
  console.log('Updating ONE Sat (YzYzfVNnYqPJ7riMwPWT)...');
  await db.collection('socials').doc('YzYzfVNnYqPJ7riMwPWT').set({
    imageUrl: imageUrl,
    djName: 'One',
    djNameNative: '원',
    djs: [
      { id: 'dj-one-20260711', date: '2026-07-11', djName: 'One', djNameNative: '원' },
      { id: 'dj-one-20260718', date: '2026-07-18', djName: 'One', djNameNative: '원' },
      { id: 'dj-one-20260725', date: '2026-07-25', djName: 'One', djNameNative: '원' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 8. 일요 알롱가 (nNxPVNAsmjvnZsyc73T8)
  console.log('Updating Alonga Sun (nNxPVNAsmjvnZsyc73T8)...');
  await db.collection('socials').doc('nNxPVNAsmjvnZsyc73T8').set({
    imageUrl: imageUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 9. 일요 줄리 (qJ8IAzDvW8JLj5zD1YXV)
  console.log('Updating Julie Sun (qJ8IAzDvW8JLj5zD1YXV)...');
  await db.collection('socials').doc('qJ8IAzDvW8JLj5zD1YXV').set({
    imageUrl: imageUrl,
    djName: 'Yeon Poong',
    djNameNative: '연풍',
    djs: [
      { id: 'dj-yeonpoong-20260712', date: '2026-07-12', djName: 'Yeon Poong', djNameNative: '연풍' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 10. 일요 라멜로디아 (5GhmrJXdNzdte53Qs1uD)
  console.log('Updating La Melodia Sun (5GhmrJXdNzdte53Qs1uD)...');
  await db.collection('socials').doc('5GhmrJXdNzdte53Qs1uD').set({
    imageUrl: imageUrl,
    djName: 'Cya',
    djNameNative: '샤',
    djs: [
      { id: 'dj-cya-20260719', date: '2026-07-19', djName: 'Cya', djNameNative: '샤' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 11. 일요 히로 (d1bZMMcG1KSBBm4dMdEe)
  console.log('Updating Hiro Sun (d1bZMMcG1KSBBm4dMdEe)...');
  await db.collection('socials').doc('d1bZMMcG1KSBBm4dMdEe').set({
    imageUrl: imageUrl,
    djName: 'Carlos',
    djNameNative: '카를로스',
    djs: [
      { id: 'dj-carlos-20260726', date: '2026-07-26', djName: 'Carlos', djNameNative: '카를로스' }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 12. [신규 팝업] 7/17 금요 낮 까베세오
  console.log('Creating Fri Afternoon Cabeceo popup...');
  const popupId = 'popup_andante_cabeceo_20260717';
  await db.collection('socials').doc(popupId).set({
    type: 'popup',
    subCategory: 'milonga',
    title: 'Cabeceo',
    titleNative: '까베세오(금낮)',
    date: admin.firestore.Timestamp.fromDate(new Date('2026-07-17T00:00:00+09:00')),
    startTime: '14:30',
    endTime: '19:00',
    venueId: 'QtjovOcmoPzJ8SPyeZKh', // 안단테
    venueName: 'Andante',
    venueNameNative: '안단테',
    city: 'SEOUL',
    country: 'KOREA',
    imageUrl: imageUrl,
    djName: 'OZ',
    djNameNative: '오즈',
    djs: [
      { id: 'dj-oz-20260717', date: '2026-07-17', djName: 'OZ', djNameNative: '오즈' }
    ],
    organizerId: 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2', // One
    organizerName: 'One',
    organizerNameNative: '원',
    price: 'KRW 13000',
    description: '안단테 7월 특별 금요 낮 까베세오\n\n• 일시: 2026년 7월 17일 금요일 낮 2:30 ~ 7:00\n• DJ: 오즈 (OZ)\n• 입장료: 13,000원\n• 장소: 안단테 (Andante)\n• 문의: One (010-6886-6777)',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
