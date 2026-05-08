import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

const serviceAccount = require(path.resolve('./service-account.json'));

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
