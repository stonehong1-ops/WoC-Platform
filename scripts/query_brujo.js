const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function queryBrujo() {
  try {
    // 1. name이 브루호 또는 Brujo 인 그룹 쿼리
    const groupsSnap = await db.collection('groups').get();
    let targetGroup = null;

    groupsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.name && (data.name.includes('브루호') || data.name.includes('Brujo') || doc.id.includes('brujo'))) {
        console.log(`Found Group: ID=${doc.id}, Name=${data.name}, OwnerId=${data.ownerId}`);
        targetGroup = { id: doc.id, ...data };
      }
    });

    if (!targetGroup) {
      console.log('No matching group found.');
      return;
    }

    // 2. 해당 그룹 하위의 classes 조회
    const classesSnap = await db.collection('groups').doc(targetGroup.id).collection('classes').get();
    console.log(`\n--- Classes currently registered in ${targetGroup.name} (${classesSnap.size} classes) ---`);
    
    classesSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`\nClass ID: ${doc.id}`);
      console.log(`Title: ${data.title}`);
      console.log(`Level: ${data.level}`);
      console.log(`ClassType: ${data.classType}`);
      console.log(`Amount: ${data.amount}`);
      console.log(`StartTime/EndTime: ${data.startTime} - ${data.endTime}`);
      console.log(`Instructors: ${JSON.stringify(data.instructors)}`);
      console.log(`Schedule Entries:`);
      data.schedule?.forEach(s => {
        console.log(`  Week ${s.week}: ${s.date} [${s.timeSlot}] - ${s.content || ''}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

queryBrujo();
