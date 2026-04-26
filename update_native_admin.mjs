import admin from 'firebase-admin';

if (!admin.apps.length) {
  // Try to initialize with default credentials, which works if GOOGLE_APPLICATION_CREDENTIALS is set
  // or if we use the service account json
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (err) {
    console.error("Failed to initialize with default credentials", err);
    process.exit(1);
  }
}

const db = admin.firestore();

async function run() {
  console.log("Searching for freestyle tango...");
  const snapshot = await db.collection('groups').where('name', '==', 'freestyle tango').get();
  if (snapshot.empty) {
    console.log("No group found.");
    process.exit(1);
  }
  const group = snapshot.docs[0];
  console.log("Updating group:", group.id);
  await db.collection('groups').doc(group.id).update({ nativeName: '프리스타일' });
  console.log("Success! Updated nativeName to 프리스타일");
  process.exit(0);
}

run().catch(console.error);
