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
  console.log("Searching for socials related to 'Suncheon' or 'Estrellas'...");
  const snapshot = await db.collection('socials').get();
  let found = false;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const title = data.title || "";
    const titleNative = data.titleNative || "";
    const desc = data.description || "";
    const venueName = data.venueName || "";

    if (title.toLowerCase().includes("suncheon") || title.toLowerCase().includes("estrella") || titleNative.includes("순천") || titleNative.includes("에뜨") || desc.includes("에뜨") || desc.includes("Estrellas")) {
      console.log(`- ID: ${doc.id}`);
      console.log(`  Title: ${title} / ${titleNative}`);
      console.log(`  Venue: ${venueName}`);
      console.log(`  Date: ${data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : "N/A"}`);
      console.log(`  ---`);
      found = true;
    }
  });

  if (!found) {
    console.log("No matching socials found.");
  }
}

run().catch(console.error);
