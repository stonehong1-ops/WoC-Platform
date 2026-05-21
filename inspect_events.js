// Firebase의 events 컬렉션 또는 groups 하위 events 컬렉션을 확인하기 위한 스크립트
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
  console.log("=== Inspecting Group Events Subcollection ===");
  const groupEventsRef = db.collection('groups').doc(groupId).collection('events');
  const groupEventsSnap = await groupEventsRef.get();
  console.log(`Group events count: ${groupEventsSnap.size}`);
  groupEventsSnap.forEach(doc => {
    console.log(`Event ID: ${doc.id}, Title: ${doc.data().title}, Type: ${doc.data().type}`);
  });

  console.log("=== Inspecting Root events Collection ===");
  const rootEventsRef = db.collection('events');
  const rootEventsSnap = await rootEventsRef.limit(10).get();
  console.log(`Root events count (limit 10): ${rootEventsSnap.size}`);
  rootEventsSnap.forEach(doc => {
    console.log(`Event ID: ${doc.id}, Title: ${doc.data().title}, GroupId: ${doc.data().groupId}`);
  });

  process.exit(0);
}

inspect().catch(err => {
  console.error("Error inspecting:", err);
  process.exit(1);
});
