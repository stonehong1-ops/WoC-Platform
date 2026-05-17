const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(process.cwd(), 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function syncGroups() {
  const groupsRef = db.collection('groups');
  const snapshot = await groupsRef.get();
  
  if (snapshot.empty) {
    console.log('No groups found.');
    return;
  }

  let count = 0;
  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const groupData = doc.data();
    
    if (groupData.venueId) {
      const venueDoc = await db.collection('venues').doc(groupData.venueId).get();
      if (venueDoc.exists) {
        const venueData = venueDoc.data();
        if (venueData.nameKo) {
          batch.update(doc.ref, { nativeName: venueData.nameKo });
          count++;
          console.log(`Updating group ${doc.id} nativeName to: ${venueData.nameKo}`);
        } else {
          console.log(`Venue ${groupData.venueId} for group ${doc.id} does not have nameKo`);
        }
      } else {
        console.log(`Venue ${groupData.venueId} not found for group ${doc.id}`);
      }
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully updated ${count} groups.`);
  } else {
    console.log('No groups needed updating.');
  }
}

syncGroups().then(() => process.exit(0)).catch(console.error);
