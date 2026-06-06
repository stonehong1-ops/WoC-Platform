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

// Unknown User 매핑 정의
const UNKNOWN_USER_MAP = {
  'E5YX4LCTDbTDU7idKwv8UzM4nQs1': '실론',
  '4T54rzxx1KcYRuoj0f5jcV2N3PF3': '카오스',
  'OBwLDM2FVqZZsVJkotO6Kew9N342': '아찌'
};

async function fixUnknownUsers() {
  console.log('🚀 [Unknown User 코칭방 정정 작업 시작]');

  const roomsRef = db.collection('coaching_rooms');
  const roomsSnap = await roomsRef.get();

  let updatedCount = 0;

  for (const doc of roomsSnap.docs) {
    const data = doc.data();
    const studentIds = data.studentIds || [];
    let studentNames = data.studentNames || [];
    let title = data.title || '';
    let needsUpdate = false;

    // 1. studentNames 배열 내부의 Unknown User 이름 정정
    const updatedStudentNames = studentNames.map((name, index) => {
      const studentId = studentIds[index];
      if (studentId && UNKNOWN_USER_MAP[studentId]) {
        const correctName = UNKNOWN_USER_MAP[studentId];
        if (name !== correctName) {
          console.log(`  - [이름 정정 필요] Room ID: ${doc.id} | 기존 이름: ${name} -> 새 이름: ${correctName}`);
          needsUpdate = true;
          return correctName;
        }
      }
      return name;
    });

    // 2. studentIds 중 대상 UID를 가지고 있으며, title에 'Unknown'이 들어가거나 실제 닉네임과 불일치하는 경우
    // 1:1 코칭방 기준: studentIds 길이가 1이고 대상 UID인 경우
    if (studentIds.length === 1 && UNKNOWN_USER_MAP[studentIds[0]]) {
      const correctName = UNKNOWN_USER_MAP[studentIds[0]];
      if (title !== correctName) {
        console.log(`  - [제목 정정 필요] Room ID: ${doc.id} | 기존 제목: ${title} -> 새 제목: ${correctName}`);
        title = correctName;
        needsUpdate = true;
      }
    } else {
      // 다대다 코칭방인 경우, 이름들이 올바르게 콤마로 엮여 제목이 되었는지 확인
      // 만약 studentNames에 변경이 있었다면 제목도 재생성해준다.
      const hasTargetUid = studentIds.some(id => UNKNOWN_USER_MAP[id]);
      if (hasTargetUid && needsUpdate) {
        const newTitle = updatedStudentNames.join(', ');
        if (title !== newTitle) {
          console.log(`  - [다인실 제목 정정] Room ID: ${doc.id} | 기존 제목: ${title} -> 새 제목: ${newTitle}`);
          title = newTitle;
        }
      }
    }

    if (needsUpdate) {
      await doc.ref.update({
        title,
        studentNames: updatedStudentNames,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 시스템 웰컴 피드도 수정하거나, 혹은 피드는 놔두고 코칭방 자체 정보만 갱신
      console.log(`  - ✅ [정정 완료] Room ID: ${doc.id} | Title: ${title} | Students: ${updatedStudentNames.join(', ')}`);
      updatedCount++;
    }
  }

  console.log(`\n✨ 작업이 완료되었습니다. 총 ${updatedCount}개의 코칭방 정보를 정정했습니다.`);
  process.exit(0);
}

fixUnknownUsers().catch(err => {
  console.error('❌ 에러 발생:', err);
  process.exit(1);
});
