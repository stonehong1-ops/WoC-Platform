import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, collectionGroup, query, where } from "firebase/firestore";

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
  const q = query(collectionGroup(db, "classes"));
  const allSnap = await getDocs(q);
  console.log("BROAD SEARCH IN ALL CLASSES:");
  allSnap.docs.forEach(d => {
    const data = d.data();
    const str = JSON.stringify({ id: d.id, path: d.ref.path, ...data }).toLowerCase();
    if (str.includes("tangolife") || str.includes("≈ ∞Ì∂Û¿Ã«¡") || str.includes("ø™ªÔ∑Œ") || str.includes("109")) {
      console.log("MATCH FOUND:", d.ref.path, "| Title:", data.title, "| Location:", data.location, "| Status:", data.status, "| targetMonth:", data.targetMonth);
    }
  });
}
check().catch(console.error);
