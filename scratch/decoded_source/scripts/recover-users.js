const admin = require('firebase-admin');

async function recoverUsers() {
    console.log('Initializing Firebase Apps...');
    
    // Initialize apps for both projects
    const sourceApp = admin.initializeApp({
        projectId: 'freestyle-tango-seoul'
    }, 'source');

    const targetApp = admin.initializeApp({
        projectId: 'woc-platform-seoul-1234'
    }, 'target');

    const sourceDb = sourceApp.firestore();
    const targetDb = targetApp.firestore();

    console.log('Fetching source users (Freestyle)...');
    const sourceSnapshot = await sourceDb.collection('users').get();
    const sourceUsers = {};
    sourceSnapshot.forEach(doc => {
        sourceUsers[doc.id] = doc.data();
    });
    console.log(`Loaded ${Object.keys(sourceUsers).length} source users.`);

    console.log('Fetching target users (WOC)...');
    const targetSnapshot = await targetDb.collection('users').get();
    
    const updates = [];
    const corruptedUids = [];

    targetSnapshot.forEach(doc => {
        const data = doc.data();
        const uid = doc.id;
        const normId = uid.startsWith('+82') ? '0' + uid.substring(3) : uid;

        // Condition for corruption: missing nickname
        if (!data.nickname) {
            const source = sourceUsers[normId];
            if (source) {
                const changes = {
                    nickname: source.nickname,
                    role: source.role || 'member',
                    createdAt: source.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                    device: source.device || 'unknown',
                    phoneNumber: uid,
                    legacyPhone: normId,
                    countryCode: 'KR',
                    isRegistered: false,
                    migratedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                // Add photo if source has one and target is empty or anonymous
                if (source.photoURL && (!data.photoURL || data.photoURL.includes('anonymous'))) {
                    changes.photoURL = source.photoURL;
                }
                
                if (source.isInstructor !== undefined) {
                    changes.isInstructor = source.isInstructor;
                }

                updates.push({ uid, changes });
                corruptedUids.push(uid);
            }
        }
    });

    console.log(`Identified ${updates.length} users to recover.`);

    if (updates.length === 0) {
        console.log('No users need recovery.');
        return;
    }

    const batch = targetDb.batch();
    let count = 0;

    for (const update of updates) {
        const userRef = targetDb.collection('users').doc(update.uid);
        batch.set(userRef, update.changes, { merge: true });
        count++;

        if (count % 400 === 0) {
            await batch.commit();
            console.log(`Committed ${count} updates...`);
        }
    }

    if (count % 400 !== 0) {
        await batch.commit();
    }

    console.log(`Successfully recovered ${count} users.`);
}

recoverUsers().catch(err => {
    console.error('Recovery failed:', err);
    process.exit(1);
});
