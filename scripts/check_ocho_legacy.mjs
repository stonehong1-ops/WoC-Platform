import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function listTopLevelSocialFiles() {
  console.log('=== Listing Top-Level Files in socials/ ===');
  const [files] = await bucket.getFiles({ prefix: 'socials/' });
  
  files.forEach(f => {
    // Filter out files inside subdirectories (like socials/posters/ or socials/maMVsnmrc6lplGXCIr8D/)
    // i.e., files that contain only one '/' after 'socials/'
    const relativePath = f.name.substring('socials/'.length);
    if (!relativePath.includes('/')) {
      console.log(`  File: name=${f.name}, updated=${f.metadata.updated}, size=${f.metadata.size}`);
    }
  });
}

listTopLevelSocialFiles()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
