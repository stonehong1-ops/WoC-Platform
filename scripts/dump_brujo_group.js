const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function dumpBrujoGroup() {
  try {
    const doc = await db.collection('groups').doc('tango-brujo').get();
    if (doc.exists) {
      console.log(JSON.stringify(doc.data(), null, 2));
    } else {
      console.log('No such group document.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

dumpBrujoGroup();
