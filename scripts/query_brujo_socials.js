const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function queryBrujoSocials() {
  try {
    const socialsSnap = await db.collection('socials').get();
    socialsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.organizerId === 'rNlMcPgoapaReMXt4P0ux35WklJ2' || (data.title && (data.title.includes('쁘락띠') || data.title.includes('Brujo') || data.title.includes('Practi')))) {
        console.log(`Found Social: ID=${doc.id}`);
        console.log(`Title: ${data.title}`);
        console.log(`Date: ${data.date}`);
        console.log(`Type: ${data.type}`);
        console.log(`OrganizerName: ${data.organizerName}`);
        console.log(`-----------------------------`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

queryBrujoSocials();
