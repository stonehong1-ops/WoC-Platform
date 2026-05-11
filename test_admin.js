const admin = require('firebase-admin');
try {
  admin.initializeApp({
    projectId: 'woc-platform-seoul-1234'
  });
  const db = admin.firestore();
  db.collection('groups').limit(1).get()
    .then(snapshot => {
      console.log('Successfully connected to Firestore');
      snapshot.forEach(doc => console.log(doc.id));
      process.exit(0);
    })
    .catch(err => {
      console.error('Error connecting to Firestore:', err);
      process.exit(1);
    });
} catch (e) {
  console.error('Initialization error:', e);
  process.exit(1);
}
