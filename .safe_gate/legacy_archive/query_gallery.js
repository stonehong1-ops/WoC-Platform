const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('galleries').limit(20).get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.tags && data.tags.some(t => t.id === 'freestyle-tango')) {
       console.log('FOUND:', doc.id, JSON.stringify(data, null, 2));
    }
  });
  console.log('Done');
}

run().catch(console.error);
