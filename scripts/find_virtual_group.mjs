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
  console.log("Searching for virtual or special groups in Firestore...");
  const snapshot = await db.collection('groups').get();
  let found = false;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const name = data.name || "";
    const native = data.nativeName || "";

    if (id.includes("spec") || id.includes("work") || id.includes("pop") || name.toLowerCase().includes("spec") || name.toLowerCase().includes("work") || name.toLowerCase().includes("pop")) {
      console.log(`- ID: ${id} | Name: ${name} (${native})`);
      found = true;
    }
  });

  if (!found) {
    console.log("No virtual group found.");
  }
}

run().catch(console.error);
