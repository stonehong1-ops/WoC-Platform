import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load service account key
const serviceAccountPath = join(process.cwd(), 'service-account.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error("Please ensure service-account.json exists in the root directory.");
  process.exit(1);
}

// Initialize Firebase Admin
if (!global.firebaseApp) {
  global.firebaseApp = initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function seedPlaza() {
  const posts = [
    {
      userId: 'dummy_user_1',
      userName: '김지훈 (Tango Kim)',
      userPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&q=80',
      content: '어제 본 서울의 밤은 그 어느 때보다 뜨거웠습니다. 새로운 피보트 동작을 연습하며 느낀 커넥션은 정말 잊을 수 없는 경험이었어요. 서울 탱고 씬이 점점 더 성숙해지는 것 같아 기쁩니다.',
      location: 'Seoul · KR',
      likes: 128,
      commentsCount: 24,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      // Add custom field to match the UI subtitle if needed, or we can just rely on createdAt and location
      venueName: "Milonga 'Ocho'"
    },
    {
      userId: 'dummy_user_2',
      userName: '이지연 (Luna Lee)',
      userPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80',
      content: '초보자 분들을 위한 밀롱가 에티켓 클래스를 진행했습니다. 다들 열정적으로 참여해주셔서 뿌듯한 하루였네요. 다음 주에도 홍대에서 만나요!',
      location: 'Itaewon · Seoul',
      likes: 95,
      commentsCount: 18,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      venueName: "Studio S"
    }
  ];

  try {
    const batch = db.batch();
    const collectionRef = db.collection('plaza');

    for (const post of posts) {
      const docRef = collectionRef.doc();
      batch.set(docRef, {
        ...post,
        createdAt: FieldValue.fromDate(post.createdAt)
      });
      console.log(`Prepared post for ${post.userName}`);
    }

    await batch.commit();
    console.log('Successfully seeded 2 highly liked plaza posts!');
  } catch (error) {
    console.error('Error seeding plaza:', error);
  }
}

seedPlaza();
