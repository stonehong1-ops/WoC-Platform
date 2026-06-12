import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  admin.initializeApp({
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();

async function run() {
  console.log("Searching for Pista group in 'groups' collection...");
  const snap = await db.collection('groups').get();
  console.log(`Total groups fetched: ${snap.docs.length}`);

  snap.docs.forEach(doc => {
    const data = doc.data();
    const name = (data.name || "").toLowerCase();
    const nativeName = (data.nativeName || "").toLowerCase();
    
    if (name.includes("pista") || nativeName.includes("피스타")) {
      console.log('----------------------------------------');
      console.log(`Matched Group ID: ${doc.id}`);
      console.log(`Name: ${data.name} (Native: ${data.nativeName})`);
      console.log(`Representative: ${JSON.stringify(data.representative || {})}`);
      console.log(`Address: ${data.address}, Detailed: ${data.detailedAddress}`);
      console.log(`SocialLinks: ${JSON.stringify(data.socialLinks || {})}`);
      console.log(`Full Document Data:`, JSON.stringify(data, null, 2));
    }
  });
}

run().catch(console.error);
