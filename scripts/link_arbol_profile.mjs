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

const arbolUid = "XEurgRUpdKM2DOn5Lb1QNOTN9v52";
const arbolAvatar = "https://lh3.googleusercontent.com/a/ACg8ocKnccJz2uQiniXO5Eg5BRM5OEXYjB-oH3jaAWQk0E8xoB89mjU=s96-c";

async function linkArbolProfile() {
  console.log("Binding real Arbol profile (UID and avatar) to 9 June classes...");
  const classesRef = db.collection('groups').doc('ab-tango').collection('classes');
  
  let successCount = 0;
  
  const updatedInstructors = [
    {
      name: "Arbol",
      userId: arbolUid,
      avatar: arbolAvatar,
      role: "Instructor"
    },
    {
      name: "bosque",
      role: "Instructor"
    }
  ];

  for (const id of classIds) {
    try {
      await classesRef.doc(id).update({
        instructors: updatedInstructors
      });
      console.log(`[Instructor Linked] Class ID: ${id} successfully linked to Arbol profile.`);
      successCount++;
    } catch (e) {
      console.error(`[Link Failed] Class ID: ${id}`, e);
    }
  }

  console.log(`Profile linking process completed. Successfully updated ${successCount} / ${classIds.length} classes.`);
}

linkArbolProfile().catch(err => {
  console.error("Profile linking script crashed:", err);
  process.exit(1);
});
