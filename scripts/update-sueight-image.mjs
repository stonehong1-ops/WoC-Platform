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

async function updateSuEightImage() {
  console.log('Starting upload of Su Eight Milonga poster...');

  const localPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781518664184.jpg';
  const destPath = 'socials/PxeRaC6Ky260cdfPLFTh/poster.jpg';

  if (!fs.existsSync(localPath)) {
    throw new Error(`Su Eight Milonga local image not found at ${localPath}`);
  }

  console.log('Uploading Su Eight Milonga poster to storage...');
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  });

  const file = bucket.file(destPath);
  console.log('Making Su Eight Milonga poster public...');
  await file.makePublic();

  const suEightUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Su Eight Milonga uploaded poster URL:', suEightUrl);

  console.log('Updating Su Eight Milonga (PxeRaC6Ky260cdfPLFTh) imageUrl in Firestore...');
  const docRef = db.collection('socials').doc('PxeRaC6Ky260cdfPLFTh');
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error('Su Eight Milonga document not found in Firestore!');
  }
  await docRef.update({
    imageUrl: suEightUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Su Eight Milonga image updated successfully!');
}

updateSuEightImage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Update failed:', err);
    process.exit(1);
  });
