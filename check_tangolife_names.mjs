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
  console.log("SEARCHING FOR TEXT:");
  let found = false;
  allSnap.docs.forEach(d => {
    const data = d.data();
    const title = data.title || "";
    const description = data.description || "";
    const locationField = data.location || "";
    if (
      title.includes("≈ ∞Ì∂Û¿Ã«¡") || title.toLowerCase().includes("tangolife") ||
      description.includes("≈ ∞Ì∂Û¿Ã«¡") || description.toLowerCase().includes("tangolife") ||
      locationField.includes("≈ ∞Ì∂Û¿Ã«¡") || locationField.toLowerCase().includes("tangolife")
    ) {
      console.log("MATCH:", d.ref.path, "| Title:", title, "| Location:", locationField, "| groupId:", data.groupId);
      found = true;
    }
  });
  if (!found) {
    console.log("NO CLASSES FOUND WITH TANGOLIFE TEXT IN FIELDS.");
  }
}
check().catch(console.error);
