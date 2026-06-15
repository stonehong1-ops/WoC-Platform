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

async function updateSeoulImage() {
  console.log('Starting upload of Seoul Milonga poster...');

  const localPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781518765093.jpg';
  const destPath = 'socials/FhUfMtTw6hyg3sdZq734/poster.jpg';

  if (!fs.existsSync(localPath)) {
    throw new Error(`Seoul Milonga local image not found at ${localPath}`);
  }

  console.log('Uploading Seoul Milonga poster to storage...');
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  });

  const file = bucket.file(destPath);
  console.log('Making Seoul Milonga poster public...');
  await file.makePublic();

  const seoulUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log('Seoul Milonga uploaded poster URL:', seoulUrl);

  console.log('Updating Seoul Milonga (FhUfMtTw6hyg3sdZq734) imageUrl in Firestore...');
  const docRef = db.collection('socials').doc('FhUfMtTw6hyg3sdZq734');
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error('Seoul Milonga document not found in Firestore!');
  }
  await docRef.update({
    imageUrl: seoulUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Seoul Milonga image updated successfully!');
}

updateSeoulImage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Update failed:', err);
    process.exit(1);
  });
