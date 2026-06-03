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
  console.log("=== SCANNING ALL 140 SOCIALS FOR KEYWORDS ===");
  const socialsSnap = await getDocs(collection(db, 'socials'));
  let matchedCount = 0;
  
  socialsSnap.forEach(d => {
    const data = d.data();
    const title = data.title || "";
    const titleNative = data.titleNative || "";
    const venueName = data.venueName || "";
    const venueId = data.venueId || "";
    const organizerId = data.organizerId || "";
    const organizerName = data.organizerName || "";

    const strToSearch = `${title} ${titleNative} ${venueName} ${venueId} ${organizerId} ${organizerName}`.toLowerCase();
    
    if (strToSearch.includes("free") || strToSearch.includes("프리") || strToSearch.includes("tango society") || strToSearch.includes("tango_society") || strToSearch.includes("society")) {
      console.log(`MATCHED SOCIAL: id: [${d.id}], title: [${title}], titleNative: [${titleNative}], venueName: [${venueName}], venueId: [${venueId}], organizerId: [${organizerId}], organizerName: [${organizerName}]`);
      matchedCount++;
    }
  });

  console.log("Total matched socials:", matchedCount);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
