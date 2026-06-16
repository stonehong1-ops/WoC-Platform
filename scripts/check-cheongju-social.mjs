import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspectSocial() {
  const docRef = db.collection('socials').doc('DzZXsoAiCltg6gXnFEyF');
  const snap = await docRef.get();
  if (snap.exists) {
    console.log('Social Data:', JSON.stringify(snap.data(), null, 2));
  } else {
    console.log('Social DzZXsoAiCltg6gXnFEyF NOT FOUND!');
  }
}

inspectSocial()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
