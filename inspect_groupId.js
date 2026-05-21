const admin = require('firebase-admin');
const serviceAccount = require('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function inspect() {
  const groupId = "79hPPpHs0bu2FKNjOrbi";
  console.log("=== Inspecting root events for groupId ===");
  const snapshot = await db.collection('events').get();
  
  let matchCount = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.groupId || data.groupId === groupId) {
      console.log(`Event ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  GroupId: ${data.groupId}`);
      console.log(`  Type: ${data.type}`);
      console.log(`  StartDate: ${data.startDate instanceof admin.firestore.Timestamp ? data.startDate.toDate().toISOString() : data.startDate}`);
      matchCount++;
    }
  });
  console.log(`Total events with groupId: ${matchCount}`);
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
