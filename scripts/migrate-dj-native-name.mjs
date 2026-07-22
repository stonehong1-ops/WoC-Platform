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
  console.log('=== STARTING DJ NATIVE NAME MIGRATION ===');
  const snap = await db.collection('socials').get();
  console.log(`Found ${snap.size} socials to scan.`);

  let updatedCount = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.djs && Array.isArray(data.djs)) {
      let changed = false;
      const newDjs = data.djs.map(dj => {
        const updatedDj = { ...dj };
        // djNameNative -> djNativeName
        if (dj.djNameNative && !dj.djNativeName) {
          updatedDj.djNativeName = dj.djNameNative;
          changed = true;
        }
        // djNativeName -> djNameNative (하위 호환)
        if (dj.djNativeName && !dj.djNameNative) {
          updatedDj.djNameNative = dj.djNativeName;
          changed = true;
        }
        return updatedDj;
      });

      if (changed) {
        console.log(`Updating document [${doc.id}] (Title: ${data.title})...`);
        await doc.ref.update({
          djs: newDjs,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
      }
    }
  }

  console.log(`=== MIGRATION COMPLETED: Updated ${updatedCount} socials ===`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
