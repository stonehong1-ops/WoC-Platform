const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function queryFreestyleClasses() {
  try {
    const classesSnap = await db.collection('groups').doc('freestyle-tango').collection('classes').get();
    classesSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Title: ${data.title}, Amount: ${data.amount}, Type: ${data.classType}, Level: ${data.level}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

queryFreestyleClasses();
