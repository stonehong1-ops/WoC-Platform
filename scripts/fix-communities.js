const admin = require('firebase-admin');

// Initialize with application default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();

const MAIN_OWNER_UID = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2'; // Stone Hong
const SYSTEM_ID = 'system1';

async function fix() {
  console.log('Fetching communities...');
  const snapshot = await db.collection('communities').get();
  const communities = snapshot.docs;
  
  console.log(`Found ${communities.length} communities. Starting fix...`);

  const batch = db.batch();
  let count = 0;

  for (const doc of communities) {
    const data = doc.data();
    const isMain = doc.id === 'freestyle-tango';
    
    const updates = {};
    
    // 1. ownerId logic
    const targetOwner = isMain ? MAIN_OWNER_UID : SYSTEM_ID;
    if (data.ownerId !== targetOwner) {
      updates.ownerId = targetOwner;
    }

    // 2. memberCount logic
    const actualMemberCount = Array.isArray(data.members) ? data.members.length : 0;
    if (data.memberCount !== actualMemberCount) {
      updates.memberCount = actualMemberCount;
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
      console.log(`[QUEUED] Fix for ${doc.id}: ${JSON.stringify(updates)}`);
    }

    // Commit every 400 docs (Firestore limit is 500)
    if (count > 0 && count % 400 === 0) {
      await batch.commit();
      console.log('Batch committed.');
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
    console.log('Final batch committed.');
  }

  console.log(`Fixed ${count} communities successfully.`);
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
