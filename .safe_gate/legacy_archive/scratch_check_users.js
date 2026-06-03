require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("=== CHECKING USERS FOR NICKNAMES ===");
  const usersSnap = await getDocs(collection(db, 'users'));
  usersSnap.forEach(d => {
    const data = d.data();
    // name, nickname, englishName, nativeName 등 이름 관련 필드 모두 출력
    console.log(`User ID: [${d.id}], name: [${data.name}], nickname: [${data.nickname}], englishName: [${data.englishName}]`);
  });

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
