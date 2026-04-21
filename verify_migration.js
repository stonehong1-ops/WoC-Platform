const admin = require('firebase-admin');

// Initialize with the current project
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'woc-platform-seoul-1234'
    });
}

const db = admin.firestore();

async function verify() {
    console.log('--- Verification Start ---');
    
    // 1. Check users collection
    const usersSnapshot = await db.collection('users').get();
    console.log(`Total users in 'users' collection: ${usersSnapshot.size}`);
    
    // 2. Check members collection
    const membersSnapshot = await db.collection('groups/freestyle-tango/members').get();
    console.log(`Total members in 'groups/freestyle-tango/members': ${membersSnapshot.size}`);
    
    // 3. Find discrepancies
    const userIds = new Set();
    usersSnapshot.forEach(doc => userIds.add(doc.id));
    
    const memberIds = new Set();
    membersSnapshot.forEach(doc => memberIds.add(doc.id));
    
    const onlyInUsers = [...userIds].filter(id => !memberIds.has(id));
    const onlyInMembers = [...memberIds].filter(id => !userIds.has(id));
    
    console.log(`\nUsers with no membership: ${onlyInUsers.length}`);
    if (onlyInUsers.length > 0) {
        console.log(`Sample: ${onlyInUsers.slice(0, 5).join(', ')}`);
    }
    
    console.log(`Members with no user profile: ${onlyInMembers.length}`);
    if (onlyInMembers.length > 0) {
        console.log(`Sample: ${onlyInMembers.slice(0, 5).join(', ')}`);
    }
    
    // 4. Check for migratedAt flag
    let migratedCount = 0;
    usersSnapshot.forEach(doc => {
        if (doc.data().migratedAt) migratedCount++;
    });
    console.log(`\nUsers with 'migratedAt' flag: ${migratedCount}`);
    
    console.log('--- Verification End ---');
}

verify().catch(console.error);
