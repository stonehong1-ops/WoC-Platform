import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.resolve(process.cwd(), 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrateRoles() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  if (snapshot.empty) {
    console.log('No users found.');
    return;
  }

  let count = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    // Fix: Gender string might be 'Male' or 'male'
    const isMale = data.gender && data.gender.toLowerCase() === 'male';
    const correctRole = isMale ? 'leader' : 'follower';
    
    // Always overwrite if wrong
    if (data.role !== correctRole) {
      batch.update(doc.ref, { role: correctRole });
      count++;
      console.log(`Fixing user ${doc.id} (${data.displayName || data.email || data.nickname || 'Unknown'}) to role: ${correctRole}`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully updated ${count} users.`);
  } else {
    console.log('No users needed updating.');
  }
}

async function main() {
  try {
    console.log('--- Migrating User Dance Roles ---');
    await migrateRoles();
    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error migrating users:', err);
    process.exit(1);
  }
}

main();
