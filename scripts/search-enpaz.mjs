import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log('=== SEARCHING ENPAZ VENUE ===');
  const snap = await db.collection('venues').get();
  snap.forEach(doc => {
    const data = doc.data();
    const name = (data.name || '').toLowerCase();
    const nameKo = (data.nameKo || '').toLowerCase();
    const address = (data.address || '').toLowerCase();
    if (name.includes('paz') || name.includes('엔빠스') || nameKo.includes('엔빠스') || address.includes('반포대로')) {
      console.log(`- ID: ${doc.id} | Name: ${data.name} (${data.nameKo}) | Address: ${data.address}`);
    }
  });
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
