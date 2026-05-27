const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
async function check() {
  const db = admin.firestore();
  const docs = await db.collection('socials').get();
  docs.forEach(d => console.log(d.id, d.data().title, d.data().titleEn, d.data().titleNative));
}
check();
