/**
 * seed-communities.js
 * Seed script for community spaces and their initial posts.
 */

const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'woc-platform-seoul-1234'
});

const db = admin.firestore();

const communitiesData = [
  {
    id: 'freestyle-tango',
    name: 'Freestyle Tango',
    description: '프리스타일 탱고의 새로운 기준. 모든 탱고인들을 위한 글로벌 라이프스타일 커뮤니티입니다.',
    coverImage: 'https://images.unsplash.com/photo-1545041041-893f3c306263?q=80&w=2000&auto=format&fit=crop',
    memberCount: 1240,
    members: [
      { id: 'm1', name: 'Elena', avatar: 'https://i.pravatar.cc/150?u=elena' },
      { id: 'm2', name: 'Marco', avatar: 'https://i.pravatar.cc/150?u=marco' },
      { id: 'm3', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' },
      { id: 'm4', name: 'David', avatar: 'https://i.pravatar.cc/150?u=david' },
      { id: 'm5', name: 'Jiwoo', avatar: 'https://i.pravatar.cc/150?u=jiwoo' }
    ],
    posts: [
      {
        id: 'post-1',
        author: {
          name: 'Elena Rossi',
          avatar: 'https://i.pravatar.cc/150?u=elena',
          role: 'Curator'
        },
        content: '마르델플라타의 밤은 언제나 뜨겁습니다. 이번 주말 밀롱가에서 만나요! 새로운 음악 리스트를 준비했습니다.',
        image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1000&auto=format&fit=crop',
        likes: 42,
        comments: 12,
        createdAt: admin.firestore.Timestamp.now()
      },
      {
        id: 'post-2',
        author: {
          name: 'Marco Chen',
          avatar: 'https://i.pravatar.cc/150?u=marco'
        },
        content: '오늘의 무반주 탱고 연습 영상입니다. 커넥션에 집중하고 있어요. 조언 부탁드립니다.',
        likes: 15,
        comments: 8,
        createdAt: admin.firestore.Timestamp.now()
      },
      {
        id: 'post-3',
        author: {
          name: 'Sarah Kim',
          avatar: 'https://i.pravatar.cc/150?u=sarah'
        },
        content: '탱고 슈즈 고르는 팁! 발등이 높으신 분들은 X-스트랩보다는 T-스트랩이 더 안정적이에요.',
        image: 'https://images.unsplash.com/photo-1516475429146-3bb7c5884ba6?q=80&w=1000&auto=format&fit=crop',
        likes: 89,
        comments: 24,
        createdAt: admin.firestore.Timestamp.now()
      }
    ]
  },
  {
    id: 'world-of-colors',
    name: 'World of Colors',
    description: '세상의 모든 색상을 탐구하는 디자이너들의 안식처입니다.',
    coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2000&auto=format&fit=crop',
    memberCount: 856,
    members: [
      { id: 'm6', name: 'Artur', avatar: 'https://i.pravatar.cc/150?u=artur' },
      { id: 'm7', name: 'Chloe', avatar: 'https://i.pravatar.cc/150?u=chloe' },
      { id: 'm8', name: 'James', avatar: 'https://i.pravatar.cc/150?u=james' }
    ],
    posts: [
      {
        id: 'post-c1',
        author: {
          name: 'Artur Vance',
          avatar: 'https://i.pravatar.cc/150?u=artur'
        },
        content: '이번 프로젝트의 메인 컬러 팔레트입니다. 팬톤 2024 올해의 컬러를 어떻게 믹스하면 좋을까요?',
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop',
        likes: 31,
        comments: 5,
        createdAt: admin.firestore.Timestamp.now()
      }
    ]
  }
];

async function seedCommunities() {
  console.log('Starting community seeding...');
  
  for (const community of communitiesData) {
    const { posts, ...communityMeta } = community;
    
    // 1. Set community meta
    await db.collection('communities').doc(community.id).set({
      ...communityMeta,
      updatedAt: admin.firestore.Timestamp.now()
    });
    console.log(`- Community seeded: ${community.name}`);
    
    // 2. Set posts as sub-collection
    for (const post of posts) {
      await db.collection('communities').doc(community.id).collection('posts').doc(post.id).set(post);
    }
    console.log(`  - ${posts.length} posts seeded for ${community.name}`);
  }
  
  console.log('Seeding completed successfully!');
  process.exit(0);
}

seedCommunities().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
