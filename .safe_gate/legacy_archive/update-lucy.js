const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateLucy() {
  const snapshot = await db.collection('socials').where('title', '==', 'LUCY').get();
  if (snapshot.empty) {
    console.log('No matching documents found for LUCY.');
    
    // Also try matching native title just in case
    const snapshot2 = await db.collection('socials').where('titleNative', '==', '밀롱가 루씨').get();
    if (snapshot2.empty) {
      console.log('No matching documents found for 밀롱가 루씨 either.');
      return;
    } else {
      updateDocs(snapshot2);
    }
  } else {
    updateDocs(snapshot);
  }
}

async function updateDocs(snapshot) {
  const newDescription = `🔥 Welcome to Milonga LUCY! 🔥

Join us for an unforgettable night of passion, connection, and beautiful music! 🎶✨
Experience the true spirit of Tango in a warm and vibrant atmosphere. 💃🕺

✨ Highlights:
🍷 Great vibes & friendly community
🎵 Carefully curated traditional & modern tandas
🌟 Beautiful venue with a perfect dance floor

Don't miss out—grab your friends and let's dance the night away! 💫`;

  for (const doc of snapshot.docs) {
    console.log(`Updating document ${doc.id}`);
    await doc.ref.update({ description: newDescription });
    console.log('Successfully updated!');
  }
}

updateLucy().catch(console.error);
