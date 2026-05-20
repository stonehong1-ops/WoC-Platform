const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspectGroup(groupId) {
  console.log("=== Inspecting Group: " + groupId + " ===");
  const groupDoc = await db.collection('groups').doc(groupId).get();
  if (!groupDoc.exists) {
    console.log("Group doc " + groupId + " does not exist!");
    return;
  }
  console.log("Group Name: " + groupDoc.data().name);

  // Classes
  console.log("--- Classes ---");
  const classesSnap = await db.collection('groups').doc(groupId).collection('classes').get();
  classesSnap.forEach(doc => {
    const data = doc.data();
    console.log("Class ID: " + doc.id + " | Title: " + data.title + " | Month: " + data.targetMonth);
  });

  // Monthly Passes
  console.log("--- Monthly Passes ---");
  const passesSnap = await db.collection('groups').doc(groupId).collection('monthlyPasses').get();
  passesSnap.forEach(doc => {
    const data = doc.data();
    console.log("Pass ID: " + doc.id + " | Title: " + data.title + " | Month: " + data.targetMonth + " | IncludedClassIds: " + JSON.stringify(data.includedClassIds));
  });
}

async function run() {
  await inspectGroup('freestyle-tango');
  await inspectGroup('rglqeyjDHzzhbUwuim5O');
}

run().catch(console.error);
