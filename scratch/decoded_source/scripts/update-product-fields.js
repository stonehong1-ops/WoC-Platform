// Batch update all products with new detail fields
const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateAllProducts() {
  const snapshot = await db.collection('products').get();
  console.log(`Found ${snapshot.size} products to update`);

  const batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const cat = (data.category || '').toLowerCase();
    const isShoes = cat.includes('shoe') || cat === 'shoes';
    const isWear = cat.includes('wear') || cat === 'dresses';

    const updates = {};

    // Production days min/max (if not set)
    if (!data.productionDaysMin) {
      if (isShoes) {
        updates.productionDaysMin = 10;
        updates.productionDaysMax = 21;
      } else if (isWear) {
        updates.productionDaysMin = 5;
        updates.productionDaysMax = 14;
      } else {
        updates.productionDaysMin = 3;
        updates.productionDaysMax = 7;
      }
    }

    // Delivery days (if not set)
    if (!data.deliveryDays) {
      updates.deliveryDays = isShoes ? 3 : 2;
    }

    // Shipping fee (if not set)
    if (data.shippingFee === undefined) {
      updates.shippingFee = 0; // free by default
    }

    // Seller pays shipping (if not set)
    if (data.sellerPaysShipping === undefined) {
      updates.sellerPaysShipping = false;
    }

    // Repurchase coupon (if not set)
    if (data.repurchaseCouponAmount === undefined) {
      // Some brands offer repurchase coupons
      const brand = (data.brand || '').toLowerCase();
      if (brand.includes('odile') || brand.includes('sharon')) {
        updates.repurchaseCouponAmount = 5000;
      } else if (brand.includes('t.balance') || brand.includes('tango shoes')) {
        updates.repurchaseCouponAmount = 3000;
      } else {
        updates.repurchaseCouponAmount = 0;
      }
    }

    // Size guide (if not set) - short text max 40 chars
    if (!data.sizeGuide) {
      if (isShoes) {
        updates.sizeGuide = 'Order 5mm up for wide feet';
      } else if (isWear) {
        updates.sizeGuide = 'Check bust/waist before ordering';
      } else {
        updates.sizeGuide = '';
      }
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      count++;
      console.log(`  [${count}] ${doc.id} (${data.title}) -> ${JSON.stringify(updates)}`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`\nDone! Updated ${count} products.`);
  } else {
    console.log('No updates needed.');
  }

  process.exit(0);
}

updateAllProducts().catch(console.error);
