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

const ids = [
  '5GhmrJXdNzdte53Qs1uD',
  'BrP6IxFlHSpxA37nKpmZ',
  'EqZPQLbM3rDh1C3xdGLU',
  'FlfaKe3IE2P5Ldx5Gr8O',
  'iNmsCS86KtAqMLFAeqfE',
  'ly4uuyXjO3Cnhnd9dsCD',
  'nNxPVNAsmjvnZsyc73T8',
  'qJ8IAzDvW8JLj5zD1YXV',
  'd1bZMMcG1KSBBm4dMdEe',
  'QeCGlfbf6oJrlEUoswjL',
  'YzYzfVNnYqPJ7riMwPWT'
];

async function run() {
  console.log('Scanning Firebase Storage for original files...');
  
  // 1. socials/ 하위 폴더 스캔
  const [files] = await bucket.getFiles({ prefix: 'socials/' });
  
  const folderImages = {};
  files.forEach(f => {
    // socials/ID/ 파일인 경우
    const parts = f.name.split('/');
    if (parts.length > 2) {
      const id = parts[1];
      if (ids.includes(id) && !f.name.includes('andante_calendar_202607')) {
        if (!folderImages[id]) folderImages[id] = [];
        folderImages[id].push(f.name);
      }
    }
  });

  console.log('=== Folder Images ===');
  console.log(JSON.stringify(folderImages, null, 2));

  // 2. 전체 파일 목록 중 레거시 안단테 포스터 파일 검색
  // 예: 1780301988117_andante sat.jpg 와 같은 이름 패턴
  console.log('\nScanning for legacy image names in root or subdirs...');
  const legacyImages = [];
  files.forEach(f => {
    const name = f.name.toLowerCase();
    if (name.includes('andante') || name.includes('sat') || name.includes('orange') || name.includes('alonga') || name.includes('cabeceo')) {
      legacyImages.push(f.name);
    }
  });

  console.log('=== Legacy Images ===');
  console.log(JSON.stringify(legacyImages, null, 2));
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
