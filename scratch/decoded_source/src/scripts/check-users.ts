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

async function main() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.limit(5).get();
  
  snapshot.forEach(doc => {
    console.log(`User ${doc.id}:`, doc.data());
  });
  process.exit(0);
}
main();
