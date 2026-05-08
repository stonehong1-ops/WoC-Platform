import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0",
  authDomain: "woc-platform-seoul-1234.firebaseapp.com",
  projectId: "woc-platform-seoul-1234",
  storageBucket: "woc-platform-seoul-1234.firebasestorage.app",
  messagingSenderId: "1021887439599",
  appId: "1:1021887439599:web:7c5741009dd928b8fd311a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const eventsSnap = await getDocs(collection(db, "events"));
  const events = eventsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const lucyEvents = events.filter(e => e.title.includes("Lucy") || (e.titleNative && e.titleNative.includes("루씨")));
  console.log("Lucy Events:");
  lucyEvents.forEach(e => {
    console.log(`- ${e.title} (${e.titleNative}): hostId=${e.hostId}, venueId=${e.venueId}`);
  });

  const ftEvents = events.filter(e => e.title.toLowerCase().includes("freestyle") || (e.titleNative && e.titleNative.includes("프리스타일")));
  console.log("\nFT Events:");
  ftEvents.forEach(e => {
    console.log(`- ${e.title} (${e.titleNative}): hostId=${e.hostId}, venueId=${e.venueId}`);
  });
  
  // also check if there is a group called "lucy"
  const groupsSnap = await getDocs(collection(db, "groups"));
  const groups = groupsSnap.docs.map(d => ({id: d.id, name: d.data().name, classes: !!d.data().classes}));
  console.log("\nGroups with 'lucy' or 'freestyle' in name:");
  groups.filter(g => g.name.toLowerCase().includes("lucy") || g.name.toLowerCase().includes("freestyle")).forEach(g => console.log(g));
  
  // check which groups have classes
  console.log("\nGroups with classes:", groups.filter(g => g.classes).map(g => g.name).join(", "));
}

run().catch(console.error);
