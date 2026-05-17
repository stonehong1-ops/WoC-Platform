const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugData() {
  const groups = await db.collection('groups').get();
  const venues = await db.collection('venues').get();
  
  const venueMap = {};
  venues.forEach(doc => {
    venueMap[doc.id] = doc.data().nameKo;
  });

  console.log('--- Sample Groups ---');
  groups.docs.slice(0, 10).forEach(doc => {
    const data = doc.data();
    console.log(`Group: ${data.name}, venueId: ${data.venueId}, nativeName: ${data.nativeName}, MapNameKo: ${venueMap[data.venueId]}`);
  });
}

debugData().catch(console.error);
