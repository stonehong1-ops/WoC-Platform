import { NextResponse } from 'next/server';
import admin from '@/lib/server/firebaseAdmin';
import { requireUser, AuthError } from '@/lib/server/userAuth';
import { verifyPushContext, recordPushAuthAudit, PushContext } from '@/lib/server/pushAuth';

/**
 * 푸시 발송 API.
 *
 * 이전에는 클라이언트가 상대방의 `users/{uid}.fcmTokens` 를 직접 읽어서 토큰 배열을
 * 그대로 보내왔다. 그 구조에서는 (1) 남의 푸시 토큰이 브라우저까지 내려오고,
 * (2) 토큰만 알면 누구에게든 푸시를 쏠 수 있었다.
 *
 * 이제 클라이언트는 대상 uid 만 보내고, 토큰 조회는 서버에서만 한다.
 * 토큰을 직접 실어 보내는 요청은 거부한다.
 */

/** 한 번의 요청으로 푸시를 보낼 수 있는 최대 인원. 대량 발송 남용을 막는다. */
const MAX_TARGETS = 50;
/** 발신자 1명이 창 시간 안에 보낼 수 있는 최대 요청 수. */
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 1000;

/**
 * 발송 맥락 검증을 실제로 강제할지 여부.
 *
 * 인증만 통과하면 아무 uid 에게나 임의 문구를 보낼 수 있는 구멍이 남아 있어서,
 * 요청마다 "이 알림을 유발한 행동이 실제로 있었는지"를 확인한다.
 * 다만 배포 직후에는 캐시된 옛 클라이언트와 앱 빌드가 맥락 없이 호출한다.
 * 그래서 먼저 검증만 돌려 기록하고(shadow), 호출 경로가 모두 확인된 뒤
 * 환경변수로 차단을 켠다. 되돌릴 때도 재배포가 필요 없다.
 */
const ENFORCE_PUSH_CONTEXT = process.env.PUSH_AUTH_ENFORCE === 'true';

type TargetInput = { userId?: string; unreadCount?: number };

/**
 * 발신자별 요청 수를 세어 과도한 발송을 막는다.
 * 카운터 자체가 실패해도 알림은 막지 않는다(fail-open) — 부가 장치 때문에
 * 정상 알림이 끊기는 편이 더 나쁘다.
 */
async function checkRateLimit(senderUid: string): Promise<boolean> {
  try {
    const windowId = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
    const ref = admin.firestore().collection('pushRateLimits').doc(`${senderUid}_${windowId}`);
    const snap = await ref.get();
    const count = snap.exists ? (snap.data()?.count || 0) : 0;

    if (count >= RATE_LIMIT_MAX) return false;

    await ref.set(
      {
        senderUid,
        count: admin.firestore.FieldValue.increment(1),
        expiresAt: admin.firestore.Timestamp.fromMillis((windowId + 2) * RATE_LIMIT_WINDOW_MS),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('Rate limit check failed (allowing request):', e);
    return true;
  }
}

export async function POST(request: Request) {
  try {
    const senderUid = await requireUser(request);
    const body = await request.json();
    const { targets, targetUserId, title, message, data, unreadCount, context } = body;

    // 토큰을 클라이언트가 실어 보내던 예전 방식은 더 이상 받지 않는다.
    if (body.tokens || (Array.isArray(targets) && targets.some((t: any) => t?.tokens))) {
      return NextResponse.json(
        { error: 'Sending raw FCM tokens is no longer supported. Send target user ids instead.' },
        { status: 400 }
      );
    }

    // 1. 대상 uid 정규화
    const requested: TargetInput[] = Array.isArray(targets) && targets.length > 0
      ? targets
      : targetUserId
        ? [{ userId: targetUserId, unreadCount }]
        : [];

    const byUserId = new Map<string, number>();
    for (const t of requested) {
      if (!t?.userId || typeof t.userId !== 'string') continue;
      byUserId.set(t.userId, typeof t.unreadCount === 'number' ? t.unreadCount : 0);
    }

    if (byUserId.size === 0) {
      return NextResponse.json({ error: 'No target user ids provided' }, { status: 400 });
    }
    if (byUserId.size > MAX_TARGETS) {
      return NextResponse.json(
        { error: `Too many targets (max ${MAX_TARGETS})` },
        { status: 400 }
      );
    }

    if (!(await checkRateLimit(senderUid))) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 2. 발송 맥락 검증.
    //    수신자와의 "관계"만 보지 않는다. 알림을 유발한 문서가 실제로 있고
    //    그 작성자가 요청자 본인인지까지 확인한다.
    const requestedTargets = Array.from(byUserId.keys());
    const auth = await verifyPushContext(
      senderUid,
      requestedTargets,
      context as PushContext | undefined
    );

    await recordPushAuthAudit({
      senderUid,
      contextType: (context as PushContext | undefined)?.type || 'none',
      reason: auth.reason,
      passed: auth.ok,
      targetCount: requestedTargets.length,
      path: typeof data?.type === 'string' ? data.type : undefined,
    });

    if (!auth.ok) {
      if (ENFORCE_PUSH_CONTEXT) {
        return NextResponse.json(
          { error: 'Push not permitted for this context', reason: auth.reason },
          { status: 403 }
        );
      }
      // 관찰 기간에는 막지 않는다. 어떤 경로가 걸리는지만 남긴다.
      console.warn(`[pushAuth:shadow] would block — reason=${auth.reason} sender=${senderUid}`);
    }

    // 강제 모드에서는 검증을 통과한 수신자에게만 보낸다.
    const firestore = admin.firestore();
    const userIds = ENFORCE_PUSH_CONTEXT ? auth.allowedTargets : requestedTargets;
    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        successCount: 0,
        failureCount: 0,
        skipped: { snoozed: 0, noToken: 0, unauthorized: requestedTargets.length },
      });
    }
    const userSnaps = await firestore.getAll(
      ...userIds.map(uid => firestore.collection('users').doc(uid))
    );

    const safeTitle = String(title || '알림').slice(0, MAX_TITLE_LENGTH);
    const safeMessage = String(message || '').slice(0, MAX_MESSAGE_LENGTH);

    const messagesToSend: admin.messaging.Message[] = [];
    const tokenByIndex: string[] = [];
    let snoozedCount = 0;
    let noTokenCount = 0;

    for (const snap of userSnaps) {
      if (!snap.exists) { noTokenCount++; continue; }
      const userData = snap.data() || {};

      // 알림 일시중지 여부도 서버에서 판단한다 (예전에는 클라이언트가 확인했다).
      const snoozedUntil = userData.notificationSnoozedUntil;
      if (snoozedUntil) {
        const until = typeof snoozedUntil.toDate === 'function'
          ? snoozedUntil.toDate()
          : new Date(snoozedUntil);
        if (until > new Date()) { snoozedCount++; continue; }
      }

      const tokens: string[] = Array.isArray(userData.fcmTokens) ? userData.fcmTokens : [];
      const uniqueTokens = Array.from(new Set(tokens.filter(t => typeof t === 'string' && t)));
      if (uniqueTokens.length === 0) { noTokenCount++; continue; }

      const badgeVal = Math.max(0, byUserId.get(snap.id) || 0);

      for (const token of uniqueTokens) {
        tokenByIndex.push(token);
        messagesToSend.push({
          token,
          notification: { title: safeTitle, body: safeMessage },
          data: data || {},
          android: {
            notification: {
              icon: 'ic_notification_tango',
              channelId: 'default',
              notificationCount: badgeVal,
            },
          },
          apns: { payload: { aps: { badge: badgeVal } } },
        });
      }
    }

    if (messagesToSend.length === 0) {
      // 보낼 대상이 없는 것은 오류가 아니다 (토큰 미등록 / 알림 일시중지).
      return NextResponse.json({
        success: true,
        successCount: 0,
        failureCount: 0,
        skipped: { snoozed: snoozedCount, noToken: noTokenCount },
      });
    }

    const response = await admin.messaging().sendEach(messagesToSend);

    // 3. 무효/만료 토큰 자동 정리
    const failedTokens: any[] = [];
    const invalidTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (resp.success) return;
        const errorCode = resp.error?.code;
        const targetToken = tokenByIndex[idx];
        // 실패 토큰 문자열은 응답에 담지 않는다. 발신자가 수신자의 기기 토큰을
        // 알게 되면 안 된다. 원인 코드만 돌려준다.
        failedTokens.push({ code: errorCode });
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(targetToken);
        }
      });

      if (invalidTokens.length > 0) {
        try {
          const batch = firestore.batch();
          for (const snap of userSnaps) {
            if (!snap.exists) continue;
            const current: string[] = snap.data()?.fcmTokens || [];
            const cleaned = current.filter(t => !invalidTokens.includes(t));
            if (cleaned.length !== current.length) {
              batch.update(snap.ref, { fcmTokens: cleaned });
            }
          }
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
      skipped: { snoozed: snoozedCount, noToken: noTokenCount },
      failedTokens,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Push notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
