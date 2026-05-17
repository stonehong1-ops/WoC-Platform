const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

let serviceAccount;
try {
  serviceAccount = require(path.resolve('./serviceAccountKey.json'));
} catch (e) {
  try {
    serviceAccount = require(path.resolve('./service-account.json'));
  } catch(e2) {
    console.error('Could not find service account key');
    process.exit(1);
  }
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkPosts() {
  const snapshot = await db.collection('plaza').orderBy('likes', 'desc').limit(5).get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data().likes, doc.data().userName, doc.data().content);
  });
}

checkPosts().catch(console.error);
