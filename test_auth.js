const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'woc-platform-seoul-1234' });
const db = admin.firestore();
db.collection('users').limit(1).get()
  .then(s => console.log('Success:', s.size))
  .catch(e => console.error('Failed:', e.message));
