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
  console.log("Searching for venues containing 'Hongturn' or '홍턴'...");
  const snapshot = await db.collection('venues').get();
  let found = false;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.name || "";
    const native = data.nameNative || "";
    
    if (name.toLowerCase().includes("hongturn") || native.includes("홍턴")) {
      console.log(`- ID: ${doc.id}`);
      console.log(`  Name: ${name} (${native})`);
      console.log(`  Address: ${data.address}`);
      console.log(`  ---`);
      found = true;
    }
  });

  if (!found) {
    console.log("No matching venues found.");
  }
}

run().catch(console.error);
