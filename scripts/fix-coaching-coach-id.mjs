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
const OLD_COACH_ID = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
const NEW_COACH_ID = 'E4w5SqJ0nBTHfOkvj5yey6GpYbt2';
const NEW_COACH_NAME = 'Stone Hong';

async function fixCoachIds() {
  console.log('🚀 [코칭방 코치 정보 일괄 정정 스크립트 실행]');

  // 1. Stone Hong (NEW_COACH_ID) 계정의 isInstructor: true 보장
  console.log(`\n1. [코치 권한 활성화 확인] ID: ${NEW_COACH_ID} ...`);
  const coachRef = db.collection('users').doc(NEW_COACH_ID);
  const coachSnap = await coachRef.get();
  if (!coachSnap.exists) {
    console.error('❌ 에러: 신규 코치 Stone Hong 사용자를 찾을 수 없습니다.');
    process.exit(1);
  }
  
  await coachRef.update({
    isInstructor: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ 코치 권한 적용 완료 (isInstructor: true)');

  // 2. OLD_COACH_ID로 설정된 coaching_rooms 문서 쿼리
  console.log(`\n2. [오지정된 코칭방 수집 중] 구 코치 ID: ${OLD_COACH_ID} ...`);
  const roomsSnap = await db.collection('coaching_rooms')
    .where('coachId', '==', OLD_COACH_ID)
    .get();

  console.log(`수정 대상 코칭방 개수: ${roomsSnap.size}개`);

  // 3. 일괄 수정
  console.log('\n3. [코치 ID/이름 일괄 정정 시작] ...');
  let count = 0;
  for (const doc of roomsSnap.docs) {
    const data = doc.data();
    
    // 만약 학생 목록에 NEW_COACH_ID가 들어있는지 안전하게 확인 (있으면 걷어내기 위함)
    let studentIds = data.studentIds || [];
    let studentNames = data.studentNames || [];
    if (studentIds.includes(NEW_COACH_ID)) {
      const idx = studentIds.indexOf(NEW_COACH_ID);
      studentIds.splice(idx, 1);
      studentNames.splice(idx, 1);
      console.log(`  - ⚠️ 코치 본인의 학생 매핑 발견 및 제거: ${data.title}`);
    }

    await doc.ref.update({
      coachId: NEW_COACH_ID,
      coachName: NEW_COACH_NAME,
      studentIds,
      studentNames,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    count++;
    console.log(`  - ✅ [정정 완료] ${count}/${roomsSnap.size} | ID: [${doc.id}] | Title: [${data.title}]`);
  }

  console.log(`\n✨ 정정 작업이 성공적으로 끝났습니다. 총 ${count}개의 코칭방 코치 정보가 '${NEW_COACH_NAME}' 계정으로 변경되었습니다.`);
  process.exit(0);
}

fixCoachIds().catch(err => {
  console.error('❌ 에러 발생:', err);
  process.exit(1);
});
