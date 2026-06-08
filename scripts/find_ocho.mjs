import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountPath = 'c:/Users/stone/WoC/woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findOcho() {
  console.log("=== VENUES SEARCH ===");
  const venuesRef = db.collection('venues');
  const venuesSnapshot = await venuesRef.get();
  
  venuesSnapshot.forEach(doc => {
    const data = doc.data();
    if (doc.id === '6Z5SuLBNSGZezwBgJ5r0' || (data.nameKo && data.nameKo.includes("오초")) || (data.nameEn && data.nameEn.toLowerCase().includes("ocho"))) {
      console.log(`Venue ID: ${doc.id}`);
      console.log(`  nameKo: ${data.nameKo}`);
      console.log(`  nameEn: ${data.nameEn}`);
      console.log(`  category: ${data.category}`);
      console.log(`  types: ${JSON.stringify(data.types)}`);
      console.log(`  city: ${data.city}`);
      console.log(`  address: ${data.address}`);
      console.log("-----------------------------------------");
    }
  });

  console.log("\n=== GROUPS SEARCH ===");
  const groupsRef = db.collection('groups');
  const groupsSnapshot = await groupsRef.get();
  
  groupsSnapshot.forEach(doc => {
    const data = doc.data();
    if ((data.name && data.name.includes("오초")) || (data.name && data.name.toLowerCase().includes("ocho")) || (data.venueId === '6Z5SuLBNSGZezwBgJ5r0')) {
      console.log(`Group ID: ${doc.id}`);
      console.log(`  name: ${data.name}`);
      console.log(`  venueId: ${data.venueId}`);
      console.log(`  ownerId: ${data.ownerId}`);
      console.log("-----------------------------------------");
    }
  });
}

findOcho().catch(console.error);
