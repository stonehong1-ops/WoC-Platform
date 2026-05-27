import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getCountFromServer } from "firebase/firestore";

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
  const coll = collection(db, "users");
  const snapshot = await getCountFromServer(coll);
  console.log("Total users count:", snapshot.data().count);
}

run().then(() => process.exit(0)).catch(console.error);
