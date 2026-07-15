import { initializeApp } from "firebase/app";
import { getFirestore, collectionGroup, getDocs } from "firebase/firestore";

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

async function check() {
  const allSnap = await getDocs(collectionGroup(db, "classes"));
  console.log("TOTAL CLASSES IN DB:", allSnap.size);
  allSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`- Path: ${d.ref.path} | Title: ${data.title} | Status: ${data.status} | Location: ${data.location}`);
  });
}
check().catch(console.error);
