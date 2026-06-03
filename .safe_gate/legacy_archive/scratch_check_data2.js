require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
  console.log("=== GROUPS ===");
  const groupsSnap = await getDocs(collection(db, 'groups'));
  groupsSnap.forEach(d => {
    const data = d.data();
    if (data.name.includes("Freestyle") || data.name.includes("프리스타일")) {
      console.log("GROUP:", d.id, "name:", data.name, "venueId:", data.venueId, "ownerId:", data.ownerId);
    }
  });

  console.log("\n=== ALL SOCIALS COUNT ===");
  const socialsSnap = await getDocs(collection(db, 'socials'));
  console.log("Total socials in db:", socialsSnap.size);
  let count = 0;
  socialsSnap.forEach(d => {
    const data = d.data();
    if (count < 5) {
      console.log("SOCIAL SAMPLE:", d.id, "title:", data.title, "venueId:", data.venueId, "organizerId:", data.organizerId);
      count++;
    }
  });

  console.log("\n=== ALL CLASSES COUNT ===");
  const classesSnap = await getDocs(collection(db, 'classes'));
  console.log("Total classes in db:", classesSnap.size);
  count = 0;
  classesSnap.forEach(d => {
    const data = d.data();
    if (count < 5) {
      console.log("CLASS SAMPLE:", d.id, "title:", data.title, "groupId:", data.groupId);
      count++;
    }
  });

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
