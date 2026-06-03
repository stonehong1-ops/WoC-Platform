import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function run() {
  console.log("=== Searching for Julie ===");
  const socialsSnap = await db.collection('socials').get();
  socialsSnap.forEach(doc => {
    const data = doc.data();
    const title = (data.titleNative || data.title || '').toLowerCase();
    const venue = (data.venueNameNative || data.venueName || '').toLowerCase();
    
    if (title.includes('쥴리') || title.includes('julie') || venue.includes('쥴리')) {
      console.log(`[Julie] ID: ${doc.id} | Title: ${data.titleNative || data.title} | Venue: ${data.venueNameNative || data.venueName} | dayOfWeek: ${data.dayOfWeek} | type: ${data.type}`);
    }
  });
}

run().catch(console.error);
