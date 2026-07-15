import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json'), 'utf8')
);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const snap = await db.collection('groups').get();
  console.log(`Total groups: ${snap.size}`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Name: ${data.name} | Native: ${data.nativeName}`);
  });
}

run().catch(console.error);
