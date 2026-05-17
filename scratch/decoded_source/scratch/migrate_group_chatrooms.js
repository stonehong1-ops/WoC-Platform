/**
 * Migration Script: Create chat rooms for all 66 existing groups
 * Each group gets a 1:1 mapped chat room with ID: group_{groupId}
 */
const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrateGroupChatRooms() {
  console.log('=== Starting Group Chat Room Migration ===\n');

  // 1. Get all groups
  const groupsSnapshot = await db.collection('groups').get();
  console.log(`Found ${groupsSnapshot.size} groups to process.\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const groupDoc of groupsSnapshot.docs) {
    const groupId = groupDoc.id;
    const groupData = groupDoc.data();
    const chatRoomId = `group_${groupId}`;

    try {
      // Check if chat room already exists
      const existingRoom = await db.collection('chat_rooms').doc(chatRoomId).get();
      if (existingRoom.exists) {
        console.log(`  [SKIP] ${chatRoomId} - already exists`);
        skipped++;
        continue;
      }

      // Determine joinPolicy from group's membershipPolicy
      const joinStrategy = groupData.membershipPolicy?.joinStrategy || 'open';

      // Also get existing members to add as participants
      const membersSnapshot = await db.collection('groups').doc(groupId).collection('members')
        .where('status', '==', 'active').get();
      const memberIds = membersSnapshot.docs.map(doc => doc.id);

      // Create the chat room
      await db.collection('chat_rooms').doc(chatRoomId).set({
        name: groupData.name || groupId,
        type: 'groups',
        participants: memberIds,  // Add existing active members
        linkedGroupId: groupId,
        admins: [groupData.ownerId || 'system1'],
        joinPolicy: joinStrategy,
        imageUrl: groupData.coverImage || '',
        description: groupData.description || '',
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: `Welcome to ${groupData.name || groupId} group chat!`,
      });

      console.log(`  [CREATE] ${chatRoomId} - "${groupData.name}" (owner: ${groupData.ownerId}, joinPolicy: ${joinStrategy}, members: ${memberIds.length})`);
      created++;

    } catch (err) {
      console.error(`  [ERROR] ${chatRoomId} - ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`  Total:   ${groupsSnapshot.size}`);
}

migrateGroupChatRooms().catch(console.error);
