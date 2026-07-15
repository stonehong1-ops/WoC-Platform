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

const socialId = "sMIEoUSmSRS9UwlxWzvp";
const localImagePath = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783461459670.jpg";
const destPath = `socials/${socialId}/poster_20260706.jpg`;

async function run() {
  console.log(`Uploading local image ${localImagePath} to Storage...`);

  // 1. Storage 업로드
  const fileRef = bucket.file(destPath);
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  });

  // 2. Public 권한 부여
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/${destPath}`;
  console.log(`Uploaded successfully. Public URL: ${url}`);

  // 3. Firestore 문서 업데이트
  console.log(`Updating Firestore social document: socials/${socialId}...`);
  const docRef = db.collection('socials').doc(socialId);
  await docRef.update({
    imageUrl: url,
    posterExportUrl: url,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log("Firestore update complete.");
}

run().catch(console.error);
