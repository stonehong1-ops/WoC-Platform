import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

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

async function showOneClass() {
  const q = query(collection(db, 'groups', '79hPPpHs0bu2FKNjOrbi', 'classes'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log(JSON.stringify(snap.docs[0].data(), null, 2));
  } else {
    console.log('No classes found in 79hPPpHs0bu2FKNjOrbi');
  }
}

showOneClass().catch(console.error);
