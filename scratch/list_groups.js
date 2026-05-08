// List all groups with their id, name, ownerId, membershipPolicy
const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listGroups() {
  const snapshot = await db.collection('groups').get();
  const groups = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    groups.push({
      id: doc.id,
      name: data.name || 'N/A',
      nativeName: data.nativeName || '',
      ownerId: data.ownerId || 'N/A',
      joinStrategy: data.membershipPolicy?.joinStrategy || 'NOT_SET',
      memberCount: data.memberCount || 0,
      coverImage: data.coverImage ? 'YES' : 'NO',
      logo: data.logo ? 'YES' : 'NO',
    });
  });
  
  console.log(`\n=== Total Groups: ${groups.length} ===\n`);
  console.log(JSON.stringify(groups, null, 2));
}

listGroups().catch(console.error);
