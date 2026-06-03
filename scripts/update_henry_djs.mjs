import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function addDjToSocial(socialId, djId, date) {
  const ref = db.collection('socials').doc(socialId);
  const doc = await ref.get();
  if (!doc.exists) return;
  
  const data = doc.data();
  const currentDjs = data.djs || [];
  
  // Check if already exists
  if (currentDjs.find(dj => dj.djId === djId && dj.date === date)) {
    console.log(`[SKIP] DJ already added to ${socialId} on ${date}`);
    return;
  }
  
  currentDjs.push({
    id: `dj-${djId}-${Date.now()}`,
    djId: djId,
    date: date
  });
  
  await ref.update({ djs: currentDjs });
  console.log(`[SUCCESS] DJ added to ${socialId} on ${date}`);
}

async function run() {
  const henryUid1 = 'AhXh3EDA1JZByTayvoQph0jUOmc2'; // Henry (Google)
  const henryUid2 = 'QiB7SnysPuVjLisD6Z9vNvFn9W22'; // Henry (Phone)

  // 1. June 13 (Sat) - Onada (IYAJyxOpc63ATw5T2bDA)
  await addDjToSocial('IYAJyxOpc63ATw5T2bDA', henryUid1, '2026-06-13');
  await addDjToSocial('IYAJyxOpc63ATw5T2bDA', henryUid2, '2026-06-13');

  // 2. June 14 (Sun) - TangoLife (KgPDeh5g1N53cdz3pnw1)
  await addDjToSocial('KgPDeh5g1N53cdz3pnw1', henryUid1, '2026-06-14');
  await addDjToSocial('KgPDeh5g1N53cdz3pnw1', henryUid2, '2026-06-14');

  // 3. June 28 (Sun) - Azuca (MyiJArhCuCSwXoO0dXEi & PkXTV458wSvKzl00pyMa)
  await addDjToSocial('MyiJArhCuCSwXoO0dXEi', henryUid1, '2026-06-28');
  await addDjToSocial('MyiJArhCuCSwXoO0dXEi', henryUid2, '2026-06-28');
  await addDjToSocial('PkXTV458wSvKzl00pyMa', henryUid1, '2026-06-28');
  await addDjToSocial('PkXTV458wSvKzl00pyMa', henryUid2, '2026-06-28');
}

run().catch(console.error);
