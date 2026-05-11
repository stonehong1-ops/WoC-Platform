import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const DEFAULT_FUNCTIONS = [
  'dashboard',
  'feed',
  'live',
  'calendar',
  'members',
  'notice',
  'about',
  'brand-setting',
  'roles-permissions'
];

async function initializeGroups() {
  console.log('Starting group initialization...');
  const groupsRef = db.collection('groups');
  const snapshot = await groupsRef.get();
  
  if (snapshot.empty) {
    console.log('No groups found.');
    return;
  }

  let count = 0;
  const batchSize = 10;
  let batch = db.batch();

  for (const doc of snapshot.docs) {
    const groupData = doc.data();
    
    // Reset selectedFunctions and menuOrder to DEFAULT_FUNCTIONS
    batch.update(doc.ref, {
      selectedFunctions: DEFAULT_FUNCTIONS,
      menuOrder: DEFAULT_FUNCTIONS,
      updatedAt: new Date()
    });
    
    count++;
    
    if (count % batchSize === 0) {
      await batch.commit();
      console.log(`Updated ${count} groups...`);
      batch = db.batch();
    }
  }

  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`Successfully initialized all ${count} groups with default OS functions.`);
}

initializeGroups().catch(err => {
  console.error('Error initializing groups:', err);
  process.exit(1);
});
