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
  console.log("=== CHECKING INSTRUCTORS IN CLASSES ===");
  const classesSnap = await getDocs(collectionGroup(db, 'classes'));
  classesSnap.forEach(d => {
    const data = d.data();
    const pathSegments = d.ref.path.split('/');
    const groupId = pathSegments[1] || '';
    if (groupId === 'freestyle-tango') {
      console.log(`CLASS: [${d.id}] title: [${data.title}]`);
      console.log(`  -> instructors:`, JSON.stringify(data.instructors));
    }
  });

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
