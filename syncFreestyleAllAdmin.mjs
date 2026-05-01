import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'woc-platform-seoul-1234'
    });
  } catch (err) {
    console.error("Failed to initialize with default credentials", err);
    process.exit(1);
  }
}

const db = admin.firestore();

const TARGET_GROUP_ID = 'rglqeyjDHzzhbUwuim5O'; // The real Freestyle Tango group ID
const LEGACY_GROUP_IDS = ['freestyle', 'freestyle-tango'];

async function runSync() {
  console.log('Starting comprehensive sync for Freestyle Tango...');
  
  const groupRef = db.collection('groups').doc(TARGET_GROUP_ID);
  const groupSnap = await groupRef.get();
  if (!groupSnap.exists) {
    console.error(`Target group ${TARGET_GROUP_ID} does not exist!`);
    process.exit(1);
  }
  console.log(`Found target group: ${groupSnap.data().name}`);

  const usersSnap = await db.collection('users').get();
  
  let validMemberIds = new Set();
  let updatedUsersCount = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const uid = userDoc.id;
    let joinedGroups = data.joinedGroups || [];
    let originalJoinedGroups = [...joinedGroups];
    
    let needsUpdate = false;

    const hasLegacy = LEGACY_GROUP_IDS.some(id => joinedGroups.includes(id));
    const hasTarget = joinedGroups.includes(TARGET_GROUP_ID);

    if (hasLegacy || hasTarget) {
      validMemberIds.add(uid);
      
      LEGACY_GROUP_IDS.forEach(legacyId => {
        if (joinedGroups.includes(legacyId)) {
          joinedGroups = joinedGroups.filter(id => id !== legacyId);
          needsUpdate = true;
        }
      });

      if (!joinedGroups.includes(TARGET_GROUP_ID)) {
        joinedGroups.push(TARGET_GROUP_ID);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await db.collection('users').doc(uid).update({ joinedGroups });
      console.log(`Updated user ${uid} (${data.name || data.phone}): [${originalJoinedGroups}] -> [${joinedGroups}]`);
      updatedUsersCount++;
    }
  }

  console.log(`Phase 1 Complete: Updated ${updatedUsersCount} users' joinedGroups.`);
  console.log(`Total valid members found: ${validMemberIds.size}`);

  const finalMemberIdsArray = Array.from(validMemberIds);
  await groupRef.update({
    memberIds: finalMemberIdsArray,
    memberCount: finalMemberIdsArray.length
  });
  console.log(`Phase 2 Complete: Updated group document memberIds and memberCount (${finalMemberIdsArray.length}).`);

  const membersRef = groupRef.collection('members');
  const membersSnap = await membersRef.get();
  
  const existingSubcollectionMembers = new Set();
  
  for (const memberDoc of membersSnap.docs) {
    existingSubcollectionMembers.add(memberDoc.id);
  }

  let addedCount = 0;
  let removedCount = 0;

  for (const uid of validMemberIds) {
    if (!existingSubcollectionMembers.has(uid)) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        await membersRef.doc(uid).set({
          uid: uid,
          name: userData.name || userData.phone || 'Unknown User',
          email: userData.email || '',
          profileImageUrl: userData.profileImageUrl || '',
          role: 'member',
          joinedAt: new Date().toISOString()
        });
        addedCount++;
        console.log(`Added user ${uid} to members subcollection.`);
      }
    }
  }

  for (const uid of existingSubcollectionMembers) {
    if (!validMemberIds.has(uid)) {
      await membersRef.doc(uid).delete();
      removedCount++;
      console.log(`Removed invalid user ${uid} from members subcollection.`);
    }
  }

  console.log(`Phase 3 Complete: Added ${addedCount}, Removed ${removedCount} from members subcollection.`);
  
  console.log('Synchronization completed successfully!');
  process.exit(0);
}

runSync().catch(console.error);
