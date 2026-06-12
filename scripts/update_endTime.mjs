import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Load service account key
const serviceAccount = JSON.parse(fs.readFileSync('woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'woc-platform-seoul-1234'
  });
}
const db = admin.firestore();

async function main() {
  console.log("Starting socials endTime update using admin SDK...");
  
  // 1. In the Mood for Tango
  const inmutangRef = db.collection('socials').doc('oOQT7PhjvQIetwdT9kKc');
  await inmutangRef.update({ endTime: '24:00' });
  console.log("Updated In the Mood for Tango (oOQT7PhjvQIetwdT9kKc) endTime to 24:00");
  
  // 2. Mil Mil
  const milmilRef = db.collection('socials').doc('oVKEV4hnjSuuQlEsGy1q');
  await milmilRef.update({ endTime: '24:00' });
  console.log("Updated Mil Mil (oVKEV4hnjSuuQlEsGy1q) endTime to 24:00");
  
  console.log("Updates completed successfully!");
}

main().catch(console.error);
