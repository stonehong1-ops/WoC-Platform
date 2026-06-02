import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccountPath = 'c:/Users/stone/WoC/woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateSlugs() {
  console.log('Starting group slug migration...');
  const groupsRef = db.collection('groups');
  const snapshot = await groupsRef.get();
  
  if (snapshot.empty) {
    console.log('No groups found.');
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const docId = doc.id;
    
    // Check if slug is empty, null, undefined, or missing
    if (!data.hasOwnProperty('slug') || data.slug === '' || data.slug === null || data.slug === undefined) {
      console.log(`Updating group [${docId}] - setting slug to "${docId}"`);
      await groupsRef.doc(docId).update({
        slug: docId
      });
      updatedCount++;
    } else {
      console.log(`Skipping group [${docId}] - slug already set to "${data.slug}"`);
      skippedCount++;
    }
  }

  console.log('Migration completed successfully.');
  console.log(`Total groups: ${snapshot.size}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
}

migrateSlugs().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
