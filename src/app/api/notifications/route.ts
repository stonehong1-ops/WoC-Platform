import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase Admin SDK 초기화 (중복 초기화 방지)
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
      console.error('Firebase Admin 초기화 오류:', error.stack);
    }
  } else {
    console.warn('Firebase Admin 환경 변수가 누락되어 초기화를 건너뜁니다.');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targets, tokens, title, message, data, unreadCount } = body;

    // 1. 사용자별 개별 target 묶음 처리 (그룹 채팅 및 개별 사용자 Badge Count 오염 방지)
    const targetList: Array<{ tokens: string[]; unreadCount?: number }> = [];

    if (Array.isArray(targets) && targets.length > 0) {
      targets.forEach(t => {
        if (t.tokens && Array.isArray(t.tokens) && t.tokens.length > 0) {
          targetList.push({
            tokens: t.tokens,
            unreadCount: typeof t.unreadCount === 'number' ? t.unreadCount : 0
          });
        }
      });
    } else if (Array.isArray(tokens) && tokens.length > 0) {
      // 단일 사용자/단일 묶음 요청 하위 호환
      targetList.push({
        tokens: tokens,
        unreadCount: typeof unreadCount === 'number' ? unreadCount : 0
      });
    }

    if (targetList.length === 0) {
      return NextResponse.json({ error: 'No tokens or targets provided' }, { status: 400 });
    }

    // 2. 수신자 사용자별로 개별 FCM Message 생성
    const messagesToSend: admin.messaging.Message[] = [];
    const allTokensMap: string[] = [];

    targetList.forEach(target => {
      const badgeVal = Math.max(0, target.unreadCount || 0);

      target.tokens.forEach(token => {
        allTokensMap.push(token);
        messagesToSend.push({
          token: token,
          notification: {
            title: title || '알림',
            body: message || '',
          },
          data: data || {},
          android: {
            notification: {
              notificationCount: badgeVal
            }
          },
          apns: {
            payload: {
              aps: {
                badge: badgeVal
              }
            }
          }
        });
      });
    });

    if (messagesToSend.length === 0) {
      return NextResponse.json({ error: 'No valid message targets created' }, { status: 400 });
    }

    // sendEach를 사용하여 각 사용자별 독립 payload(badgeCount)로 전송
    const response = await admin.messaging().sendEach(messagesToSend);
    
    // 3. 무효/만료 토큰 자동 정리
    const failedTokens: any[] = [];
    const invalidTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          const targetToken = allTokensMap[idx];
          failedTokens.push({
            token: targetToken,
            error: resp.error?.message,
            code: errorCode
          });
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/invalid-argument'
          ) {
            invalidTokens.push(targetToken);
          }
        }
      });

      if (invalidTokens.length > 0) {
        try {
          const firestore = admin.firestore();
          const usersSnap = await firestore.collection('users')
            .where('fcmTokens', 'array-contains-any', invalidTokens.slice(0, 10))
            .get();

          const batch = firestore.batch();
          usersSnap.docs.forEach(userDoc => {
            const currentTokens: string[] = userDoc.data().fcmTokens || [];
            const cleaned = currentTokens.filter(t => !invalidTokens.includes(t));
            batch.update(userDoc.ref, { fcmTokens: cleaned });
          });
          await batch.commit();
        } catch (cleanupErr) {
          console.error('Failed to cleanup invalid tokens:', cleanupErr);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokensCleaned: invalidTokens.length,
      failedTokens 
    });
  } catch (error: any) {
    console.error('Push notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
