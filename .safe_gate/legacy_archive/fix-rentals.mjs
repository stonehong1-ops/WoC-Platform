import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./woc-platform-firebase-adminsdk-hsnar-c1d09e530b.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixData() {
  // 1. Remove ' Rental' from titles in rental_spaces
  const spacesSnap = await db.collection('rental_spaces').get();
  for (const doc of spacesSnap.docs) {
    const data = doc.data();
    if (data.title && data.title.endsWith(' Rental')) {
      const newTitle = data.title.slice(0, -7);
      await db.collection('rental_spaces').doc(doc.id).update({ title: newTitle });
      console.log(`Updated space ${doc.id}: ${data.title} -> ${newTitle}`);
    }
  }

  // 2. Set activeServices.rental = false for specific groups
  // We want only freestyle-tango (and maybe tango-pista if the user wants it?)
  // Actually, the user specifically mentioned Vivian Shoes: "Vivian Shoes는 studio로 세팅 안되어 있으니"
  // Let's find groups that shouldn't be in rental.
  const groupsToDisable = ['vivian-shoes', 'sharon-shoes', 'odile-shoes', 't-balance-shoes'];
  for (const groupId of groupsToDisable) {
    await db.collection('groups').doc(groupId).update({
      'activeServices.rental': false
    });
    console.log(`Disabled rental service for group: ${groupId}`);
  }

  console.log('Done!');
  process.exit(0);
}

fixData().catch(console.error);
