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
    const { tokens, title, message, data } = body;

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
    }

    const payload = {
      notification: {
        title: title || '알림',
        body: message || '',
      },
      data: data || {},
      tokens: tokens,
    };

    // sendEachForMulticast를 사용하여 여러 디바이스 토큰에 한 번에 전송
    const response = await admin.messaging().sendEachForMulticast(payload);
    
    // 실패한 토큰 자동 정리 — 만료/무효 토큰은 Firestore에서 삭제
    const failedTokens: any[] = [];
    const invalidTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          failedTokens.push({
            token: tokens[idx],
            error: resp.error?.message,
            code: errorCode
          });
          // 무효 토큰 식별 (만료, 미등록, 잘못된 인수)
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/invalid-argument'
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      // 무효 토큰 일괄 정리
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
