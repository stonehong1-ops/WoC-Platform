import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error('Service Account file not found!');
  process.exit(1);
}

const db = admin.firestore();

async function checkStickers() {
  console.log('Querying chat_messages for stickers...');
  const snap = await db.collection('chat_messages')
    .where('type', '==', 'sticker')
    .limit(15)
    .get();

  console.log(`Found ${snap.size} sticker messages:`);
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`[MSG ID: ${doc.id}]`);
    console.log(`- text: "${data.text}"`);
    console.log(`- mediaUrl: "${data.mediaUrl}"`);
    console.log('-----------------------------');
  });

  process.exit(0);
}

checkStickers().catch(err => {
  console.error(err);
  process.exit(1);
});
