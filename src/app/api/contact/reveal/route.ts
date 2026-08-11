import { NextResponse } from 'next/server';
import admin from '@/lib/server/firebaseAdmin';
import { requireUser, AuthError } from '@/lib/server/userAuth';

/**
 * 전화번호 공개 API.
 *
 * 전화번호는 `publicProfiles` 에 두지 않는다. Firestore 는 문서 단위로 읽히므로
 * 공개 projection 에 번호를 넣는 순간, 사용자가 나중에 수신 거부로 바꿔도 이미
 * 내려간 문서에는 번호가 남는다.
 *
 * 그래서 번호는 원본 users 문서에만 두고, "전화 걸기"를 누른 그 순간에
 * 서버가 `allowPhoneCalls` 동의를 확인한 뒤에만 돌려준다.
 */

/** 번호 수집을 막기 위한 발신자별 조회 한도. */
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

async function checkRateLimit(uid: string): Promise<boolean> {
  try {
    const windowId = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
    const ref = admin.firestore().collection('contactRevealLimits').doc(`${uid}_${windowId}`);
    const snap = await ref.get();
    const count = snap.exists ? (snap.data()?.count || 0) : 0;
    if (count >= RATE_LIMIT_MAX) return false;
    await ref.set(
      {
        requesterUid: uid,
        count: admin.firestore.FieldValue.increment(1),
        expiresAt: admin.firestore.Timestamp.fromMillis((windowId + 2) * RATE_LIMIT_WINDOW_MS),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    // 번호 노출과 직결되는 장치이므로, 한도 확인이 실패하면 보수적으로 막는다.
    console.error('Contact reveal rate limit check failed (denying):', e);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const requesterUid = await requireUser(request);
    const { targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // 본인 번호는 굳이 이 경로를 거칠 필요가 없다.
    if (targetUserId === requesterUid) {
      const self = await admin.firestore().collection('users').doc(requesterUid).get();
      const own = self.data()?.phoneNumber || self.data()?.phone || '';
      return own
        ? NextResponse.json({ phoneNumber: own })
        : NextResponse.json({ reason: 'unavailable' }, { status: 404 });
    }

    if (!(await checkRateLimit(requesterUid))) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const snap = await admin.firestore().collection('users').doc(targetUserId).get();
    if (!snap.exists) {
      return NextResponse.json({ reason: 'unavailable' }, { status: 404 });
    }

    const data = snap.data() || {};

    // 기본값은 허용이다 (기존 화면이 `!== false` 로 판단해 왔다).
    if (data.allowPhoneCalls === false) {
      return NextResponse.json({ reason: 'declined' }, { status: 403 });
    }

    const phoneNumber = data.phoneNumber || data.phone || data.contactNumber || '';
    if (!phoneNumber) {
      return NextResponse.json({ reason: 'unavailable' }, { status: 404 });
    }

    return NextResponse.json({ phoneNumber });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Contact reveal error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
