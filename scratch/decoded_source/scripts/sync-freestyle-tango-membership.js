const admin = require('firebase-admin');

/**
 * Migration script to synchronize Freestyle Tango membership
 * 1. Registers all users into groups/freestyle-tango/members subcollection
 * 2. Updates groups/freestyle-tango document with memberIds array and memberCount
 * 3. Updates each user document with joinedGroups array containing 'freestyle-tango'
 */
async function syncFreestyleTangoMembership() {
    console.log('🚀 Starting Freestyle Tango Membership Synchronization...');
    
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: 'woc-platform-seoul-1234'
        });
    }

    const db = admin.firestore();
    const groupId = 'freestyle-tango';

    console.log('Fetching all users from "users" collection...');
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    console.log(`Found ${totalUsers} users.`);

    const batchSize = 450; // Keep it under 500
    let count = 0;
    let batch = db.batch();
    const allUserIds = [];

    const groupDocRef = db.collection('groups').doc(groupId);
    const membersSubRef = groupDocRef.collection('members');

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;
        allUserIds.push(uid);

        // 1. Prepare Member Data for Subcollection
        const memberData = {
            id: uid,
            nickname: userData.nickname || 'Unknown User',
            photoURL: userData.photoURL || '/anonymous-user.png',
            role: userData.role || 'member',
            joinedAt: userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // 2. Add/Update in members subcollection
        const memberRef = membersSubRef.doc(uid);
        batch.set(memberRef, memberData, { merge: true });

        // 3. Add to joinedGroups in user document
        const userRef = db.collection('users').doc(uid);
        batch.update(userRef, {
            joinedGroups: admin.firestore.FieldValue.arrayUnion(groupId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        count++;

        // Commit batch if it reaches batchSize operations (each user has 2 ops: member sub + user doc)
        // So 225 users per batch max
        if (count % 200 === 0) {
            await batch.commit();
            console.log(`✅ Commited ${count} users (subcollection + user profile)...`);
            batch = db.batch();
        }
    }

    // Commit remaining users
    if (count % 200 !== 0) {
        await batch.commit();
    }

    // 4. Update Group Metadata (memberIds and memberCount)
    console.log(`Finalizing group metadata for "${groupId}"...`);
    await groupDocRef.update({
        memberIds: admin.firestore.FieldValue.arrayUnion(...allUserIds),
        memberCount: totalUsers,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`\n✨ Successfully migrated and synced ${count} users.`);
    console.log(`Group "${groupId}" now has ${totalUsers} members in metadata.`);
}

syncFreestyleTangoMembership().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
