import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function addDjNameToDjs(socialId, djId, djName) {
  const ref = db.collection('socials').doc(socialId);
  const doc = await ref.get();
  if (!doc.exists) return;
  
  const data = doc.data();
  const currentDjs = data.djs || [];
  let updated = false;
  
  for (const dj of currentDjs) {
    if (dj.djId === djId && !dj.djName) {
      dj.djName = djName;
      updated = true;
    }
  }
  
  if (updated) {
    await ref.update({ djs: currentDjs });
    console.log(`[FIXED] Added djName '${djName}' to ${socialId}`);
  }
}

async function run() {
  const hernanUid = 'hXS66xsXQpUvCrtzj0JNvVnrR0A3';
  await addDjNameToDjs('R1hayB6of65wiDA27Q0U', hernanUid, 'Hernan');
  await addDjNameToDjs('QeCGlfbf6oJrlEUoswjL', hernanUid, 'Hernan');
  await addDjNameToDjs('qUguzNB65CSBYj8dIC4W', hernanUid, 'Hernan');
  await addDjNameToDjs('v0zd2tN2sQpDRW0lSwAi', hernanUid, 'Hernan');

  const alexUid = 'Wob9lztPJBO5hDmL4qrGJVN8Rks2';
  await addDjNameToDjs('OSiG1oNwWhDrj3v7FBqf', alexUid, 'Alex');
  await addDjNameToDjs('nNxPVNAsmjvnZsyc73T8', alexUid, 'Alex');
  
  // Also fix Henry
  const henryUid1 = 'AhXh3EDA1JZByTayvoQph0jUOmc2';
  const henryUid2 = 'QiB7SnysPuVjLisD6Z9vNvFn9W22';
  const henrySocials = ['IYAJyxOpc63ATw5T2bDA', 'KgPDeh5g1N53cdz3pnw1', 'MyiJArhCuCSwXoO0dXEi', 'PkXTV458wSvKzl00pyMa'];
  for (const s of henrySocials) {
    await addDjNameToDjs(s, henryUid1, 'Henry');
    await addDjNameToDjs(s, henryUid2, 'Henry');
  }
}

run().catch(console.error);
