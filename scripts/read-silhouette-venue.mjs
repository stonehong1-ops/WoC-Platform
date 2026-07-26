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
  const doc = await db.collection('venues').doc('3XagPuu2bmBorzqMPNk3').get();
  console.log(JSON.stringify(doc.data(), null, 2));
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
