import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: 'woc-platform-seoul-1234.firebasestorage.app' });

const db = admin.firestore();
const bucket = admin.storage().bucket();

const LUMINOSO_IDS = [
  'XntnLROqG8oZduaSFlhZ', // 수요일
  'rh3DuAKRkEu5FoZAan5N', // 금요일
];

const IMAGE_PATH = 'C:/Users/stone/.gemini/antigravity/brain/28ad0f1c-02f4-49c8-bb55-664dd5d7b33d/media__1780501448432.png';

async function run() {
  // 1. 이미지 업로드
  console.log('📤 포스터 이미지 업로드 중...');
  const destPath = 'socials/luminoso_practica_poster.png';
  await bucket.upload(IMAGE_PATH, {
    destination: destPath,
    metadata: { contentType: 'image/png' },
  });
  await bucket.file(destPath).makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log(`✅ 이미지 업로드 완료: ${imageUrl}`);

  // 2. Firestore 업데이트
  for (const docId of LUMINOSO_IDS) {
    const ref = db.collection('socials').doc(docId);
    const doc = await ref.get();
    if (!doc.exists) {
      console.log(`❌ ${docId} 문서 없음`);
      continue;
    }
    await ref.update({
      djName: 'TREES',
      djNameNative: '트리스',
      imageUrl: imageUrl,
    });
    const data = doc.data();
    console.log(`✅ ${docId} (${data.title}, dayOfWeek:${data.dayOfWeek}) → DJ: TREES 트리스, 이미지 반영 완료`);
  }

  console.log('\n🎉 Luminoso Practica 수/금 모두 업데이트 완료');
}

run().catch(console.error);
