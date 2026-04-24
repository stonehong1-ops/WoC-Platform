const admin = require('firebase-admin');

async function migrateMembers() {
    console.log('Initializing Firebase App...');
    
    // Use default credentials or provide specific project ID
    admin.initializeApp({
        projectId: 'woc-platform-seoul-1234'
    });

    const db = admin.firestore();
    const groupId = 'freestyle-tango';

    console.log('Fetching all users from "users" collection...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users.`);

    const batchSize = 400;
    let count = 0;
    let batch = db.batch();

    const membersRef = db.collection('groups').doc(groupId).collection('members');

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        // Skip if user doesn't have essential info (safety check)
        if (!userData.nickname) {
            console.warn(`Skipping user ${uid}: Missing nickname`);
            continue;
        }

        const memberData = {
            nickname: userData.nickname,
            photoURL: userData.photoURL || '/anonymous-user.png',
            role: userData.role || 'member',
            joinedAt: userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            phoneNumber: userData.phoneNumber || uid
        };

        const memberRef = membersRef.doc(uid);
        batch.set(memberRef, memberData, { merge: true });
        count++;

        if (count % batchSize === 0) {
            await batch.commit();
            console.log(`Commited ${count} members...`);
            batch = db.batch();
        }
    }

    if (count % batchSize !== 0) {
        await batch.commit();
    }

    console.log(`Successfully migrated ${count} users to group "${groupId}" members subcollection.`);

    // Update group metadata
    console.log('Updating group memberCount and clearing legacy members array...');
    await db.collection('groups').doc(groupId).update({
        memberCount: count,
        members: admin.firestore.FieldValue.delete() // Clear the array field if it exists
    });

    console.log('Group metadata updated.');
}

migrateMembers().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
