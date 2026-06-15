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

async function updateToypImage() {
  console.log('Starting upload of Toyp Milonga poster...');

  const localPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781518275748.jpg';
  const destPath = 'socials/RcwxqCMwdSX5oABMNJeH/poster.jpg';

  if (!fs.existsSync(localPath)) {
    throw new Error(`Toyp Milonga local image not found at ${localPath}`);
  }

  console.log('Uploading Toyp Milonga poster to storage...');
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  });

  const file = bucket.file(destPath);
  console.log('Making Toyp Milonga poster public...');
  await file.makePublic();

  const toypUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Toyp Milonga uploaded poster URL:', toypUrl);

  console.log('Updating Toyp Milonga (RcwxqCMwdSX5oABMNJeH) imageUrl in Firestore...');
  const docRef = db.collection('socials').doc('RcwxqCMwdSX5oABMNJeH');
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error('Toyp Milonga document not found in Firestore!');
  }
  await docRef.update({
    imageUrl: toypUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Toyp Milonga image updated successfully!');
}

updateToypImage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Update failed:', err);
    process.exit(1);
  });
