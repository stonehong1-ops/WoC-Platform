import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

import { readFileSync } from 'fs';
import { parse } from 'dotenv';
const envConfig = parse(readFileSync('.env.local'));
firebaseConfig.apiKey = envConfig.NEXT_PUBLIC_FIREBASE_API_KEY;
firebaseConfig.authDomain = envConfig.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
firebaseConfig.projectId = envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
firebaseConfig.storageBucket = envConfig.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
firebaseConfig.messagingSenderId = envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
firebaseConfig.appId = envConfig.NEXT_PUBLIC_FIREBASE_APP_ID;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function update() {
  console.log("Fetching groups...");
  const q = query(collection(db, 'groups'), where('name', '==', 'freestyle tango'));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("No group found.");
    process.exit(1);
  }
  const groupDoc = snapshot.docs[0];
  console.log("Found group:", groupDoc.id);
  await updateDoc(doc(db, 'groups', groupDoc.id), {
    nativeName: '프리스타일'
  });
  console.log("Successfully updated nativeName to 프리스타일");
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
