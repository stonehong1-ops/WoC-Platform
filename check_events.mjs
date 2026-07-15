import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
  const snap = await getDocs(collection(db, "events"));
  console.log("TOTAL EVENTS IN DB:", snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    const str = JSON.stringify({ id: d.id, ...data }).toLowerCase();
    if (str.includes("tangolife") || str.includes("≈ ∞Ì∂Û¿Ã«¡")) {
      console.log("- MATCH IN EVENT:", d.id, JSON.stringify(data, null, 2));
    }
  });
}
check().catch(console.error);
