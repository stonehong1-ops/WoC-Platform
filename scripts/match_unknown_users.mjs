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
const targetUids = [
  'E5YX4LCTDbTDU7idKwv8UzM4nQs1',
  '4T54rzxx1KcYRuoj0f5jcV2N3PF3',
  'OBwLDM2FVqZZsVJkotO6Kew9N342'
];

async function matchUsers() {
  console.log('🔍 Unknown User UIDs 조회 시작...');
  for (const uid of targetUids) {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log(`[UID: ${uid}]`);
      console.log(`  - Nickname: ${data.nickname || 'N/A'}`);
      console.log(`  - NativeNickname: ${data.nativeNickname || 'N/A'}`);
      console.log(`  - Email: ${data.email || 'N/A'}`);
      console.log(`  - Phone: ${data.phoneNumber || data.phone || 'N/A'}`);
    } else {
      console.log(`[UID: ${uid}] 문서가 존재하지 않습니다.`);
    }
  }
  process.exit(0);
}

matchUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
