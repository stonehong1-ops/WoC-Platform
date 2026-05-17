const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugGetGlobalClassesToday() {
  try {
    const now = new Date();
    // KST (UTC+9) 기준으로 날짜 생성 시도
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const kstTodayStr = `${kstNow.getUTCFullYear()}-${String(kstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(kstNow.getUTCDate()).padStart(2, '0')}`;
    
    console.log('Current System Time:', now.toString());
    console.log('Generated todayStr (System):', todayStr);
    console.log('Generated todayStr (KST):', kstTodayStr);

    const snapshot = await db.collectionGroup('classes')
      .where('status', '==', 'Open')
      .get();

    console.log('Total Open Classes found:', snapshot.size);

    snapshot.docs.forEach(d => {
      const data = d.data();
      if (d.ref.path.includes('freestyle-tango')) {
        console.log('--- Checking Class in freestyle-tango ---');
        console.log('Title:', data.title);
        console.log('Schedule Dates:', data.schedule?.map(s => s.date));
        
        const hasToday = data.schedule?.some(s => s.date === todayStr);
        const hasKstToday = data.schedule?.some(s => s.date === kstTodayStr);
        
        console.log(`Match with System todayStr (${todayStr}):`, hasToday);
        console.log(`Match with KST todayStr (${kstTodayStr}):`, hasKstToday);
      }
    });

  } catch (error) {
    console.error('Debug Error:', error);
  } finally {
    process.exit(0);
  }
}

debugGetGlobalClassesToday();
