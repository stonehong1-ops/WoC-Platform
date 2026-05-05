const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function main() {
  const snapshot = await db.collection('socials').get();
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.venueName && (data.venueName.includes('찐탱고') || data.venueName.includes('타임월드'))) {
      console.log(`Updating Social Event: "${data.title}" (${doc.id})`);
      console.log(`  - Venue: ${data.venueName}`);
      console.log(`  - Current City: ${data.city} -> DAEJEON`);
      
      batch.update(doc.ref, { city: 'DAEJEON' });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`\nUpdated ${count} social events.`);
  } else {
    console.log('No social events found matching those venue names.');
  }
  
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
