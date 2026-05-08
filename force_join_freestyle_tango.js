// Force-add all users to Freestyle Tango group
const admin = require('firebase-admin');
const serviceAccount = require('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function main() {
  // 1. Find Freestyle Tango group
  const groupsSnap = await db.collection('groups').where('name', '==', 'Freestyle Tango').get();
  
  if (groupsSnap.empty) {
    console.log('Freestyle Tango group not found! Trying partial match...');
    const allGroups = await db.collection('groups').get();
    allGroups.forEach(d => console.log(`  - ${d.id}: ${d.data().name}`));
    return;
  }

  const groupDoc = groupsSnap.docs[0];
  const groupId = groupDoc.id;
  const groupData = groupDoc.data();
  console.log(`Found group: ${groupData.name} (${groupId})`);
  console.log(`Current memberIds: ${(groupData.memberIds || []).length}`);

  // 2. Get all users
  const usersSnap = await db.collection('users').get();
  const allUsers = [];
  usersSnap.forEach(d => {
    allUsers.push({ id: d.id, ...d.data() });
  });
  console.log(`Total users: ${allUsers.length}`);

  // 3. Get existing members
  const existingMemberIds = new Set(groupData.memberIds || []);
  console.log(`Already members: ${existingMemberIds.size}`);

  // 4. Add non-members
  let added = 0;
  const chatRoomId = `group_${groupId}`;
  
  for (const user of allUsers) {
    if (existingMemberIds.has(user.id)) {
      console.log(`  SKIP (already member): ${user.nickname || user.displayName || user.id}`);
      continue;
    }

    // Add to members subcollection
    await db.collection('groups').doc(groupId).collection('members').doc(user.id).set({
      role: 'member',
      status: 'active',
      joinedAt: admin.firestore.Timestamp.now(),
      nickname: user.nickname || user.displayName || '',
      photoURL: user.photoURL || ''
    });

    // Add to group memberIds array
    await db.collection('groups').doc(groupId).update({
      memberIds: admin.firestore.FieldValue.arrayUnion(user.id),
      memberCount: admin.firestore.FieldValue.increment(1)
    });

    // Add to user's joinedGroups
    await db.collection('users').doc(user.id).update({
      joinedGroups: admin.firestore.FieldValue.arrayUnion(groupId)
    });

    // Add to chat room participants
    await db.collection('chat_rooms').doc(chatRoomId).update({
      participants: admin.firestore.FieldValue.arrayUnion(user.id)
    });

    added++;
    console.log(`  ADDED: ${user.nickname || user.displayName || user.id}`);
  }

  console.log(`\nDone! Added ${added} new members to Freestyle Tango.`);
  
  // Print final state
  const updatedGroup = await db.collection('groups').doc(groupId).get();
  console.log(`Final member count: ${updatedGroup.data().memberCount}`);
}

main().catch(console.error);
