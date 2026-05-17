// One-time script: Set all socials price to "KRW 13,000"
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function main() {
  const snapshot = await db.collection('socials').get();
  console.log(`Found ${snapshot.size} social documents`);
  
  const batch = db.batch();
  let count = 0;
  snapshot.forEach((docSnap) => {
    batch.update(docSnap.ref, { price: 'KRW 13,000' });
    count++;
    console.log(`  - ${docSnap.id}: "${docSnap.data().title}" => KRW 13,000`);
  });

  await batch.commit();
  console.log(`\nDone! Updated ${count} documents.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
