import { NextResponse } from 'next/server';
import admin from '@/lib/server/firebaseAdmin';
import { requireAdmin, AdminAuthError } from '@/lib/server/adminAuth';

/**
 * 관리자 회원 목록 API.
 *
 * 관리자 화면은 email·phoneNumber 같은 원본 정보가 업무상 필요하지만, 그렇다고
 * 브라우저가 users 컬렉션을 직접 구독하게 두면 규칙을 관리자에게 열어야 한다.
 * 조회는 Admin SDK 로 서버에서만 하고, 화면이 실제로 쓰는 필드만 내려준다.
 *
 * fcmTokens 는 원문을 절대 내보내지 않는다. 토큰이 유출되면 해당 기기로 임의
 * 푸시를 보낼 수 있기 때문에, 기기 유형 판별에 필요한 파생값만 만들어 준다.
 */

/** 한 번에 가져올 최대 인원. */
const MAX_LIMIT = 1000;

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get('limit') || MAX_LIMIT);
    const pageSize = Math.min(Math.max(1, limitParam), MAX_LIMIT);

    const snap = await admin.firestore()
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .get();

    const users = snap.docs.map(d => {
      const u = d.data() || {};
      const tokens: string[] = Array.isArray(u.fcmTokens) ? u.fcmTokens : [];

      return {
        id: d.id,
        nickname: u.nickname || '',
        nativeNickname: u.nativeNickname || '',
        photoURL: u.photoURL || '',
        gender: u.gender || '',
        role: u.role || '',
        email: u.email || '',
        phoneNumber: u.phoneNumber || '',
        authMethod: u.authMethod || '',
        platform: u.platform || '',
        accountStatus: u.accountStatus || '',
        isAdmin: u.isAdmin === true,
        isInstructor: u.isInstructor === true,
        isOrganizer: u.isOrganizer === true,
        isDj: u.isDj === true,
        isSeller: u.isSeller === true,
        createdAt: u.createdAt || null,
        lastVisitedAt: u.lastVisitedAt || null,

        // 원문 토큰 대신 파생값만. 기기 유형 표시에는 이 정도면 충분하다.
        hasPushToken: tokens.length > 0,
        deviceCount: tokens.length,
      };
    });

    return NextResponse.json({ users, count: users.length });
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
