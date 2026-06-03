require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, collectionGroup, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("=== ALL GROUPS IN DB ===");
  const groupsSnap = await getDocs(collection(db, 'groups'));
  groupsSnap.forEach(d => {
    const data = d.data();
    console.log(`Group ID: [${d.id}], name: [${data.name}], nativeName: [${data.nativeName}], venueId: [${data.venueId}]`);
  });

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
