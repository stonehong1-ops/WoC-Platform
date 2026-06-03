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
  
  if (currentDjs.find(dj => dj.djId === djId && dj.date === date)) {
    console.log(`[SKIP] DJ already added to ${socialId} on ${date}`);
    return;
  }
  
  currentDjs.push({
    id: `dj-${djId}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    djId: djId,
    date: date
  });
  
  await ref.update({ djs: currentDjs });
  console.log(`[SUCCESS] DJ added to ${socialId} on ${date}`);
}

async function run() {
  const hernanUid = 'hXS66xsXQpUvCrtzj0JNvVnrR0A3';

  // 1. June 5 (Fri) - Vidamia (R1hayB6of65wiDA27Q0U)
  await addDjToSocial('R1hayB6of65wiDA27Q0U', hernanUid, '2026-06-05');

  // 2. June 13 (Sat) - Andante Cabeceo (QeCGlfbf6oJrlEUoswjL & qUguzNB65CSBYj8dIC4W)
  await addDjToSocial('QeCGlfbf6oJrlEUoswjL', hernanUid, '2026-06-13');
  await addDjToSocial('qUguzNB65CSBYj8dIC4W', hernanUid, '2026-06-13');

  // 3. June 26 (Fri) - Pista Muse Mil (v0zd2tN2sQpDRW0lSwAi)
  await addDjToSocial('v0zd2tN2sQpDRW0lSwAi', hernanUid, '2026-06-26');
}

run().catch(console.error);
