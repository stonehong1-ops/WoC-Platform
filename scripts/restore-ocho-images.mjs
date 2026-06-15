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

async function restoreOchoImages() {
  console.log('Starting restoration of OCHO social images...');

  // 1. Upload Mucho Mil new poster image
  const muchoLocalPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\77584f7a-10ee-43e5-a1b6-5a48a55e20e7\\media__1781518116467.png';
  const muchoDestPath = 'socials/maMVsnmrc6lplGXCIr8D/poster.png';

  if (!fs.existsSync(muchoLocalPath)) {
    throw new Error(`Mucho Mil local image not found at ${muchoLocalPath}`);
  }

  console.log('Uploading Mucho Mil poster to storage...');
  await bucket.upload(muchoLocalPath, {
    destination: muchoDestPath,
    metadata: {
      contentType: 'image/png'
    }
  });

  const file = bucket.file(muchoDestPath);
  console.log('Making Mucho Mil poster public...');
  await file.makePublic();

  const muchoUrl = `https://storage.googleapis.com/${bucket.name}/${muchoDestPath}`;
  console.log('Mucho Mil uploaded poster URL:', muchoUrl);

  // 2. Perform DB Updates
  const updates = [
    {
      id: 'maMVsnmrc6lplGXCIr8D', // 무초밀
      name: '무초밀',
      imageUrl: muchoUrl
    },
    {
      id: 'FhUfMtTw6hyg3sdZq734', // 서울밀
      name: '서울밀',
      imageUrl: `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/socials/posters/poster_FhUfMtTw6hyg3sdZq734_1778764755826.jpg`
    },
    {
      id: 'vQ4SASAdywi4Nj74SsAm', // 클럽 그리셀
      name: '클럽 그리셀',
      imageUrl: `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/socials/posters/poster_vQ4SASAdywi4Nj74SsAm_1778799855423.jpg`
    },
    {
      id: 'C0xF4VaGDIRIyt8a2hta', // 일 루미
      name: '일 루미',
      imageUrl: `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/socials/posters/poster_C0xF4VaGDIRIyt8a2hta_1779089957765.jpg`
    }
  ];

  for (const item of updates) {
    console.log(`Updating ${item.name} (${item.id}) imageUrl in Firestore...`);
    const docRef = db.collection('socials').doc(item.id);
    const snap = await docRef.get();
    if (!snap.exists) {
      console.warn(`Warning: ${item.name} document not found!`);
      continue;
    }
    await docRef.update({
      imageUrl: item.imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Successfully restored imageUrl for ${item.name}`);
  }

  console.log('Restoration completed successfully!');
}

restoreOchoImages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Restoration failed:', err);
    process.exit(1);
  });
