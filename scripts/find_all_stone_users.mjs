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

async function findStoneUsers() {
  console.log('🔍 "Stone" 또는 "01072092468" 관련 사용자 계정 전수 검색 중...');
  const usersRef = db.collection('users');
  const snap = await usersRef.get();
  
  let foundCount = 0;
  snap.docs.forEach(doc => {
    const data = doc.data();
    const phone1 = (data.phoneNumber || '').replace(/[^0-9]/g, '');
    const phone2 = (data.phone || '').replace(/[^0-9]/g, '');
    const nickname = (data.nickname || '').toLowerCase();
    const nativeNickname = (data.nativeNickname || '').toLowerCase();
    const email = (data.email || '').toLowerCase();
    
    const isMatch = phone1.includes('72092468') || phone2.includes('72092468') ||
                    nickname.includes('stone') || nativeNickname.includes('홍석범') ||
                    email.includes('stone');
                    
    if (isMatch) {
      foundCount++;
      console.log(`[계정 ${foundCount}]`);
      console.log(`  - ID (UID): ${doc.id}`);
      console.log(`  - Nickname: ${data.nickname} | Native: ${data.nativeNickname}`);
      console.log(`  - Phone: ${data.phoneNumber || data.phone || 'N/A'}`);
      console.log(`  - Email: ${data.email || 'N/A'}`);
      console.log(`  - isInstructor: ${data.isInstructor}`);
      console.log(`  - roles/systemRole: ${data.systemRole || data.role || 'N/A'}`);
    }
  });
  
  console.log(`\n총 ${foundCount}개의 관련 계정을 찾았습니다.`);
  process.exit(0);
}

findStoneUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
