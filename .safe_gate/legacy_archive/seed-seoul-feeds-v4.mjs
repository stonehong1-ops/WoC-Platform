import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seed() {
  const posts = [
    {
      type: 'FEED',
      targets: ['plaza', 'seoul', 'world'],
      content: '이번 주말 압구정 탱고바 투어! 정말 열정적인 댄서들이 많았습니다. 밀롱가 분위기 최고였어요. 다음 주에도 같이 가실 분 구합니다. #서울탱고 #탱고투어',
      images: [
        'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504609774528-694738580705?q=80&w=600&auto=format&fit=crop'
      ],
      userId: 'user_virtual_tango_kr_1',
      userName: 'TangoLoverKR',
      userPhoto: 'https://i.pravatar.cc/150?u=kr1',
      location: {
        country: 'KOREA',
        city: 'SEOUL',
        venueId: null,
        groupId: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 15,
      commentsCount: 3,
      viewCount: 120,
      status: 'ACTIVE'
    },
    {
      type: 'FEED',
      targets: ['plaza', 'seoul', 'world'],
      content: '비오는 날 서울의 밀롱가는 더욱 운치있네요. 좋은 음악과 멋진 사람들과 함께 힐링하고 갑니다. 모두 즐거운 저녁 되세요!',
      images: [
        'https://images.unsplash.com/photo-1621619856624-42fd193a0661?q=80&w=600&auto=format&fit=crop'
      ],
      userId: 'user_virtual_tango_kr_2',
      userName: '비오는밤의탱고',
      userPhoto: 'https://i.pravatar.cc/150?u=kr2',
      location: {
        country: 'KOREA',
        city: 'SEOUL',
        venueId: null,
        groupId: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 8,
      commentsCount: 1,
      viewCount: 45,
      status: 'ACTIVE'
    },
    {
      type: 'FEED',
      targets: ['plaza', 'seoul', 'world'],
      content: '첫 탱고 레슨 무사히 마쳤습니다! 생각보다 어렵지만 너무 재밌어요. 강남에 있는 스튜디오 추천합니다. 다들 화이팅!',
      images: [
        'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=600&auto=format&fit=crop'
      ],
      userId: 'user_virtual_tango_kr_3',
      userName: '초보댄서',
      userPhoto: 'https://i.pravatar.cc/150?u=kr3',
      location: {
        country: 'KOREA',
        city: 'SEOUL',
        venueId: null,
        groupId: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 32,
      commentsCount: 12,
      viewCount: 200,
      status: 'ACTIVE'
    },
    {
      type: 'FEED',
      targets: ['plaza', 'seoul', 'world'],
      content: 'Just had an amazing time exploring the cultural spots in Seoul before hitting the dance floor tonight. Highly recommend visiting the palaces!',
      images: [],
      userId: 'user_virtual_tango_en_1',
      userName: 'SeoulExplorer',
      userPhoto: 'https://i.pravatar.cc/150?u=en1',
      location: {
        country: 'KOREA',
        city: 'SEOUL',
        venueId: null,
        groupId: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 5,
      commentsCount: 0,
      viewCount: 22,
      status: 'ACTIVE'
    },
    {
      type: 'FEED',
      targets: ['plaza', 'seoul', 'world'],
      content: 'Anyone going to the milonga event in Hongdae this Friday? Let me know if you want to meet up for some food beforehand!',
      images: [],
      userId: 'user_virtual_tango_en_2',
      userName: 'TangoNomad',
      userPhoto: 'https://i.pravatar.cc/150?u=en2',
      location: {
        country: 'KOREA',
        city: 'SEOUL',
        venueId: null,
        groupId: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 11,
      commentsCount: 4,
      viewCount: 89,
      status: 'ACTIVE'
    }
  ];

  for (const p of posts) {
    const docRef = await db.collection('feeds').add(p);
    console.log(`Added doc: ${docRef.id}`);
  }
  console.log('Seed done!');
}

seed().catch(console.error);
