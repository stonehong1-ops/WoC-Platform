const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findSemrose() {
  try {
    const usersSnap = await db.collection('users').get();
    let found = [];

    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      const matchName = (data.nickname && (data.nickname.includes('셈로즈') || data.nickname.toLowerCase().includes('semrose') || data.nickname.toLowerCase().includes('amy')))
                   || (data.displayName && (data.displayName.includes('셈로즈') || data.displayName.toLowerCase().includes('semrose') || data.displayName.toLowerCase().includes('amy')));
      
      if (matchName) {
        found.push({ id: doc.id, ...data });
      }
    });

    console.log(`Found ${found.length} matching users:`);
    console.log(JSON.stringify(found, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

findSemrose();
