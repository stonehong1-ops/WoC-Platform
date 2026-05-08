const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkChatRooms() {
  // Check for group/groups type chat rooms
  const types = ['group', 'groups', 'public', 'notice'];
  
  for (const type of types) {
    const snapshot = await db.collection('chat_rooms').where('type', '==', type).get();
    console.log(`\n=== Type: "${type}" - Count: ${snapshot.size} ===`);
    snapshot.forEach(doc => {
      const d = doc.data();
      console.log(JSON.stringify({
        id: doc.id,
        name: d.name,
        type: d.type,
        participantsCount: d.participants?.length || 0,
        createdBy: d.createdBy,
        linkedGroupId: d.linkedGroupId || 'NONE',
      }));
    });
  }
}

checkChatRooms().catch(console.error);
