const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncGroupNames() {
  console.log('Starting sync...');
  
  // 1. Get all venues to build a map
  const venuesSnapshot = await db.collection('venues').get();
  const venueMap = new Map();
  venuesSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.nameKo) {
      venueMap.set(doc.id, data.nameKo);
    }
  });
  console.log(`Loaded ${venueMap.size} venues with Korean names.`);

  // 2. Get all groups
  const groupsSnapshot = await db.collection('groups').get();
  console.log(`Processing ${groupsSnapshot.size} groups...`);

  let updatedCount = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of groupsSnapshot.docs) {
    const groupData = doc.data();
    const venueId = groupData.venueId;

    if (venueId && venueMap.has(venueId)) {
      const nativeName = venueMap.get(venueId);
      
      // Update if nativeName is missing or different
      if (groupData.nativeName !== nativeName) {
        batch.update(doc.ref, { 
          nativeName: nativeName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
        batchCount++;
        
        console.log(`[Update] Group: ${groupData.name} -> nativeName: ${nativeName}`);
      }
    }

    // Commit batch every 400 docs (Firestore limit is 500)
    if (batchCount >= 400) {
      await batch.commit();
      console.log('Committed batch of 400 updates.');
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log('Committed final batch.');
  }

  console.log(`Sync complete. Total groups updated: ${updatedCount}`);
}

syncGroupNames().catch(err => {
  console.error('Error during sync:', err);
  process.exit(1);
});
