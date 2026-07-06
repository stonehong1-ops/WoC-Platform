import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// 25개 에피소드 데이터 로드
const seedDataPath = './scripts/music365_seed_data.json';
const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

async function main() {
  console.log('Starting music365 Firestore seeding...');
  
  // 1. 기존 music365 카테고리 문서들 청산
  const colRef = db.collection('culture_contents');
  const snap = await colRef.where('category', '==', 'music365').get();
  
  console.log(`Found ${snap.size} existing music365 documents. Deleting...`);
  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log('Existing docs deleted.');

  // 2. 유튜브 25개 비디오 데이터 일괄 주입
  const writeBatch = db.batch();
  seedData.forEach((item) => {
    // 썸네일 URL: 유튜브 표준 고화질 썸네일
    const imgUrl = `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
    
    // 문서 ID 생성: music365_01 ~ music365_25
    const formattedIndex = String(item.index).padStart(2, '0');
    const docId = `music365_${formattedIndex}`;
    
    const docData = {
      category: 'music365',
      index: item.index,
      title: item.title,
      titleNative: item.title, 
      videoId: item.videoId,
      img: imgUrl,
      desc: `탱고음악 365 - ${item.index}화 에피소드 감상`,
      descNative: `Listen to Episode ${item.index} of Tango Music 365`,
      contentBody: `유튜브 재생목록에서 직접 연동된 영상 콘텐츠입니다. 비디오 ID: ${item.videoId}`,
      contentBodyNative: `Directly linked from YouTube playlist. Video ID: ${item.videoId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = colRef.doc(docId);
    writeBatch.set(docRef, docData);
    console.log(`Queued doc: ${docId} (${item.title})`);
  });

  await writeBatch.commit();
  console.log('✔ Seeding complete! 25 music365 documents successfully created.');
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
