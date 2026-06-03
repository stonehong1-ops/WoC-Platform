import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function run() {
  const henryUids = ['AhXh3EDA1JZByTayvoQph0jUOmc2', 'QiB7SnysPuVjLisD6Z9vNvFn9W22'];
  for (const uid of henryUids) {
    const doc = await db.collection('users').doc(uid).get();
    console.log(uid, doc.data().email, doc.data().nickname, doc.data().authMethod);
  }
}

run().catch(console.error);
