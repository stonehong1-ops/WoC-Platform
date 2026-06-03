import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function run() {
  console.log("=== Searching for User: Hernan ===");
  const usersSnap = await db.collection('users').get();
  
  usersSnap.forEach(doc => {
    const data = doc.data();
    const nickname = (data.nickname || '').toLowerCase();
    
    if (nickname.includes('hernan') || nickname.includes('에르난')) {
      console.log(`[User - Hernan] ID: ${doc.id} | Name: ${data.nickname} | Email: ${data.email} | Phone: ${data.phoneNumber}`);
    }
  });

  console.log("\n=== Searching for Target Socials ===");
  const socialsSnap = await db.collection('socials').get();
  socialsSnap.forEach(doc => {
    const data = doc.data();
    const title = (data.titleNative || data.title || '').toLowerCase();
    const venue = (data.venueNameNative || data.venueName || '').toLowerCase();
    
    // 1. Vidamia / Enpas
    if (title.includes('비다미아') || venue.includes('비다미아') || title.includes('엔빠스') || venue.includes('엔빠스')) {
      console.log(`[Match 1: Vidamia] ID: ${doc.id} | Title: ${data.titleNative || data.title} | Venue: ${data.venueNameNative || data.venueName} | dayOfWeek: ${data.dayOfWeek} | type: ${data.type}`);
    }
    // 2. Andante Cabeceo
    if ((title.includes('안단테') || venue.includes('안단테')) && (title.includes('까베세오') || title.includes('cabeceo'))) {
      console.log(`[Match 2: Cabeceo] ID: ${doc.id} | Title: ${data.titleNative || data.title} | Venue: ${data.venueNameNative || data.venueName} | dayOfWeek: ${data.dayOfWeek} | type: ${data.type}`);
    }
    // 3. Andante Julie
    if ((title.includes('안단테') || venue.includes('안단테')) && (title.includes('쥴리') || title.includes('julie'))) {
      console.log(`[Match 3: Julie] ID: ${doc.id} | Title: ${data.titleNative || data.title} | Venue: ${data.venueNameNative || data.venueName} | dayOfWeek: ${data.dayOfWeek} | type: ${data.type}`);
    }
    // 4. Pista Muse
    if ((title.includes('피스타') || venue.includes('pista')) && (title.includes('뮤즈') || title.includes('muse'))) {
      console.log(`[Match 4: Muse] ID: ${doc.id} | Title: ${data.titleNative || data.title} | Venue: ${data.venueNameNative || data.venueName} | dayOfWeek: ${data.dayOfWeek} | type: ${data.type}`);
    }
  });
}

run().catch(console.error);
