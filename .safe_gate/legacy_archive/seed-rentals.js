import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccount = require('./woc-platform-firebase-adminsdk-v4y1m-e8c156f4d5.json'); // assuming standard path or we might need to find the correct json
if (!serviceAccount) throw new Error("Need service account");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedRentals() {
  const rentals = [
    {
      title: '홍대 프리스타일 댄스 스튜디오 A홀',
      description: '넓은 전면 거울과 최상급 오디오 시설을 갖춘 댄스 스튜디오입니다. 개인 연습 및 그룹 안무 연습에 최적화되어 있습니다.',
      location: '마포구',
      address: '서울 마포구 홍익로 10 B1',
      category: '댄스 스튜디오',
      pricePerHour: 15000,
      minHours: 2,
      facilities: ['전면 거울', '블루투스 오디오', '정수기', '탈의실'],
      rules: '실내 전용 운동화 착용 필수, 음식물 반입 금지',
      hostId: 'system_admin',
      images: ['https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=600'],
      regularClasses: [],
      likesCount: 0
    },
    {
      title: '강남 프라이빗 파티룸 & 연습실',
      description: '연습과 네트워킹 파티를 동시에 즐길 수 있는 복합 공간입니다. 취사 시설과 넓은 테이블이 완비되어 있습니다.',
      location: '강남구',
      address: '서울 강남구 테헤란로 123 2층',
      category: '파티룸',
      pricePerHour: 30000,
      minHours: 3,
      facilities: ['파티 테이블', '빔프로젝터', '취사시설', '마샬 스피커'],
      rules: '자정 이후 고성방가 자제, 쓰레기 분리수거 필수',
      hostId: 'system_admin',
      images: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600'],
      regularClasses: [],
      likesCount: 0
    },
    {
      title: '성수동 보컬 및 안무 연습실',
      description: '방음벽이 완벽하게 설치된 개인 연습실입니다. 보컬 트레이닝 및 소규모 안무 연습에 적합합니다.',
      location: '성동구',
      address: '서울 성동구 성수이로 45 3층',
      category: '연습실',
      pricePerHour: 12000,
      minHours: 1,
      facilities: ['방음시설', '전면 거울', '건반', '스피커'],
      rules: '장비 훼손 시 변상, 실내화 착용',
      hostId: 'system_admin',
      images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600'],
      regularClasses: [],
      likesCount: 0
    }
  ];

  for (const rental of rentals) {
    const docRef = await db.collection('rental_spaces').add({
      ...rental,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log(`Created rental space: ${docRef.id}`);
  }
  
  console.log('Seeding complete.');
  process.exit(0);
}

seedRentals().catch(console.error);
