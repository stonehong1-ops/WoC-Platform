import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

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
  const coll = collection(db, "groups");
  const snapshot = await getDocs(coll);
  
  const dbGroups = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    dbGroups.push({
      id: doc.id,
      name: data.name || "",
      nativeName: data.nativeName || "",
      nativeTitle: data.nativeTitle || "",
      description: data.description || ""
    });
  });

  fs.writeFileSync("db_groups_dump.json", JSON.stringify(dbGroups, null, 2));
  console.log(`Saved ${dbGroups.length} groups to db_groups_dump.json`);
}

run().then(() => process.exit(0)).catch(console.error);
