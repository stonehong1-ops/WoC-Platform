import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  console.error("No service account file.");
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  console.log("Searching for Henry...");
  const usersSnap = await db.collection('users').get();
  let henryUid = null;
  let henryName = null;
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.nickname && data.nickname.toLowerCase().includes('henry')) {
      console.log(`Found user: ${data.nickname} (UID: ${doc.id})`);
      henryUid = doc.id;
      henryName = data.nickname;
    }
  });

  if (!henryUid) {
    console.log("Henry not found");
    process.exit(1);
  }

  console.log("\nSearching for socials...");
  const socialsSnap = await db.collection('socials').get();
  socialsSnap.forEach(doc => {
    const data = doc.data();
    const title = (data.titleNative || data.title || '').toLowerCase();
    const venue = (data.venueNameNative || data.venueName || '').toLowerCase();
    
    if (title.includes('오빠밀') || venue.includes('오나다')) {
      console.log(`[Onada] Match: ${doc.id} - ${data.titleNative} @ ${data.venueNameNative}`);
    }
    if (title.includes('탱고라이프') || venue.includes('탱고라이프')) {
      console.log(`[TangoLife] Match: ${doc.id} - ${data.titleNative} @ ${data.venueNameNative}`);
    }
    if (title.includes('아수까') || venue.includes('아수까') || title.includes('azuca')) {
      console.log(`[Azuca] Match: ${doc.id} - ${data.titleNative} @ ${data.venueNameNative}`);
    }
  });
}

run().catch(console.error);
