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
const COACH_ID = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';

async function checkRooms() {
  console.log(`🔍 1. coachId가 [${COACH_ID}]인 coaching_rooms 문서 조회 중...`);
  const coachRoomsSnap = await db.collection('coaching_rooms')
    .where('coachId', '==', COACH_ID)
    .get();
  
  console.log(`결과: Found ${coachRoomsSnap.size} rooms matching coachId.`);
  
  coachRoomsSnap.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`- Room ${i + 1} | ID: [${doc.id}] | Title: [${data.title}] | StudentNames: [${data.studentNames}]`);
  });

  console.log('\n🔍 2. 전체 coaching_rooms 문서 개수 확인 중...');
  const allRoomsSnap = await db.collection('coaching_rooms').get();
  console.log(`전체 coaching_rooms 개수: ${allRoomsSnap.size}개`);
  
  allRoomsSnap.docs.slice(0, 5).forEach((doc, i) => {
    const data = doc.data();
    console.log(`- Sample Room ${i + 1} | ID: [${doc.id}] | CoachId: [${data.coachId}] | StudentNames: [${data.studentNames}]`);
  });
  
  process.exit(0);
}

checkRooms().catch(err => {
  console.error(err);
  process.exit(1);
});
