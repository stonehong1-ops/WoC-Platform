import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { writeFileSync } from "fs";

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

const validCodes = ['+82 (KR)', '+1 (US)', '+44 (UK)', '+49 (DE)'];

async function scanUsers() {
  console.log('--- Scanning Users for Invalid Country Codes ---');
  const userSnap = await getDocs(collection(db, 'users'));
  
  let total = 0;
  let invalidCount = 0;
  
  const results = [];

  userSnap.docs.forEach(d => {
    total++;
    const data = d.data();
    const countryCode = data.countryCode;
    
    if (!countryCode || !validCodes.includes(countryCode)) {
      invalidCount++;
      results.push({
        uid: d.id,
        nickname: data.nickname || '(No nickname)',
        email: data.email || '(No email)',
        countryCode: countryCode === undefined ? 'UNDEFINED' : (countryCode === '' ? 'EMPTY_STRING' : countryCode),
        phoneNumber: data.phoneNumber || '(No phone)'
      });
    }
  });

  const output = {
    summary: { total, invalidCount },
    details: results
  };

  writeFileSync('C:/Users/stone/.gemini/antigravity/brain/83772149-7eee-4700-85c5-7c3cda8e04a2/scratch/audit_results.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Scan completed. Total: ${total}, Invalid: ${invalidCount}. Saved to audit_results.json`);
}

scanUsers().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
