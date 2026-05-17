const admin = require('firebase-admin');

async function rebuildMembers() {
    console.log('Initializing Firebase App...');
    
    // Check if already initialized to avoid errors
    if (admin.apps.length === 0) {
        admin.initializeApp({
            projectId: 'woc-platform-seoul-1234'
        });
    }

    const db = admin.firestore();
    const groupId = 'freestyle-tango';
    const groupRef = db.collection('groups').doc(groupId);
    const membersRef = groupRef.collection('members');

    console.log('--- Phase 1: Cleaning up existing members ---');
    
    const existingMembersSnapshot = await membersRef.get();
    console.log(`Found ${existingMembersSnapshot.size} existing members to delete.`);
    
    let deleteBatch = db.batch();
    let deleteCount = 0;
    
    for (const doc of existingMembersSnapshot.docs) {
        deleteBatch.delete(doc.ref);
        deleteCount++;
        
        if (deleteCount % 400 === 0) {
            await deleteBatch.commit();
            console.log(`Deleted ${deleteCount} members...`);
            deleteBatch = db.batch();
        }
    }
    
    if (deleteCount % 400 !== 0) {
        await deleteBatch.commit();
        console.log(`Finished deleting ${deleteCount} members.`);
    }

    console.log('Clearing legacy "members" array field in group document...');
    await groupRef.update({
        members: admin.firestore.FieldValue.delete()
    });

    console.log('--- Phase 2: Rebuilding members from "users" collection ---');
    
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users in total.`);

    let addBatch = db.batch();
    let addCount = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        // Skip users without a nickname if any (though they should all have one now)
        const nickname = userData.nickname || 'Unknown';
        const nativeNickname = userData.nativeNickname || '';

        const memberData = {
            nickname: nickname,
            nativeNickname: nativeNickname,
            photoURL: userData.photoURL || '/anonymous-user.png',
            role: 'member', // All set to 'member' as requested
            joinedAt: userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            phoneNumber: userData.phoneNumber || uid
        };

        const memberRef = membersRef.doc(uid);
        addBatch.set(memberRef, memberData);
        addCount++;

        if (addCount % 400 === 0) {
            await addBatch.commit();
            console.log(`Added ${addCount} members...`);
            addBatch = db.batch();
        }
    }

    if (addCount % 400 !== 0) {
        await addBatch.commit();
    }

    console.log(`Successfully added ${addCount} members.`);

    console.log('--- Phase 3: Finalizing ---');
    console.log(`Updating group memberCount to ${addCount}...`);
    await groupRef.update({
        memberCount: addCount
    });

    console.log('Rebuild complete!');
}

rebuildMembers().catch(err => {
    console.error('Rebuild failed:', err);
    process.exit(1);
});
