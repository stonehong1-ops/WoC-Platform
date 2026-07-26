import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('c:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log('=== READING VENUES ===');
  const v1 = await db.collection('venues').doc('pista').get();
  const v2 = await db.collection('venues').doc('xVJsZb5y34WjlqP5iHDr').get();

  if (v1.exists) {
    console.log('\nVenue [pista]:');
    console.log(JSON.stringify(v1.data(), null, 2));
  } else {
    console.log('\nVenue [pista] does NOT exist.');
  }

  if (v2.exists) {
    console.log('\nVenue [xVJsZb5y34WjlqP5iHDr]:');
    console.log(JSON.stringify(v2.data(), null, 2));
  } else {
    console.log('\nVenue [xVJsZb5y34WjlqP5iHDr] does NOT exist.');
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
