import { initializeApp } from "firebase/app";
import { getFirestore, collectionGroup, getDocs, query, where } from "firebase/firestore";

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

async function checkClasses() {
  const q = query(collectionGroup(db, "classes"), where("status", "==", "Open"));
  const snap = await getDocs(q);
  console.log("FOUND_CLASSES_COUNT:" + snap.size);
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log("CLASS:" + doc.id + "|" + data.title + "|" + data.location + "|" + data.targetMonth + "|" + JSON.stringify(data.instructors) + "|" + (data.schedule ? data.schedule.map(s => s.date).join(",") : ""));
  });
}
checkClasses().catch(console.error);
