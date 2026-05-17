const admin = require('firebase-admin');

const serviceAccount = require('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const db = admin.firestore();

async function updateProducts() {
  console.log('Starting bulk update of products...');
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();
  
  console.log(`Found ${snapshot.size} products.`);
  
  const batch = db.batch();
  let count = 0;
  const sellerId = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.sellerId !== sellerId) {
      batch.update(doc.ref, { sellerId: sellerId });
      count++;
    }
  });

  if (count > 0) {
    console.log(`Committing updates for ${count} products...`);
    await batch.commit();
    console.log(`Successfully updated ${count} products.`);
  } else {
    console.log('No products needed updating (all already set to Adminstone).');
  }
}

updateProducts().catch(err => {
  console.error('Error during bulk update:', err);
  process.exit(1);
});
