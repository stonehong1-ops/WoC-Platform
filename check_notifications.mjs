// 알림 컬렉션의 실제 적재 데이터를 조사하기 위한 임시 스크립트.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, limit, query, getDocs } from "firebase/firestore";

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
  const coll = collection(db, "notifications");
  const q = query(coll, limit(50));
  const snapshot = await getDocs(q);
  console.log(`--- Total notifications queried: ${snapshot.size} ---`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`[ID]: ${doc.id}`);
    console.log(`[Category]: ${data.category} | [Type]: ${data.type}`);
    console.log(`[Title]: ${data.title}`);
    console.log(`[Message]: ${data.message}`);
    console.log(`[fromUserName]: ${data.fromUserName} | [targetUserId]: ${data.targetUserId}`);
    console.log(`[fromUserId]: ${data.fromUserId}`);
    console.log('----------------------------------------------------');
  });
}

run().then(() => process.exit(0)).catch(console.error);
