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
  console.log("Searching for socials related to 'Dia' or '디디디'...");
  const snapshot = await db.collection('socials').get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const title = data.title || "";
    const titleNative = data.titleNative || "";
    const desc = data.description || "";
    const venueName = data.venueName || "";

    if (title.includes("Dia") || titleNative.includes("디아") || titleNative.includes("디디디") || desc.includes("디디디") || desc.includes("디아") || venueName.includes("Dia")) {
      console.log(`- ID: ${doc.id}`);
      console.log(`  Title: ${title} / ${titleNative}`);
      console.log(`  Venue: ${venueName}`);
      console.log(`  DayOfWeek: ${data.dayOfWeek}`);
      console.log(`  ImageUrl: ${data.imageUrl}`);
      console.log(`  ---`);
    }
  });
}

run().catch(console.error);
