const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  // Try alternative location
  const altPath = 'C:\\Users\\stone\\WoC\\serviceAccountKey.json';
  if (fs.existsSync(altPath)) {
    fs.copyFileSync(altPath, serviceAccountPath);
  } else {
    console.error('Service account key not found');
    process.exit(1);
  }
}

const app = initializeApp({
  credential: cert(require(serviceAccountPath)),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const storage = getStorage(app);
const db = getFirestore(app);

async function uploadAndLink() {
  const imagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\28ad0f1c-02f4-49c8-bb55-664dd5d7b33d\\media__1780569058890.png';
  const bucket = storage.bucket();
  const destination = 'socials/S5tT98NNmiJpIiMZYKmV/poster.png';

  await bucket.upload(imagePath, {
    destination,
    metadata: { contentType: 'image/png' }
  });

  const file = bucket.file(destination);
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

  await db.collection('socials').doc('S5tT98NNmiJpIiMZYKmV').update({
    imageUrl: publicUrl,
    posterExportUrl: publicUrl,
    updatedAt: new Date()
  });

  console.log('Upload done:', publicUrl);
}

uploadAndLink().catch(console.error);
