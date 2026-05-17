import { db } from '../src/lib/firebase/clientApp';
import { collection, getDocs, doc, writeBatch, deleteField } from 'firebase/firestore';

async function migrateClasses() {
    console.log('Starting client-side Firebase Migration...');

    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    let totalClassesMoved = 0;
    let totalPassesMoved = 0;
    let totalDiscountsMoved = 0;

    for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data();
        const groupId = groupDoc.id;
        
        const batch = writeBatch(db);
        
        // Migrate Classes
        const classes = groupData.classes || [];
        for (const cls of classes) {
            const ref = doc(db, 'groups', groupId, 'classes', cls.id);
            batch.set(ref, cls);
            totalClassesMoved++;
        }

        // Migrate Monthly Passes
        const passes = groupData.monthlyPasses || [];
        for (const pass of passes) {
            const ref = doc(db, 'groups', groupId, 'monthlyPasses', pass.id);
            batch.set(ref, pass);
            totalPassesMoved++;
        }

        // Migrate Discounts
        const discounts = groupData.discounts || [];
        for (const discount of discounts) {
            const ref = doc(db, 'groups', groupId, 'discounts', discount.id);
            batch.set(ref, discount);
            totalDiscountsMoved++;
        }

        // Update group document to remove array fields
        const groupRef = doc(db, 'groups', groupId);
        batch.update(groupRef, {
            classes: deleteField(),
            monthlyPasses: deleteField(),
            discounts: deleteField()
        });

        await batch.commit();
        console.log(`Migrated group: ${groupId} (Classes: ${classes.length}, Passes: ${passes.length}, Discounts: ${discounts.length})`);
    }

    console.log(`Migration Complete! Total Moved -> Classes: ${totalClassesMoved}, Passes: ${totalPassesMoved}, Discounts: ${totalDiscountsMoved}`);
    process.exit(0);
}

migrateClasses().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
