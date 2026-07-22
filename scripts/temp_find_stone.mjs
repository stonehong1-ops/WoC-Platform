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

async function run() {
  const coll = collection(db, "users");
  const snap = await getDocs(coll);
  
  console.log("=== STONE USERS SEARCH ===");
  snap.forEach(doc => {
    const data = doc.data();
    const nickname = (data.nickname || "").toLowerCase();
    const nativeNickname = (data.nativeNickname || "").toLowerCase();
    const email = (data.email || "").toLowerCase();
    const phone = data.phoneNumber || "";
    
    // Check if it matches 'stone' or '스톤'
    if (nickname.includes("stone") || nativeNickname.includes("스톤") || nickname.includes("스톤") || email.includes("stone")) {
      console.log(`Document ID: ${doc.id}`);
      console.log({
        nickname: data.nickname,
        nativeNickname: data.nativeNickname,
        email: data.email,
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode,
        role: data.role,
        isAdmin: data.isAdmin
      });
      console.log("--------------------------------");
    }
  });
}
run().then(() => process.exit(0)).catch(console.error);
