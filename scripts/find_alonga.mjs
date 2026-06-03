import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function run() {
  console.log("Searching for Users (Alex, mano, Bobby)...");
  const usersSnap = await db.collection('users').get();
  
  usersSnap.forEach(doc => {
    const data = doc.data();
    const nickname = (data.nickname || '').toLowerCase();
    
    if (nickname.includes('alex') || nickname.includes('알렉스')) {
      console.log(`[User - Alex] ID: ${doc.id} | Name: ${data.nickname} | Email: ${data.email} | Phone: ${data.phoneNumber}`);
    }
    if (nickname.includes('mano') || nickname.includes('마노')) {
      console.log(`[User - Mano] ID: ${doc.id} | Name: ${data.nickname} | Email: ${data.email} | Phone: ${data.phoneNumber}`);
    }
    if (nickname.includes('bobby') || nickname.includes('바비')) {
      console.log(`[User - Bobby] ID: ${doc.id} | Name: ${data.nickname} | Email: ${data.email} | Phone: ${data.phoneNumber}`);
    }
  });

  console.log("\nSearching for Socials (Alonga)...");
  const socialsSnap = await db.collection('socials').get();
  socialsSnap.forEach(doc => {
    const data = doc.data();
    const title = (data.titleNative || data.title || '').toLowerCase();
    const venue = (data.venueNameNative || data.venueName || '').toLowerCase();
    
    if (title.includes('alonga') || venue.includes('alonga') || title.includes('알롱가') || venue.includes('알롱가')) {
      console.log(`[Social - Alonga] ID: ${doc.id} | Title: ${data.titleNative || data.title} | Venue: ${data.venueNameNative || data.venueName} | type: ${data.type} | dayOfWeek: ${data.dayOfWeek}`);
    }
  });
}

run().catch(console.error);
