// 프리스타일 5월 멤버쉽 targetMonth 필드 보정 스크립트
const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const targetDocRef = db.collection('groups')
                         .doc('freestyle-tango')
                         .collection('monthlyPasses')
                         .doc('8d0d23dc-fb00-4b79-aa96-49c0f1a7bf6e');
  
  console.log("Reading 5월 멤버쉽 document...");
  const docSnap = await targetDocRef.get();
  
  if (!docSnap.exists) {
    console.error("Document not found!");
    return;
  }
  
  console.log("Current Data:", docSnap.data());
  
  console.log("Updating targetMonth to '2026-05'...");
  await targetDocRef.update({
    targetMonth: '2026-05',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log("Update successful!");
  
  // 결과 확인
  const updatedSnap = await targetDocRef.get();
  console.log("Updated Data:", updatedSnap.data());
}

run().catch(console.error);
