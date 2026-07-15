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
  'n4MioMSdxqnA3CVfX53N', // 카멜리아
  'X5DOqBguAJfWHmOd2yUu', // 금요쁘락
  'R1hayB6of65wiDA27Q0U', // 비다미아
  'oFqiigaztVEnlojaFpuG', // 로라밀
  'hEvFnQySTM3XtPCWShRd'  // 누베르
];

async function run() {
  console.log('Scanning Firebase Storage for En Paz original files...');
  const [files] = await bucket.getFiles({ prefix: 'socials/' });
  
  const folderImages = {};
  files.forEach(f => {
    const parts = f.name.split('/');
    if (parts.length > 2) {
      const id = parts[1];
      if (ids.includes(id) && !f.name.includes('en_paz_weekly_20260629')) {
        if (!folderImages[id]) folderImages[id] = [];
        folderImages[id].push(f.name);
      }
    }
  });

  console.log('=== Folder Images ===');
  console.log(JSON.stringify(folderImages, null, 2));

  console.log('\nScanning for legacy En Paz images...');
  const legacyImages = [];
  files.forEach(f => {
    const name = f.name.toLowerCase();
    if (name.includes('camelia') || name.includes('paz') || name.includes('vidamia') || name.includes('lora') || name.includes('nube') || name.includes('practica')) {
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
