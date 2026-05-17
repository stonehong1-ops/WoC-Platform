import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.resolve(process.cwd(), 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const targetNames = [
  "Andante",
  "Bonita",
  "Ocho",
  "Onada 2",
  "Onada",
  "Tango Pista",
  "Evenia",
  "Soltang Studio",
  "Fiesta",
  "La Loca",
  "Tango House Stay",
  "Tango Stay",
  "Tango House",
  "Tango Stay Canaro",
  "Maravilla J",
  "Tango Shoes Korea"
];

async function updateGroupClassSetting(names: string[]) {
  for (const name of names) {
    console.log(`Updating ${name} class setting to Off...`);
    const querySnapshot = await db.collection('groups').where('name', '==', name).get();
    
    if (querySnapshot.empty) {
      console.log(`  -> Not found in groups: ${name}.`);
    } else {
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const activeServices = data.activeServices || {};
        activeServices.class = false;
        
        await doc.ref.update({
          activeServices: activeServices
        });
        console.log(`  -> Updated group ${doc.id} successfully.`);
      }
    }
  }
}

async function main() {
  try {
    console.log('--- Turning off class setting for groups ---');
    await updateGroupClassSetting(targetNames);
    
    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating groups:', err);
    process.exit(1);
  }
}

main();
