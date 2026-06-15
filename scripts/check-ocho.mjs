import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const bucket = admin.storage().bucket();

const socialIds = [
  { id: 'maMVsnmrc6lplGXCIr8D', name: '무초밀' },
  { id: 'bb1YNxoL4iXtfEdDtUbJ', name: '까사' },
  { id: 'PxeRaC6Ky260cdfPLFTh', name: '수에잇밀' },
  { id: 'FhUfMtTw6hyg3sdZq734', name: '서울밀' },
  { id: 'vQ4SASAdywi4Nj74SsAm', name: '클럽 그리셀' },
  { id: 'RcwxqCMwdSX5oABMNJeH', name: '토이프밀롱가' },
  { id: 'C0xF4VaGDIRIyt8a2hta', name: '일 루미' },
  { id: 'O6Oql4EXX4ZboWkQnBwD', name: '로까' }
];

async function checkStorage() {
  console.log('=== Checking Storage Files per Social ===');
  for (const s of socialIds) {
    console.log(`\nSocial: [${s.name}] (id=${s.id})`);
    const [files] = await bucket.getFiles({ prefix: `socials/${s.id}/` });
    if (files.length === 0) {
      console.log('  No files found under socials/' + s.id + '/');
      continue;
    }
    files.forEach(f => {
      console.log(`  File: name=${f.name}, updated=${f.metadata.updated}`);
    });
  }
}

checkStorage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
