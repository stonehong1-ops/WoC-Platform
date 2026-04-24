const admin = require('firebase-admin');
admin.initializeApp({
  projectId: 'woc-platform-seoul-1234'
});
const db = admin.firestore();
db.collection('users').limit(1).get()
  .then(snapshot => {
    console.log('Success! Found', snapshot.size, 'users');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
