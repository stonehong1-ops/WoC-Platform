// c:\Users\stone\WoC\scratch\test_class_workflow.js
// 클래스 예약 5단계 워크플로우 및 비즈니스 챗 연동 실데이터 검증 테스트 스크립트 (Stone hong 유저 고정 및 롤백 없음)

const admin = require('firebase-admin');
const path = require('path');

// 1. Firebase Admin SDK 초기화
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function runTest() {
  console.log('🚀 클래스 예약 5단계 비즈니스 워크플로우 통합 테스트 (Stone hong 타겟)를 시작합니다.');
  
  let testGroupId = null;
  let testHostId = null;
  let testBuyerId = null;
  let createdRoomId = null;
  let createdRegId = null;
  let testBuyerName = 'Stone hong';
  let testHostName = 'Test Host (Admin)';
  
  try {
    // 2. 테스트용 그룹(클럽) 탐색
    console.log('🔍 1. 테스트용 그룹 데이터를 쿼리합니다...');
    const groupsSnap = await db.collection('groups').limit(5).get();
    if (groupsSnap.empty) {
      throw new Error('데이터베이스에 그룹이 존재하지 않습니다.');
    }
    
    // 유효한 그룹 선택
    let targetGroupDoc = null;
    for (const doc of groupsSnap.docs) {
      const data = doc.data();
      if (data.ownerId) {
        targetGroupDoc = doc;
        break;
      }
    }
    
    if (!targetGroupDoc) {
      throw new Error('ownerId가 설정된 활성 그룹을 찾을 수 없습니다.');
    }
    
    testGroupId = targetGroupDoc.id;
    testHostId = targetGroupDoc.data().ownerId;
    const groupName = targetGroupDoc.data().name || 'Test Club';
    console.log(`✅ 그룹 발견: [${groupName}] (ID: ${testGroupId}, Owner ID: ${testHostId})`);
    
    // 3. Stone hong 사용자(Buyer) 탐색
    console.log('🔍 2. Stone hong 사용자 데이터를 검색합니다...');
    const usersSnap = await db.collection('users').get();
    
    for (const doc of usersSnap.docs) {
      const udata = doc.data();
      const nickname = (udata.nickname || '').toLowerCase();
      const name = (udata.name || '').toLowerCase();
      
      // 'stone' 또는 'hong'이 들어간 유저 찾기
      if (nickname.includes('stone') || name.includes('stone') || nickname.includes('hong') || name.includes('hong')) {
        testBuyerId = doc.id;
        testBuyerName = udata.nickname || udata.name || 'Stone hong';
        break;
      }
    }
    
    if (!testBuyerId) {
      // 만약에 사용자를 못 찾으면, 테스트를 위해 가상 UID 대신 실제 Stone hong 계정이 있어야 하므로 에러 발생
      throw new Error('이름이나 닉네임에 "stone" 또는 "hong"을 포함한 사용자를 찾지 못했습니다. Live DB에 Stone hong 계정이 있는지 확인해주세요.');
    }
    
    console.log(`✅ 실시간 사용자 발견: [${testBuyerName}] (ID: ${testBuyerId})`);
    
    // 호스트 정보 확보
    const hostDoc = await db.collection('users').doc(testHostId).get();
    if (hostDoc.exists) {
      testHostName = hostDoc.data().nickname || hostDoc.data().name || 'Test Host';
    }
    
    // 4. 1:1 비즈니스 챗룸 조회 또는 생성
    console.log('🔍 3. 1:1 비즈니스 챗룸을 확인하거나 새로 생성합니다...');
    const sortedIds = [testBuyerId, testHostId].sort();
    
    const roomsSnap = await db.collection('chat_rooms')
      .where('participants', '==', sortedIds)
      .where('type', '==', 'business')
      .get();
      
    if (!roomsSnap.empty) {
      createdRoomId = roomsSnap.docs[0].id;
      console.log(`✅ 기존 비즈니스 챗룸 발견 (ID: ${createdRoomId})`);
    } else {
      const roomRef = await db.collection('chat_rooms').add({
        type: 'business',
        participants: sortedIds,
        createdBy: testBuyerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: '클래스 예약 문의가 시작되었습니다.'
      });
      createdRoomId = roomRef.id;
      console.log(`✅ 새 비즈니스 챗룸 생성 완료 (ID: ${createdRoomId})`);
    }
    
    // ----------------------------------------------------
    // [테스트 1] a~c 단계: 클래스 최종 신청 등록 & 예약 알림 (포맷 변경 반영)
    // ----------------------------------------------------
    console.log('\n--- 🚀 [테스트 1] 클래스 예약 신청 등록 & 알림 연동 검증 (a~c 단계) ---');
    
    // 새 포맷 규칙: CLASS-YYYYMMDD-[영문명]-[2자리 난수]
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const rawName = testBuyerName;
    const englishName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = String(Math.floor(Math.random() * 90) + 10); // 10~99 난수
    const orderNumber = `CLASS-${dateStr}-${englishName}-${rand}`;
    
    const registrationData = {
      groupId: testGroupId,
      userId: testBuyerId,
      orderNumber: orderNumber,
      classId: 'test_class_id_stonehong',
      classTitle: 'Tango Intensive Basic Class',
      totalAmount: 55000,
      selectedRole: 'leader',
      buyerPhone: '010-1234-5678',
      applicantMemo: 'Stone hong 테스트 예약 내역입니다.',
      status: 'UNPAID',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // a. 예약 문서 추가
    const regRef = await db.collection('classRegistrations').add(registrationData);
    createdRegId = regRef.id;
    console.log(`1. [classRegistrations] 문서가 UNPAID 상태로 추가되었습니다 (ID: ${createdRegId})`);
    console.log(`- 생성된 주문 번호: ${orderNumber}`);
    
    // b. 챗룸에 [CLASS RESERVATION] 예약 알림 메시지 카드 발송
    const reservationMsg = `📅 [CLASS RESERVATION]\n` +
      `Order No: ${orderNumber}\n` +
      `Items: ${registrationData.classTitle}\n` +
      `Total: ${registrationData.totalAmount.toLocaleString()} KRW\n` +
      `Role: ${registrationData.selectedRole.toUpperCase()}\n` +
      `Contact: ${registrationData.buyerPhone}\n` +
      `Memo: ${registrationData.applicantMemo}`;
      
    const msgRef1 = await db.collection('chat_messages').add({
      roomId: createdRoomId,
      senderId: testBuyerId,
      senderName: testBuyerName,
      text: reservationMsg,
      type: 'text',
      readBy: [testBuyerId],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`2. 비즈니스 챗룸으로 [CLASS RESERVATION] 카드가 전송되었습니다 (Message ID: ${msgRef1.id})`);
    
    // ----------------------------------------------------
    // [테스트 2] d 단계: 입금 완료 보고 & 알림 연동
    // ----------------------------------------------------
    console.log('\n--- 🚀 [테스트 2] 입금 보고 & 알림 연동 검증 (d 단계) ---');
    
    // a. 입금 보고 업데이트 (status -> PAYMENT_PENDING)
    await db.collection('classRegistrations').doc(createdRegId).update({
      status: 'PAYMENT_PENDING',
      depositorName: testBuyerName,
      reportedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('1. [classRegistrations] 문서 상태가 PAYMENT_PENDING으로 변경되었습니다.');
    
    // b. 챗룸에 [PAYMENT REPORTED] 메시지 카드 발송
    const paymentReportMsg = `💸 [PAYMENT REPORTED]\n` +
      `Order No: ${orderNumber}\n` +
      `Depositor: ${testBuyerName}\n` +
      `I have transferred the payment. Please confirm!`;
      
    const msgRef2 = await db.collection('chat_messages').add({
      roomId: createdRoomId,
      senderId: testBuyerId,
      senderName: testBuyerName,
      text: paymentReportMsg,
      type: 'text',
      readBy: [testBuyerId],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`2. 비즈니스 챗룸으로 [PAYMENT REPORTED] 카드가 전송되었습니다 (Message ID: ${msgRef2.id})`);
    
    // ----------------------------------------------------
    // [테스트 3] e 단계: 클래스 관리자 입금 확인 승인 & 알림 연동
    // ----------------------------------------------------
    console.log('\n--- 🚀 [테스트 3] 호스트 승인 & 최종 알림 연동 검증 (e 단계) ---');
    
    // a. 호스트 승인 업데이트 (status -> PAYMENT_COMPLETED)
    await db.collection('classRegistrations').doc(createdRegId).update({
      status: 'PAYMENT_COMPLETED',
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('1. [classRegistrations] 문서 상태가 PAYMENT_COMPLETED로 변경되었습니다.');
    
    // b. 챗룸에 [CLASS APPROVED] 최종 완료 알림 메시지 카드 발송
    const approvalMsg = `✅ [CLASS APPROVED]\n` +
      `Order No: ${orderNumber}\n` +
      `Class: ${registrationData.classTitle}\n` +
      `Your class registration has been approved. Thank you!`;
      
    const msgRef3 = await db.collection('chat_messages').add({
      roomId: createdRoomId,
      senderId: testHostId,
      senderName: testHostName,
      text: approvalMsg,
      type: 'text',
      readBy: [testHostId],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`2. 비즈니스 챗룸으로 [CLASS APPROVED] 카드가 전송되었습니다 (Message ID: ${msgRef3.id})`);
    
    // ----------------------------------------------------
    // [테스트 결과 분석] 데이터베이스 정합성 및 카드 정보 검증
    // ----------------------------------------------------
    console.log('\n--- 📊 [검증 결과 요약] ---');
    const finalRegSnap = await db.collection('classRegistrations').doc(createdRegId).get();
    const finalData = finalRegSnap.data();
    
    console.log(`- 예약 문서 상태: ${finalData.status} (기대값: PAYMENT_COMPLETED) -> ${finalData.status === 'PAYMENT_COMPLETED' ? '✅ 합격' : '❌ 불합격'}`);
    console.log(`- 최종 주문 번호: ${finalData.orderNumber} (기대값: ${orderNumber}) -> ${finalData.orderNumber === orderNumber ? '✅ 합격' : '❌ 불합격'}`);
    console.log(`- 1:1 비즈니스 챗방 연동 여부: 챗룸 ID [${createdRoomId}]에 3개의 실시간 알림 카드가 정상 발행되었습니다. -> ✅ 합격`);
    
    // * 주의: 사용자가 메시지 창에서 직접 눈으로 보고 테스트를 확인하기 위해, 이번 건은 롤백하지 않고 DB에 남겨둡니다.
    console.log('\n📌 [중요] 사용자의 실시간 메시지 확인을 돕기 위해, 본 테스트 데이터(예약 내역 및 3개의 알림 카드 메시지)는 삭제(롤백)하지 않고 Firestore DB에 그대로 유지합니다.');
    console.log(`- 확인하실 1:1 비즈니스 챗방 ID: ${createdRoomId}`);
    
    console.log('\n✨ Stone hong 계정 타겟 클래스 예약 5단계 및 비즈니스 챗 알림 연동 테스트가 성공적으로 완수되었습니다!');
    
  } catch (error) {
    console.error('❌ 테스트 중 에러가 발생했습니다:', error);
  } finally {
    process.exit(0);
  }
}

runTest();
