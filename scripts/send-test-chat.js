const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error("Missing firebase env vars!");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId.trim(),
      clientEmail: clientEmail.trim(),
      privateKey: privateKey.replace(/\\n/g, '\n').trim(),
    }),
  });
}

const db = admin.firestore();

async function main() {
  console.log("Searching for Stonehong user...");
  const usersSnap = await db.collection('users').get();
  let stoneUser = null;

  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    const nickname = (data.nickname || data.displayName || data.name || '').toLowerCase();
    if (nickname.includes('stone') || nickname.includes('홍') || doc.id.includes('stone')) {
      console.log(`Found candidate: ID=${doc.id}, Name=${data.nickname || data.displayName}, FCM Tokens=${data.fcmTokens?.length || 0}`);
      if (!stoneUser || nickname.includes('stonehong')) {
        stoneUser = { id: doc.id, ...data };
      }
    }
  });

  if (!stoneUser) {
    console.error("Stonehong user not found! Printing all users:");
    usersSnap.docs.forEach(doc => {
      const d = doc.data();
      console.log(`- ${doc.id}: ${d.nickname || d.displayName} (${d.fcmTokens?.length || 0} tokens)`);
    });
    return;
  }

  console.log(`Targeting Stonehong: UID=${stoneUser.id}, Name=${stoneUser.nickname || stoneUser.displayName}`);

  // Find or create chat room for Stonehong
  const roomsSnap = await db.collection('chatRooms').get();
  let targetRoomId = null;

  roomsSnap.docs.forEach(doc => {
    const rData = doc.data();
    if (rData.participants && Array.isArray(rData.participants) && rData.participants.includes(stoneUser.id)) {
      console.log(`Found existing room: ID=${doc.id}, Name=${rData.name || 'Private'}`);
      if (!targetRoomId) targetRoomId = doc.id;
    }
  });

  if (!targetRoomId) {
    console.log("No existing chat room found for Stonehong. Creating a new test room...");
    const newRoomRef = await db.collection('chatRooms').add({
      type: 'private',
      participants: [stoneUser.id, 'system_test_sender'],
      name: 'Deep Link Test Chat',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageText: '',
      unreadCounts: { [stoneUser.id]: 0 }
    });
    targetRoomId = newRoomRef.id;
  }

  console.log(`Sending test chat message to Room ID: ${targetRoomId}`);

  const messageText = `[Deep Link Push Test] 🚀 안녕하세요 스톤님! 딥링크 푸시 메시지 테스트입니다. (${new Date().toLocaleTimeString()})`;

  // Add message to chatRooms/{targetRoomId}/messages
  const msgRef = await db.collection('chatRooms').doc(targetRoomId).collection('messages').add({
    roomId: targetRoomId,
    senderId: 'system_test_sender',
    senderName: 'Antigravity AI Test',
    text: messageText,
    type: 'text',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Update room lastMessage
  await db.collection('chatRooms').doc(targetRoomId).update({
    lastMessageText: messageText,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Message added to Firestore. ID=${msgRef.id}`);

  // Send FCM Push Notification
  const tokens = stoneUser.fcmTokens || [];
  if (tokens.length === 0) {
    console.warn("⚠️ Stonehong user has no fcmTokens registered in Firestore. Push notification cannot be sent to native device until token is registered.");
  } else {
    console.log(`Sending FCM Multicast to ${tokens.length} tokens...`);
    const payload = {
      notification: {
        title: 'Antigravity AI Test',
        body: messageText
      },
      data: {
        url: `/chat?roomId=${targetRoomId}`,
        type: 'chat',
        roomId: targetRoomId
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`FCM Multicast result: Success=${response.successCount}, Failure=${response.failureCount}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
