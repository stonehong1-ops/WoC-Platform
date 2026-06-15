import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const validCodes = ['+82 (KR)', '+1 (US)', '+44 (UK)', '+49 (DE)'];

const isoToStandard = {
  'KR': '+82 (KR)',
  'US': '+1 (US)',
  'UK': '+44 (UK)',
  'GB': '+44 (UK)',
  'DE': '+49 (DE)'
};

async function runMigration() {
  console.log('--- Starting Admin User Country Code Migration ---');
  const usersRef = db.collection('users');
  const userSnap = await usersRef.get();
  
  let total = 0;
  let updatedCount = 0;
  
  for (const doc of userSnap.docs) {
    total++;
    const data = doc.data();
    const currentCode = data.countryCode;
    const phone = data.phoneNumber || '';
    
    let targetCode = null;
    
    if (currentCode && validCodes.includes(currentCode)) {
      continue;
    }
    
    if (!currentCode || currentCode === '') {
      if (phone.startsWith('+82') || phone.startsWith('010') || phone.startsWith('10')) {
        targetCode = '+82 (KR)';
      } else if (phone.startsWith('+1')) {
        targetCode = '+1 (US)';
      } else if (phone.startsWith('+44')) {
        targetCode = '+44 (UK)';
      } else if (phone.startsWith('+49')) {
        targetCode = '+49 (DE)';
      } else {
        targetCode = '+82 (KR)';
      }
    } else {
      const upper = currentCode.trim().toUpperCase();
      if (isoToStandard[upper]) {
        targetCode = isoToStandard[upper];
      } else {
        targetCode = '+82 (KR)';
      }
    }
    
    if (targetCode && targetCode !== currentCode) {
      console.log(`Updating User [${data.nickname || doc.id}]: "${currentCode || 'EMPTY'}" -> "${targetCode}" (Phone: ${phone})`);
      await doc.ref.update({
        countryCode: targetCode,
        updatedAt: new Date()
      });
      updatedCount++;
    }
  }
  
  console.log(`Migration Completed. Total Users: ${total}, Updated Users: ${updatedCount}`);
}

runMigration().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
