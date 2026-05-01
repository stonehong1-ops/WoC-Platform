import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase Admin SDK 초기화 (중복 초기화 방지)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
        // 개행 문자가 이스케이프되어 들어오는 경우를 처리
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
      }),
    });
  } catch (error: any) {
    console.error('Firebase Admin 초기화 오류:', error.stack);
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
    
    // 실패한 토큰 정리 로직 등을 추가할 수 있습니다.
    const failedTokens: any[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            error: resp.error?.message,
            code: resp.error?.code
          });
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens 
    });
  } catch (error: any) {
    console.error('Push notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
