import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, collectionGroup, query } from "firebase/firestore";

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
  const gDoc = await getDoc(doc(db, "groups", "tangolife"));
  console.log("TANGOLIFE GROUP:", JSON.stringify(gDoc.data(), null, 2));

  console.log("Checking subcollections under groups/tangolife:");
  const subcolls = ["spaces", "rentals", "stay", "stays", "shop_items", "products", "classes", "calendar_events"];
  for (const sub of subcolls) {
    try {
      const snap = await getDocs(collection(db, "groups", "tangolife", sub));
      console.log(`- Subcollection "${sub}" count:`, snap.size);
      snap.docs.forEach(d => {
        console.log(`   * ${d.id}:`, JSON.stringify(d.data(), null, 2));
      });
    } catch (e) {
      console.log(`- Subcollection "${sub}" failed:`, e.message);
    }
  }
}
check().catch(console.error);
