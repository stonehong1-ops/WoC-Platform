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

const docId = "BrP6IxFlHSpxA37nKpmZ"; // 뮤롱가 문서 ID

async function convertMurongaToRegular() {
  console.log(`Converting Muronga [${docId}] to regular 3rd Friday milonga...`);
  const socialsRef = db.collection('socials');
  
  try {
    // Update to regular 3rd Friday, and delete the temporary date field using FieldValue.delete()
    await socialsRef.doc(docId).update({
      type: "regular",
      dayOfWeek: 5,
      recurrence: "3rd",
      date: admin.firestore.FieldValue.delete()
    });
    console.log("Successfully updated Muronga to regular 3rd Friday milonga.");
  } catch (e) {
    console.error("Failed to update Muronga", e);
  }
}

convertMurongaToRegular().catch(err => {
  console.error("Conversion failed:", err);
  process.exit(1);
});
