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
  console.log("=== CHECKING CLASSES ===");
  const classesSnap = await getDocs(collection(db, 'classes'));
  classesSnap.forEach(d => {
    const data = d.data();
    if (data.groupId === 'rglqeyjDHzzhbUwuim5O') {
      console.log("CLASS FOUND:", d.id, "title:", data.title, "groupId:", data.groupId, "schedule:", JSON.stringify(data.schedule));
    }
  });

  console.log("\n=== CHECKING SOCIALS ===");
  const socialsSnap = await getDocs(collection(db, 'socials'));
  socialsSnap.forEach(d => {
    const data = d.data();
    const isMatched = data.venueId === '2mvxZZVNWzJ4MwDIAWq3' || data.organizerId === 'rglqeyjDHzzhbUwuim5O';
    if (isMatched) {
      console.log("SOCIAL FOUND:", d.id, "title:", data.title, "type:", data.type, "dayOfWeek:", data.dayOfWeek, "date:", data.date, "venueId:", data.venueId, "organizerId:", data.organizerId);
    }
  });

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
