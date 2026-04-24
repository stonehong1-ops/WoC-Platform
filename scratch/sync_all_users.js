const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// If you're running this on a machine with Firebase CLI logged in, 
// you might need to provide the project ID.
admin.initializeApp({
  projectId: 'woc-platform-seoul-1234'
});

const db = admin.firestore();

async function syncUsers() {
  const csvPath = path.join(__dirname, '..', 'all_users_nickname_update.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const dataLines = lines.slice(1);

  console.log(`Processing ${dataLines.length} users...`);

  const batch = db.batch();
  let count = 0;

  for (const line of dataLines) {
    // Handle quotes in CSV
    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!parts || parts.length < 3) continue;
    
    const id = parts[0].replace(/"/g, '').trim();
    const native = parts[1].replace(/"/g, '').trim();
    const english = parts[2].replace(/"/g, '').trim();

    // 1. Update users collection
    const userRef = db.collection('users').doc(id);
    batch.set(userRef, {
      nickname: english,
      nativeNickname: native,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Update group members subcollection
    const memberRef = db.collection('groups').doc('freestyle-tango').collection('members').doc(id);
    batch.set(memberRef, {
      nickname: english,
      nativeNickname: native,
      role: 'member',
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    count++;
    
    // Firestore batch limit is 500 operations. We have 84 * 2 = 168.
  }

  await batch.commit();
  console.log(`Successfully synced ${count} users and group members.`);

  // Delete phantom data
  const phantoms = ['user_1', 'user_2', 'user_3'];
  const deleteBatch = db.batch();
  for (const pid of phantoms) {
    deleteBatch.delete(db.collection('users').doc(pid));
    deleteBatch.delete(db.collection('groups').doc('freestyle-tango').collection('members').doc(pid));
  }
  await deleteBatch.commit();
  console.log('Deleted phantom users.');
}

syncUsers().catch(err => {
  console.error('Error syncing users:', err);
  process.exit(1);
});
