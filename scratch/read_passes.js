// freestyle-tango 그룹의 monthlyPasses와 discounts 데이터 조회
const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  console.log("=== Fetching freestyle-tango monthlyPasses ===");
  const passesRef = db.collection('groups').doc('freestyle-tango').collection('monthlyPasses');
  const passesSnapshot = await passesRef.get();
  
  passesSnapshot.forEach(doc => {
    console.log(`Pass ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log("------------------------");
  });

  console.log("=== Fetching freestyle-tango discounts ===");
  const discountsRef = db.collection('groups').doc('freestyle-tango').collection('discounts');
  const discountsSnapshot = await discountsRef.get();
  
  discountsSnapshot.forEach(doc => {
    console.log(`Discount ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log("------------------------");
  });
}

run().catch(console.error);
