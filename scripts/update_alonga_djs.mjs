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
  const alexUid = 'Wob9lztPJBO5hDmL4qrGJVN8Rks2';
  
  const alongaPistaId = 'OSiG1oNwWhDrj3v7FBqf'; // Wednesday
  const alongaSundayId = 'nNxPVNAsmjvnZsyc73T8'; // Sunday

  // Alonga de Pista
  await addDjToSocial(alongaPistaId, alexUid, '2026-06-03');
  await addDjToSocial(alongaPistaId, alexUid, '2026-06-17');
  await addDjToSocial(alongaPistaId, alexUid, '2026-07-01');

  // Sunday Alonga (Alex all Sundays until end of July)
  const sundays = [
    '2026-06-07', '2026-06-14', '2026-06-21', '2026-06-28',
    '2026-07-05', '2026-07-12', '2026-07-19', '2026-07-26'
  ];
  for (const sun of sundays) {
    await addDjToSocial(alongaSundayId, alexUid, sun);
  }
}

run().catch(console.error);
