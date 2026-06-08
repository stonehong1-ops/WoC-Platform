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

async function scanVenuesAndGroups() {
  console.log("=== VENUES CATEGORIES & TYPES ===");
  const venuesRef = db.collection('venues');
  const venuesSnapshot = await venuesRef.get();
  const venuesMap = {};
  venuesSnapshot.forEach(doc => {
    const data = doc.data();
    venuesMap[doc.id] = data;
    console.log(`Venue: ${doc.id} | Name: ${data.nameKo} / ${data.nameEn} | Category: ${data.category} | Types: ${JSON.stringify(data.types)}`);
  });

  console.log("\n=== GROUPS LISTING ===");
  const groupsRef = db.collection('groups');
  const groupsSnapshot = await groupsRef.get();
  
  groupsSnapshot.forEach(doc => {
    const data = doc.data();
    const v = data.venueId ? venuesMap[data.venueId] : null;
    console.log(`Group: ${doc.id} | Name: ${data.name} | VenueId: ${data.venueId} | VenueCategory: ${v ? v.category : 'N/A'} | VenueTypes: ${v ? JSON.stringify(v.types) : 'N/A'}`);
  });
}

scanVenuesAndGroups().catch(console.error);
