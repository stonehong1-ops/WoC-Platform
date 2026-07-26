import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const messaging = getMessaging();

const SENDER_UID = "ecOxXTUKdBPXc3Xyl4Ok7blq1zA2"; // StoneAdmin
const RECEIVER_UID = "E4w5SqJ0nBTHfOkvj5yey6GpYbt2"; // Stone Hong

async function main() {
  console.log("🔍 발신자 (StoneAdmin) 및 수신자 (Stone Hong) 로드 중...");
  
  const [senderSnap, receiverSnap] = await Promise.all([
    db.collection("users").doc(SENDER_UID).get(),
    db.collection("users").doc(RECEIVER_UID).get()
  ]);

  if (!senderSnap.exists || !receiverSnap.exists) {
    console.error("❌ 유저 문서를 찾을 수 없습니다.");
    return;
  }

  const senderData = senderSnap.data();
  const receiverData = receiverSnap.data();

  const senderName = senderData.nickname || senderData.displayName || "StoneAdmin";
  const receiverName = receiverData.nickname || receiverData.displayName || "Stone Hong";

  console.log(`👤 발신자: ${senderName} (${SENDER_UID})`);
  console.log(`🎯 수신자: ${receiverName} (${RECEIVER_UID}) - FCM 토큰 ${receiverData.fcmTokens?.length || 0}개`);

  // 두 유저 간 1:1 채팅방 찾기 또는 생성
  const roomsSnap = await db.collection("chatRooms").get();
  let targetRoomId = null;

  roomsSnap.docs.forEach(doc => {
    const rData = doc.data();
    if (
      rData.type === 'private' &&
      rData.participants &&
      Array.isArray(rData.participants) &&
      rData.participants.includes(SENDER_UID) &&
      rData.participants.includes(RECEIVER_UID)
    ) {
      console.log(`💬 기존 1:1 채팅방 발견: ID=${doc.id}`);
      targetRoomId = doc.id;
    }
  });

  if (!targetRoomId) {
    console.log("➕ StoneAdmin ↔ Stone Hong 간 1:1 채팅방 신규 생성 중...");
    const newRoomRef = await db.collection("chatRooms").add({
      type: "private",
      participants: [SENDER_UID, RECEIVER_UID],
      name: `${senderName}, ${receiverName}`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastMessageText: "",
      unreadCounts: { [SENDER_UID]: 0, [RECEIVER_UID]: 0 }
    });
    targetRoomId = newRoomRef.id;
  }

  const timeStr = new Date().toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" });
  const messageText = `StoneAdmin님의 메시지: 🚀 안녕하세요 스톤님! T 아이콘 & 사용자별 뱃지 푸시 테스트 메시지입니다. (${timeStr})`;

  console.log(`\n💬 Firestore 채팅 메시지 저장을 진행합니다. (RoomId: ${targetRoomId})`);

  // 1. 메시지 저장
  const msgRef = await db.collection("chatRooms").doc(targetRoomId).collection("messages").add({
    roomId: targetRoomId,
    senderId: SENDER_UID,
    senderName: senderName,
    text: messageText,
    type: "text",
    createdAt: FieldValue.serverTimestamp()
  });

  // 2. 채팅방 상단 갱신 및 안읽은 카운트 증가
  await db.collection("chatRooms").doc(targetRoomId).update({
    lastMessageText: messageText,
    updatedAt: FieldValue.serverTimestamp(),
    [`unreadCounts.${RECEIVER_UID}`]: FieldValue.increment(1)
  });

  // 3. 최신 unreadCount 조회
  const updatedRoomSnap = await db.collection("chatRooms").doc(targetRoomId).get();
  const currentUnreadCount = updatedRoomSnap.data()?.unreadCounts?.[RECEIVER_UID] || 1;

  console.log(`✅ 메시지 저장 완료 (MessageId: ${msgRef.id}), 수신자 unreadCount = ${currentUnreadCount}`);

  // 4. FCM 사용자별 개별 푸시 발송
  const tokens = receiverData.fcmTokens || [];
  if (tokens.length === 0) {
    console.warn("⚠️ 수신자 Stone Hong의 fcmTokens가 없습니다.");
    return;
  }

  console.log(`🚀 FCM 수신자 전용 사용자별 Badge (${currentUnreadCount}) Multicast 푸시 발송 개시...`);

  const messagesToSend = tokens.map(token => ({
    token: token,
    notification: {
      title: senderName,
      body: messageText
    },
    data: {
      url: `/chat?roomId=${targetRoomId}`,
      type: 'chat',
      roomId: targetRoomId
    },
    android: {
      notification: {
        icon: 'ic_notification_tango',
        notificationCount: currentUnreadCount
      }
    },
    apns: {
      payload: {
        aps: {
          badge: currentUnreadCount
        }
      }
    }
  }));

  const response = await messaging.sendEach(messagesToSend);
  console.log(`🎉 FCM 발송 성공 결과: 성공 ${response.successCount}건, 실패 ${response.failureCount}건`);

  if (response.failureCount > 0) {
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        console.error(`- 실패 토큰 [${idx}]: ${res.error?.message}`);
      }
    });
  }

  console.log(`\n✅ StoneAdmin ➔ Stone Hong 테스트 푸시 발송이 완결되었습니다.`);
  console.log(`📌 Target URL: /chat?roomId=${targetRoomId}`);
}

main().catch(console.error);
