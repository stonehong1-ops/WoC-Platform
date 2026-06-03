const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function dumpBrujoClasses() {
  try {
    const classesSnap = await db.collection('groups').doc('tango-brujo').collection('classes').get();
    console.log(JSON.stringify(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })), null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

dumpBrujoClasses();
