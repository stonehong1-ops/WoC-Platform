import admin from './firebaseAdmin';

/**
 * 푸시 발송 권한 검증.
 *
 * 인증만으로는 부족하다. 로그인한 사람이면 누구에게든 임의 문구를 보낼 수 있으면 안 된다.
 * 그렇다고 "같은 방에 있다 / 같은 그룹이다" 같은 관계만 확인하는 것도 약하다.
 * 관계만 보면, 방 번호나 그룹 번호만 맞추면 아무 때나 아무 문구를 밀어넣을 수 있다.
 *
 * 그래서 **실제로 일어난 행동**을 근거로 삼는다. 알림을 유발한 문서(채팅 메시지,
 * 알림 문서)가 존재하고, 그 문서의 작성자가 요청자 본인일 때만 통과시킨다.
 */

/** 사람이 아니라 앱이 남기는 메시지의 발신자 id. */
const SYSTEM_SENDER_ID = 'system';

export type PushContext =
  | { type: 'chat'; roomId?: string; messageId?: string }
  | { type: 'notification'; notificationId?: string }
  | { type: 'self' }
  | { type?: undefined };

export interface PushAuthResult {
  ok: boolean;
  /** 실패 사유 (기계 판독용 짧은 코드) */
  reason: string;
  /** 검증을 통과한 수신자만 남긴 목록 */
  allowedTargets: string[];
}

/**
 * @param senderUid  토큰에서 확인된 발신자. 클라이언트가 주장할 수 없다.
 * @param targets    요청된 수신자 uid 목록
 */
export async function verifyPushContext(
  senderUid: string,
  targets: string[],
  context: PushContext | undefined
): Promise<PushAuthResult> {
  const db = admin.firestore();

  if (!context || !context.type) {
    return { ok: false, reason: 'no_context', allowedTargets: [] };
  }

  // ── 본인에게 보내는 알림 ──
  if (context.type === 'self') {
    const allowed = targets.filter(t => t === senderUid);
    return allowed.length === targets.length
      ? { ok: true, reason: 'self', allowedTargets: allowed }
      : { ok: false, reason: 'self_mismatch', allowedTargets: allowed };
  }

  // ── 채팅 ──
  if (context.type === 'chat') {
    const { roomId, messageId } = context;
    if (!roomId) return { ok: false, reason: 'chat_no_room', allowedTargets: [] };

    const roomSnap = await db.collection('chat_rooms').doc(roomId).get();
    if (!roomSnap.exists) return { ok: false, reason: 'chat_room_missing', allowedTargets: [] };

    const room = roomSnap.data() || {};
    const participants: string[] = Array.isArray(room.participants) ? room.participants : [];

    // 그룹 채팅방은 `participants` 가 비어 있는 경우가 많다(실측 71개 중 56개).
    // 실제 수신 대상은 연결된 그룹의 활성 멤버이므로 그쪽도 함께 봐야 한다.
    const isGroupRoom = ['groups', 'group', 'notice', 'public'].includes(room.type);
    let memberIds: Set<string> | null = null;
    if (isGroupRoom) {
      const groupId = room.linkedGroupId || roomId.replace('group_', '');
      if (groupId) {
        const members = await db
          .collection('groups').doc(groupId).collection('members')
          .where('status', '==', 'active').get();
        memberIds = new Set(members.docs.map(d => d.id));
      }
    }

    const entitled = (uid: string) => participants.includes(uid) || !!memberIds?.has(uid);

    if (!entitled(senderUid)) {
      return { ok: false, reason: 'chat_sender_not_participant', allowedTargets: [] };
    }

    // 방에 속해 있다는 것만으로는 부족하다. 이 발신자가 방금 그 방에 남긴
    // 메시지가 실제로 있어야 알림을 보낼 근거가 된다.
    let verifiedBy = 'chat_no_message_id';
    if (messageId) {
      const msgSnap = await db.collection('chat_messages').doc(messageId).get();
      if (!msgSnap.exists) return { ok: false, reason: 'chat_message_missing', allowedTargets: [] };
      const msg = msgSnap.data() || {};
      if (msg.roomId !== roomId) {
        return { ok: false, reason: 'chat_message_room_mismatch', allowedTargets: [] };
      }
      if (msg.senderId === senderUid) {
        verifiedBy = 'chat_verified';
      } else if (msg.senderId === SYSTEM_SENDER_ID) {
        // 입장 안내 같은 시스템 메시지는 앱이 쓴 것이라 작성자가 사람이 아니다.
        // (실측: 최근 채팅 300건 중 30건) 이 경우엔 방에 속해 있는지로만 판단한다.
        verifiedBy = 'chat_system_message';
      } else {
        return { ok: false, reason: 'chat_not_message_author', allowedTargets: [] };
      }
    }

    // 수신자도 같은 방에 속해 있어야 하고, 자기 자신에게는 보내지 않는다.
    const allowed = targets.filter(t => t !== senderUid && entitled(t));
    return allowed.length === targets.filter(t => t !== senderUid).length
      ? { ok: true, reason: verifiedBy, allowedTargets: allowed }
      : { ok: false, reason: 'chat_target_not_participant', allowedTargets: allowed };
  }

  // ── 알림 문서 기반 (그룹 초대 등) ──
  if (context.type === 'notification') {
    const { notificationId } = context;
    if (!notificationId) return { ok: false, reason: 'notif_no_id', allowedTargets: [] };

    const snap = await db.collection('notifications').doc(notificationId).get();
    if (!snap.exists) return { ok: false, reason: 'notif_missing', allowedTargets: [] };

    const n = snap.data() || {};
    // 알림을 만든 사람이 요청자여야 한다. (본인에게 오는 알림이면 수신자 본인도 허용)
    const isActor = n.fromUserId === senderUid;
    const isOwnNotification = n.targetUserId === senderUid;
    if (!isActor && !isOwnNotification) {
      return { ok: false, reason: 'notif_not_actor', allowedTargets: [] };
    }

    // 그 알림 문서가 가리키는 수신자에게만 보낸다.
    const allowed = targets.filter(t => t === n.targetUserId);
    return allowed.length === targets.length
      ? { ok: true, reason: 'notif_verified', allowedTargets: allowed }
      : { ok: false, reason: 'notif_target_mismatch', allowedTargets: allowed };
  }

  return { ok: false, reason: 'unknown_context', allowedTargets: [] };
}

/**
 * Phase 1(shadow) 관찰 기록.
 *
 * 강제 적용 전에 실제 호출 경로를 파악하기 위한 집계용이다.
 * 알림 제목·본문·푸시 토큰은 남기지 않는다. 남기는 건 어떤 맥락으로 몇 명에게
 * 보내려 했고 검증이 통과했는지뿐이다.
 */
export async function recordPushAuthAudit(entry: {
  senderUid: string;
  contextType: string;
  reason: string;
  passed: boolean;
  targetCount: number;
  path?: string;
}): Promise<void> {
  try {
    // Firestore 는 undefined 를 값으로 받지 않는다. 비어 있는 필드는 아예 빼고 쓴다.
    const clean = Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined));
    await admin.firestore().collection('pushAuthAudit').add({
      ...clean,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // 관찰 기간이 지나면 정리할 수 있도록 만료 시각을 함께 남긴다.
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  } catch (e) {
    // 감사 기록 실패가 알림 발송을 막아서는 안 된다.
    console.error('pushAuthAudit write failed:', e);
  }
}
