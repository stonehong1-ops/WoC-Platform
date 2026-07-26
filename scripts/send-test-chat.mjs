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

async function main() {
  console.log("🔍 Stone Hong 유저 (UID: E4w5SqJ0nBTHfOkvj5yey6GpYbt2) 로드 중...");
  const userDocRef = db.collection("users").doc("E4w5SqJ0nBTHfOkvj5yey6GpYbt2");
  const userSnap = await userDocRef.get();

  if (!userSnap.exists) {
    console.error("❌ Stone Hong 유저 문서를 찾을 수 없습니다.");
    return;
  }

  const stoneUserDoc = { id: userSnap.id, ...userSnap.data() };
  const stoneUid = stoneUserDoc.id;
  const stoneName = stoneUserDoc.nickname || stoneUserDoc.displayName || "Stone Hong";
  console.log(`🎯 타겟 유저 완벽 매칭: UID=${stoneUid}, 이름=${stoneName}`);

  // 스톤님과의 1:1 채팅방 찾기 또는 생성
  const roomsSnap = await db.collection("chatRooms").get();
  let targetRoomId = null;

  roomsSnap.docs.forEach(doc => {
    const rData = doc.data();
    if (rData.participants && Array.isArray(rData.participants) && rData.participants.includes(stoneUid)) {
      console.log(`💬 기존 채팅방 발견: ID=${doc.id}, Name=${rData.name || '1:1 채팅방'}`);
      if (!targetRoomId) targetRoomId = doc.id;
    }
  });

  if (!targetRoomId) {
    console.log("➕ 스톤님 전용 1:1 테스트 채팅방 신규 생성 중...");
    const newRoomRef = await db.collection("chatRooms").add({
      type: "private",
      participants: [stoneUid, "system_antigravity_ai"],
      name: "Stonehong 1:1 Test Chat",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastMessageText: "",
      unreadCounts: { [stoneUid]: 0 }
    });
    targetRoomId = newRoomRef.id;
  }

  const timeStr = new Date().toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" });
  const messageText = `[Deep Link Push Test] 🚀 안녕하세요 스톤님! 딥링크 푸시 메시지 테스트입니다. (${timeStr})`;

  console.log(`\n💬 Firestore 채팅 메시지 저장 중... (RoomId: ${targetRoomId})`);

  // 1. 메시지 저장
  const msgRef = await db.collection("chatRooms").doc(targetRoomId).collection("messages").add({
    roomId: targetRoomId,
    senderId: "system_antigravity_ai",
    senderName: "Antigravity AI",
    text: messageText,
    type: "text",
    createdAt: FieldValue.serverTimestamp()
  });

  // 2. 채팅방 상단 갱신 및 안읽은 카운트 증가
  await db.collection("chatRooms").doc(targetRoomId).update({
    lastMessageText: messageText,
    updatedAt: FieldValue.serverTimestamp(),
    [`unreadCounts.${stoneUid}`]: FieldValue.increment(1)
  });

  console.log(`✅ 메시지 저장이 완료되었습니다! MessageId=${msgRef.id}`);

  // 3. FCM Push 알림 발송
  const tokens = stoneUserDoc.fcmTokens || [];
  console.log(`\n📱 등록된 FCM 토큰 개수: ${tokens.length}개 (${tokens.join(', ')})`);

  if (tokens.length === 0) {
    console.warn("⚠️ Stonehong 사용자의 fcmTokens가 없습니다.");
  } else {
    console.log("🚀 FCM Multicast 푸시 알림 전송 개시...");
    const targetUrl = `/chat?roomId=${targetRoomId}`;
    const payload = {
      notification: {
        title: 'Antigravity AI Test',
        body: messageText
      },
      data: {
        url: targetUrl,
        type: 'chat',
        roomId: targetRoomId
      },
      tokens: tokens
    };

    const response = await messaging.sendEachForMulticast(payload);
    console.log(`🎉 FCM 발송 성공 결과: 성공 ${response.successCount}건, 실패 ${response.failureCount}건`);
    if (response.failureCount > 0) {
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          console.error(`- 실패 토큰 [${idx}]: ${res.error?.message}`);
        }
      });
    }
  }

  console.log(`\n✅ 테스트 전송 절차가 성공적으로 완결되었습니다.`);
  console.log(`📌 Target URL: /chat?roomId=${targetRoomId}`);
}

main().catch(console.error);
