import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log("Searching for groups and venues containing 'Brujo' or '브루호'...");
  
  const groupSnap = await db.collection('groups').get();
  groupSnap.forEach(doc => {
    const data = doc.data();
    const name = data.name || "";
    const nameNative = data.nameNative || "";
    if (name.toLowerCase().includes("brujo") || nameNative.includes("브루호")) {
      console.log(`Group Found - ID: ${doc.id}, Name: ${name} (${nameNative})`);
    }
  });

  const venueSnap = await db.collection('venues').get();
  venueSnap.forEach(doc => {
    const data = doc.data();
    const name = data.name || "";
    const nameNative = data.nameNative || "";
    if (name.toLowerCase().includes("brujo") || nameNative.includes("브루호")) {
      console.log(`Venue Found - ID: ${doc.id}, Name: ${name} (${nameNative}), Address: ${data.address}`);
    }
  });
}

run().catch(console.error);
