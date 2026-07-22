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
  console.log("Searching for users with name 'Elly' or 'Jiwoon'...");
  const snapshot = await db.collection('users').get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.displayName || data.name || "";
    
    if (name.toLowerCase().includes("elly") || name.toLowerCase().includes("jiwoon") || name.toLowerCase().includes("지운") || name.toLowerCase().includes("엘리")) {
      console.log(`- UID: ${doc.id}`);
      console.log(`  Name: ${name}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  PhotoURL: ${data.photoURL || data.avatar}`);
      console.log(`  ---`);
    }
  });
}

run().catch(console.error);
