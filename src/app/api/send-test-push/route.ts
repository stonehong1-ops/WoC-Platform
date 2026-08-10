import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { requireAdmin, AdminAuthError } from '@/lib/server/adminAuth';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId.trim(),
          clientEmail: clientEmail.trim(),
          privateKey: privateKey.replace(/\\n/g, '\n').trim(),
        }),
      });
    } catch (error: any) {
      console.error('Firebase Admin 초기화 오류:', error);
    }
  }
}

async function handleSendPush() {
  if (!admin.apps.length) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  const db = admin.firestore();
  const messaging = admin.messaging();

  const userIds = ['ecOxXTUKdBPXc3Xyl4Ok7blq1zA2', 'E4w5SqJ0nBTHfOkvj5yey6GpYbt2'];
  const collectedTokens: string[] = [];

  for (const uid of userIds) {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const uData = userDoc.data() || {};
      if (uData.fcmToken) collectedTokens.push(uData.fcmToken);
      if (Array.isArray(uData.fcmTokens)) {
        uData.fcmTokens.forEach((t: string) => {
          if (t && !collectedTokens.includes(t)) collectedTokens.push(t);
        });
      }
    }
  }

  const roomId = 'test_stony_push';
  const roomRef = db.collection('chatRooms').doc(roomId);

  await roomRef.set({
    id: roomId,
    type: 'personal',
    title: '💬 스톤님 테스트 대화방',
    participants: [...userIds, 'system_agent'],
    participantDetails: {
      system_agent: { name: 'WoC AI Assistant', avatar: 'https://www.woc.today/icon.png' }
    },
    lastMessage: '스톤님, 테스트 챗 메시지가 발송되었습니다! 클릭하여 진입해 보세요.',
    lastMessageAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCounts: {
      'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2': 1,
      'E4w5SqJ0nBTHfOkvj5yey6GpYbt2': 1
    }
  }, { merge: true });

  const msgRef = await roomRef.collection('messages').add({
    senderId: 'system_agent',
    senderName: 'WoC AI Assistant',
    text: '👋 스톤님! 실시간 테스트 챗 메시지입니다.\n\n이 챗방에서 상단 닫기 또는 뒤로가기 버튼을 누르시면 챗 목록 화면(/chat)으로 이동하는지 테스트하실 수 있습니다.',
    createdAt: new Date().toISOString(),
    readBy: ['system_agent']
  });

  let pushSentCount = 0;
  if (collectedTokens.length > 0) {
    for (const token of collectedTokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: '💬 WoC 테스트 챗 도착',
            body: '스톤님, 실시간 테스트 메시지가 도착했습니다! 클릭하여 대화방으로 진입하세요.'
          },
          data: {
            url: `https://www.woc.today/chat?roomId=${roomId}`,
            roomId: roomId
          },
          webpush: {
            fcmOptions: {
              link: `https://www.woc.today/chat?roomId=${roomId}`
            }
          }
        });
        pushSentCount++;
      } catch (e) {
        console.error('Failed to send FCM token:', token, e);
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Test push and chat room created successfully!',
    roomId,
    messageId: msgRef.id,
    tokensFoundCount: collectedTokens.length,
    pushSentCount,
    testUrl: `https://www.woc.today/chat?roomId=${roomId}`
  });
}

async function guarded(request: Request) {
  try {
    await requireAdmin(request);
    return await handleSendPush();
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function GET(request: Request) {
  return guarded(request);
}

export async function POST(request: Request) {
  return guarded(request);
}
