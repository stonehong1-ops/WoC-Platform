const admin = require('firebase-admin');
const serviceAccount = require('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const mandatoryFunctions = [
  'dashboard', 
  'feed', 
  'live', 
  'calendar', 
  'members', 
  'notice', 
  'about', 
  'brand-setting', 
  'roles-permissions'
];

const menuOrder = mandatoryFunctions.map(id => ({
  id,
  type: 'item'
}));

async function migrate() {
  const groupsRef = db.collection('groups');
  const snapshot = await groupsRef.get();

  console.log(`Found ${snapshot.size} groups. Starting migration...`);
  
  let count = 0;
  for (const doc of snapshot.docs) {
    const groupId = doc.id;
    try {
      await groupsRef.doc(groupId).update({
        selectedFunctions: mandatoryFunctions,
        menuOrder: menuOrder,
        updatedAt: admin.firestore.Timestamp.now()
      });
      console.log(`[${++count}/${snapshot.size}] Updated ${groupId}`);
    } catch (err) {
      console.error(`Failed to update ${groupId}:`, err);
    }
  }
  
  console.log('Migration completed.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
