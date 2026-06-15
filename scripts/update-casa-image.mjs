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

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function updateCasaImage() {
  console.log('Starting upload of Casa Milonga poster...');

  const localPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781518376229.jpg';
  const destPath = 'socials/bb1YNxoL4iXtfEdDtUbJ/poster.jpg';

  if (!fs.existsSync(localPath)) {
    throw new Error(`Casa Milonga local image not found at ${localPath}`);
  }

  console.log('Uploading Casa Milonga poster to storage...');
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  });

  const file = bucket.file(destPath);
  console.log('Making Casa Milonga poster public...');
  await file.makePublic();

  const casaUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Casa Milonga uploaded poster URL:', casaUrl);

  console.log('Updating Casa Milonga (bb1YNxoL4iXtfEdDtUbJ) imageUrl in Firestore...');
  const docRef = db.collection('socials').doc('bb1YNxoL4iXtfEdDtUbJ');
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error('Casa Milonga document not found in Firestore!');
  }
  await docRef.update({
    imageUrl: casaUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Casa Milonga image updated successfully!');
}

updateCasaImage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Update failed:', err);
    process.exit(1);
  });
