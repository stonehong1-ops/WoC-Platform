import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccountPath = 'c:/Users/stone/WoC/woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const classIds = [
  "THftoRmM7mTvQ7bQf3Tf", // 탱고베이직
  "8RCpd5tSEIxRVKtkAMAL", // 탱고베이직응용
  "klTjZSx6u74ZzdAFqjnb", // 밀롱가&발스1
  "JHeMCTEfaWqxjqcbojks", // 실전 시퀀스1
  "rRr4Pfa69A0Et1jhYr3z", // 밀롱가&발스2
  "F2QMNwWo6Pwy2izkkYDX", // 실전 시퀀스2
  "aywQOVwXuUDDNcFvBOyS", // 실전고급시퀀스 &땅게라표현 (홍대)
  "IAzz47tszxbeQbFEIR24", // 탱고다지기(홍대)
  "OjocTuApEJ9vfRf9Bceu"  // 에너지의 활용 (특강)
];

async function updateAndCreateDiscount() {
  console.log("Updating class prices to 80,000 KRW...");
  const classesRef = db.collection('groups').doc('ab-tango').collection('classes');
  
  let updateSuccessCount = 0;
  for (const id of classIds) {
    try {
      await classesRef.doc(id).update({
        amount: 80000,
        price: 80000
      });
      console.log(`[Class Updated] ID: ${id} successfully updated to 80k KRW.`);
      updateSuccessCount++;
    } catch (e) {
      console.error(`[Class Update Failed] ID: ${id}`, e);
    }
  }

  console.log("Creating bundle discount product '에이비탱고 6월 묶음신청'...");
  const discountsRef = db.collection('groups').doc('ab-tango').collection('discounts');
  
  const discountData = {
    title: "에이비탱고 6월 묶음신청",
    description: "6월 정규 강습 묶음 신청 패키지 할인 혜택 상품",
    currency: "KRW",
    amount: 200000,
    discountDescription: "6월 강습 묶음 혜택",
    includedClassIds: classIds,
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-06-01T08:00:00Z"))
  };

  try {
    const docRef = await discountsRef.add(discountData);
    console.log(`[Discount Success] Bundle product created successfully -> Doc ID: ${docRef.id}`);
  } catch (e) {
    console.error("[Discount Failed] Bundle product creation failed", e);
  }

  console.log("Update and creation process completed successfully.");
}

updateAndCreateDiscount().catch(err => {
  console.error("Batch update failed:", err);
  process.exit(1);
});
