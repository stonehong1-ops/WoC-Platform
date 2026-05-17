const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
  try {
    admin.initializeApp({
      projectId: 'woc-platform-seoul-1234'
    });
    const db = admin.firestore();
    const data = JSON.parse(fs.readFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\10e5860f-480b-4c32-91d6-b8d9b9c372fe\\.system_generated\\steps\\1153\\output.txt', 'utf8'));
    const missing = data.documents.filter(doc => !doc.fields.sellerId);
    const sellerId = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
    
    console.log(`Found ${missing.length} products to update.`);
    
    const batch = db.batch();
    for (const doc of missing) {
      const id = doc.name.split('/').pop();
      const ref = db.collection('products').doc(id);
      batch.update(ref, { sellerId: sellerId });
    }
    
    await batch.commit();
    console.log('Successfully updated products.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
