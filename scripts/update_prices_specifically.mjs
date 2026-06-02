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

// Specific prices update map
const updates = [
  { id: "klTjZSx6u74ZzdAFqjnb", name: "밀롱가&발스1", price: 120000 },
  { id: "rRr4Pfa69A0Et1jhYr3z", name: "밀롱가&발스2", price: 120000 },
  { id: "aywQOVwXuUDDNcFvBOyS", name: "실전고급시퀀스 &땅게라표현 (홍대)", price: 200000 },
  { id: "IAzz47tszxbeQbFEIR24", name: "탱고다지기(홍대)", price: 110000 }
];

async function updateSpecificPrices() {
  console.log("Starting precision price update for specific classes...");
  const classesRef = db.collection('groups').doc('ab-tango').collection('classes');
  
  let successCount = 0;
  for (const item of updates) {
    try {
      await classesRef.doc(item.id).update({
        amount: item.price,
        price: item.price
      });
      console.log(`[Class Price Adjusted] [${item.name}] updated to ${item.price} KRW.`);
      successCount++;
    } catch (e) {
      console.error(`[Class Price Adjustment Failed] [${item.name}]`, e);
    }
  }

  console.log(`Price adjustments completed successfully. Updated ${successCount} / ${updates.length} classes.`);
}

updateSpecificPrices().catch(err => {
  console.error("Precision price update crashed:", err);
  process.exit(1);
});
