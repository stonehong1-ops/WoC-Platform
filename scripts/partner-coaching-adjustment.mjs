import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  admin.initializeApp({
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();
const COACH_ID = 'E4w5SqJ0nBTHfOkvj5yey6GpYbt2';
const COACH_NAME = 'Stone Hong';

// 삭제 대상 수강생 (1:1 방 삭제용)
const TARGET_INDIVIDUAL_STUDENTS = {
  'I0bTyIjpb5QllymJLkrPka9j04C3': '조앤',
  'JNqbirA6zUhm4eTWXTPM6YKeJuO2': '알마',
  '70wnM1V718UZMYvNI4m3eiz6edi2': '소노발로',
  'AoixPmD8A1RWrORf7LePIuRiMk72': '그레타',
  '9hgZnv7gpNQ2qisRGEKkAQTcpPm1': '마하',
  '5UOscMPqEhMzmRguexDhcLmElhy1': '반야',
  'UFJcE1OD5USW2621HbDqO6FUpb92': '가을',
  'dmAh3bN8mBZLyzYGOYKtP3J4DzF3': '정교'
};

// 신규 파트너 묶음 대상 목록
const NEW_PARTNERS = [
  {
    ids: ['I0bTyIjpb5QllymJLkrPka9j04C3', 'JNqbirA6zUhm4eTWXTPM6YKeJuO2'],
    names: ['조앤', '알마']
  },
  {
    ids: ['70wnM1V718UZMYvNI4m3eiz6edi2', 'AoixPmD8A1RWrORf7LePIuRiMk72'],
    names: ['소노발로', '그레타']
  },
  {
    ids: ['9hgZnv7gpNQ2qisRGEKkAQTcpPm1', '5UOscMPqEhMzmRguexDhcLmElhy1'],
    names: ['마하', '반야']
  },
  {
    ids: ['UFJcE1OD5USW2621HbDqO6FUpb92', 'dmAh3bN8mBZLyzYGOYKtP3J4DzF3'],
    names: ['가을', '정교']
  }
];

async function runAdjustment() {
  console.log('🚀 [파트너 코칭방 묶음 및 정제 스크립트 실행]');

  // 1. 기존 개별 1:1 방 삭제
  console.log('\n1. [개별 1:1 방 삭제 처리]');
  const roomsRef = db.collection('coaching_rooms');
  const roomsSnap = await roomsRef.where('coachId', '==', COACH_ID).get();
  
  let deletedCount = 0;
  for (const doc of roomsSnap.docs) {
    const data = doc.data();
    const studentIds = data.studentIds || [];
    
    // studentIds 길이가 1이고, 대상 리스트에 들어있는 경우 1:1 방으로 판정하여 삭제
    if (studentIds.length === 1 && TARGET_INDIVIDUAL_STUDENTS[studentIds[0]]) {
      const studentName = TARGET_INDIVIDUAL_STUDENTS[studentIds[0]];
      console.log(`  - 🗑️ [개별 방 삭제] 학생: ${studentName} (ID: ${studentIds[0]}) | Room ID: [${doc.id}]`);
      await db.recursiveDelete(doc.ref);
      deletedCount++;
    }
  }
  console.log(`✅ 개별 1:1 코칭방 총 ${deletedCount}개 삭제 완료.`);

  // 2. 기존 중복 파트너 방 삭제 ("가을 & 정교" 또는 그 밖의 파트너 대상 중복 방)
  console.log('\n2. [중복 파트너 코칭방 삭제 처리]');
  
  // 다시 한 번 방 조회를 돌려 최신 스냅샷 확보
  const activeRoomsSnap = await roomsRef.where('coachId', '==', COACH_ID).get();
  let duplicateDeletedCount = 0;
  
  for (const doc of activeRoomsSnap.docs) {
    const data = doc.data();
    const studentIds = data.studentIds || [];
    
    // studentIds에 가을(UFJcE1OD5USW2621HbDqO6FUpb92)과 정교(dmAh3bN8mBZLyzYGOYKtP3J4DzF3)가 모두 포함된 기존 방 삭제
    if (studentIds.includes('UFJcE1OD5USW2621HbDqO6FUpb92') && studentIds.includes('dmAh3bN8mBZLyzYGOYKtP3J4DzF3')) {
      console.log(`  - 🗑️ [중복 파트너 방 삭제] 대상: 가을 & 정교 | Room ID: [${doc.id}]`);
      await db.recursiveDelete(doc.ref);
      duplicateDeletedCount++;
    }
  }
  console.log(`✅ 중복 파트너 방 총 ${duplicateDeletedCount}개 삭제 완료.`);

  // 3. 신규 1:2 파트너 코칭방 개설
  console.log('\n3. [신규 파트너 묶음 코칭방 4개 개설]');
  let createdCount = 0;
  for (const partner of NEW_PARTNERS) {
    const roomTitle = partner.names.join(', ');
    
    // 혹시 동일한 파트너 구성의 코칭방이 이미 존재하는지 재확인 (방지책)
    const duplicateCheckSnap = await roomsRef
      .where('coachId', '==', COACH_ID)
      .where('studentIds', '==', partner.ids)
      .get();
      
    if (duplicateCheckSnap.size > 0) {
      console.log(`  - ⚠️ [건너뜀] 파트너 [${roomTitle}] 코칭방이 이미 존재합니다.`);
      continue;
    }

    const newRoomRef = roomsRef.doc();
    const roomId = newRoomRef.id;

    const newRoomData = {
      title: roomTitle,
      coachId: COACH_ID,
      coachName: COACH_NAME,
      studentIds: partner.ids,
      studentNames: partner.names,
      status: 'active',
      overallProgress: 0,
      activeAssignmentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await newRoomRef.set(newRoomData);

    // 첫 시스템 웰컴 피드 기록
    const feedRef = newRoomRef.collection('feed').doc();
    await feedRef.set({
      roomId: roomId,
      type: 'system_log',
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      content: `System: 파트너 1:2 코칭 공간 [${roomTitle}]이 생성되었습니다. 성장 피드백을 기록하세요.`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    createdCount++;
    console.log(`  - 🎉 [개설 완료] 파트너: ${roomTitle} | Room ID: [${roomId}]`);
  }

  console.log(`\n✨ 파트너 재조정 작업 완료. 총 ${createdCount}개의 파트너 코칭방을 새롭게 개설했습니다.`);
  process.exit(0);
}

runAdjustment().catch(err => {
  console.error('❌ 에러 발생:', err);
  process.exit(1);
});
