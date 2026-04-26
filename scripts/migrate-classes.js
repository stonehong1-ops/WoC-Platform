const admin = require('firebase-admin');

async function migrateClasses() {
    console.log('Initializing Firebase App...');
    admin.initializeApp({ projectId: 'woc-platform-seoul-1234' });
    const db = admin.firestore();

    const groupsSnapshot = await db.collection('groups').get();
    let totalClassesMoved = 0;
    let totalPassesMoved = 0;
    let totalDiscountsMoved = 0;

    for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data();
        const groupId = groupDoc.id;
        
        let batch = db.batch();
        let batchCount = 0;
        
        // Migrate Classes
        const classes = groupData.classes || [];
        for (const cls of classes) {
            const ref = db.collection('groups').doc(groupId).collection('classes').doc(cls.id);
            batch.set(ref, cls);
            totalClassesMoved++;
            batchCount++;
        }

        // Migrate Monthly Passes
        const passes = groupData.monthlyPasses || [];
        for (const pass of passes) {
            const ref = db.collection('groups').doc(groupId).collection('monthlyPasses').doc(pass.id);
            batch.set(ref, pass);
            totalPassesMoved++;
            batchCount++;
        }

        // Migrate Discounts
        const discounts = groupData.discounts || [];
        for (const discount of discounts) {
            const ref = db.collection('groups').doc(groupId).collection('discounts').doc(discount.id);
            batch.set(ref, discount);
            totalDiscountsMoved++;
            batchCount++;
        }

        // Update group document to remove array fields
        const groupRef = db.collection('groups').doc(groupId);
        batch.update(groupRef, {
            classes: admin.firestore.FieldValue.delete(),
            monthlyPasses: admin.firestore.FieldValue.delete(),
            discounts: admin.firestore.FieldValue.delete()
        });

        await batch.commit();
        console.log(`Migrated group: ${groupId} (Classes: ${classes.length}, Passes: ${passes.length}, Discounts: ${discounts.length})`);
    }

    console.log(`Migration Complete! Total Moved -> Classes: ${totalClassesMoved}, Passes: ${totalPassesMoved}, Discounts: ${totalDiscountsMoved}`);
}

migrateClasses().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
