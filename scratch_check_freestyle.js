require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

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
  const docRef = doc(db, 'groups', 'freestyle');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("FOUND freestyle via client SDK:", snap.data().name);
  } else {
    console.log("NOT FOUND: groups/freestyle");
  }

  const docRef2 = doc(db, 'groups', 'freestyle-tango');
  const snap2 = await getDoc(docRef2);
  if (snap2.exists()) {
    console.log("FOUND freestyle-tango via client SDK:", snap2.data().name);
  } else {
    console.log("NOT FOUND: groups/freestyle-tango");
  }

  const qs = await getDocs(collection(db, 'groups'));
  qs.forEach(d => {
    if (d.id.toLowerCase().includes('free') || d.data().name?.toLowerCase().includes('free')) {
      console.log("MATCH:", d.id, d.data().name);
    }
  });
  
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
