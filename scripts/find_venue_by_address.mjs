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
  console.log("Searching for venues containing '199-1' or '동교동' in address...");
  const snapshot = await db.collection('venues').get();
  let found = false;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const address = data.address || "";
    
    if (address.includes("199-1") || address.includes("동교동")) {
      console.log(`- ID: ${doc.id}`);
      console.log(`  Name: ${data.name} (${data.nameNative})`);
      console.log(`  Address: ${address}`);
      console.log(`  ---`);
      found = true;
    }
  });

  if (!found) {
    console.log("No matching venues found by address.");
  }
}

run().catch(console.error);
