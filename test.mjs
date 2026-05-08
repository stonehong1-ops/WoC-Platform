import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import fs from 'fs';

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
  const groupsSnap = await getDocs(collection(db, "groups"));
  const groups = groupsSnap.docs.map(d => ({id: d.id, name: d.data().name}));
  console.log("Groups:", groups);
  
  // Find "Freestyle Tango"
  const ft = groups.find(g => g.name.toLowerCase().includes("freestyle"));
  if (ft) {
    const gDoc = await getDoc(doc(db, "groups", ft.id));
    console.log("FT group classes:", JSON.stringify(gDoc.data().classes, null, 2));
    
    // Find events with venueId
    const eventsSnap = await getDocs(query(collection(db, "events"), where("venueId", "==", ft.id)));
    console.log("Events by venueId count:", eventsSnap.docs.length);
    eventsSnap.docs.forEach(d => console.log(d.id, d.data().title));
  }
}

run().catch(console.error);
