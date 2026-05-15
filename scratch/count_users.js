const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function countUsers() {
  // Get all users from Firebase Auth
  let allUsers = [];
  let nextPageToken;
  
  do {
    const listResult = await admin.auth().listUsers(1000, nextPageToken);
    allUsers = allUsers.concat(listResult.users);
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  const total = allUsers.length;

  // Today and yesterday boundaries (KST = UTC+9)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  
  // Get KST midnight today
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstTodayMidnight = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
  const todayStartUTC = new Date(kstTodayMidnight.getTime() - kstOffset);
  
  // Get KST midnight yesterday
  const kstYesterdayMidnight = new Date(kstTodayMidnight.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStartUTC = new Date(kstYesterdayMidnight.getTime() - kstOffset);

  let todayCount = 0;
  let yesterdayCount = 0;
  let todayUsers = [];
  let yesterdayUsers = [];

  for (const user of allUsers) {
    const createdAt = new Date(user.metadata.creationTime);
    
    if (createdAt >= todayStartUTC) {
      todayCount++;
      todayUsers.push({
        email: user.email || 'N/A',
        displayName: user.displayName || 'N/A',
        created: createdAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      });
    } else if (createdAt >= yesterdayStartUTC && createdAt < todayStartUTC) {
      yesterdayCount++;
      yesterdayUsers.push({
        email: user.email || 'N/A',
        displayName: user.displayName || 'N/A',
        created: createdAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      });
    }
  }

  console.log('========================================');
  console.log(`  WoC Platform User Statistics`);
  console.log(`  Date: ${kstNow.toLocaleDateString('ko-KR')}`);
  console.log('========================================');
  console.log(`  Total Users:     ${total}`);
  console.log(`  Yesterday:       ${yesterdayCount}`);
  console.log(`  Today:           ${todayCount}`);
  console.log('========================================');
  
  if (yesterdayUsers.length > 0) {
    console.log('\n  [Yesterday\'s Signups]');
    yesterdayUsers.forEach((u, i) => {
      console.log(`    ${i+1}. ${u.displayName} (${u.email}) - ${u.created}`);
    });
  }
  
  if (todayUsers.length > 0) {
    console.log('\n  [Today\'s Signups]');
    todayUsers.forEach((u, i) => {
      console.log(`    ${i+1}. ${u.displayName} (${u.email}) - ${u.created}`);
    });
  }
  
  console.log('');
}

countUsers().catch(console.error);
