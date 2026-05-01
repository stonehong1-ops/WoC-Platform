import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function update() {
  const docRef = db.collection('groups').doc('rglqeyjDHzzhbUwuim5O');
  
  await docRef.update({
    'activeServices.rental': true,
    'activeServices.shop': false,
    'activeServices.stay': false,
    'activeServices.class': false
  });
  console.log('Successfully updated activeServices for freestyle tango group');
}

update().catch(console.error);
