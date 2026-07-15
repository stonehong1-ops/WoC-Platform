import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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
  const cSnap = await getDocs(collection(db, "groups", "tangolife", "calendar_events"));
  console.log("CALENDAR EVENTS COUNT FOR TANGOLIFE:", cSnap.size);
  cSnap.docs.forEach(d => {
    console.log("EVENT ID:", d.id, "| DATA:", JSON.stringify(d.data(), null, 2));
  });
}
check().catch(console.error);
