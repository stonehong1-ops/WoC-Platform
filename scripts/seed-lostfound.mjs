import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(
  await readFile(new URL('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', import.meta.url))
);

const app = initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore(app);

const SAMPLE_ITEMS = [
  // --- LOST ITEMS (10) ---
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '검은색 프라다 지갑 잃어버렸습니다 ㅠㅠ',
    description: '어제 밀롱가 중에 의자 쪽에 둔 것 같은데 나중에 보니 없어졌어요. 현금은 괜찮으니 신분증만이라도 꼭 돌려주세요.',
    category: 'Wallet/Bag',
    location: 'El Bulin (엘불린)',
    date: '2026-04-30',
    images: ['https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?w=600'],
    reward: 50000,
    authorId: 'test_user_1',
    authorName: 'TangoLover',
    authorPhoto: 'https://i.pravatar.cc/150?u=1'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '에어팟 프로 오른쪽 유닛 분실',
    description: '입구쪽 신발장 근처에서 떨어뜨린 것 같습니다. 찾아주시는 분께 꼭 사례하겠습니다.',
    category: 'Electronics',
    location: 'Freestyle (프리스타일)',
    date: '2026-04-29',
    images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'],
    reward: 30000,
    authorId: 'test_user_2',
    authorName: 'Milonguero',
    authorPhoto: 'https://i.pravatar.cc/150?u=2'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '빨간색 가죽 댄스화 주머니',
    description: '주머니 안에 꼬메일 탄생화 230mm 들어있습니다. 너무 아끼는 신발이에요. 보신 분 꼭 연락 부탁드립니다.',
    category: 'Shoes',
    location: 'Tension (텐션)',
    date: '2026-04-28',
    images: ['https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600'],
    reward: 20000,
    authorId: 'test_user_3',
    authorName: 'DanceHolik',
    authorPhoto: 'https://i.pravatar.cc/150?u=3'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '맥 코스메틱 립스틱 (루비우)',
    description: '화장실 거울 앞에 잠깐 두고 나왔는데 5분 뒤에 가보니 없네요 ㅠㅠ',
    category: 'Cosmetics',
    location: 'Romantica (로만티카)',
    date: '2026-04-27',
    images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'],
    authorId: 'test_user_4',
    authorName: 'Sarah',
    authorPhoto: 'https://i.pravatar.cc/150?u=4'
  },
  {
    type: 'LOST',
    status: 'RESOLVED',
    title: '은색 링 귀걸이 한 짝',
    description: '춤추다가 빠진 것 같습니다. 꽤 큰 링 귀걸이에요.',
    category: 'Accessories',
    location: 'El Bulin (엘불린)',
    date: '2026-04-25',
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'],
    authorId: 'test_user_5',
    authorName: 'Elena',
    authorPhoto: 'https://i.pravatar.cc/150?u=5'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '검은색 남성용 정장 마이',
    description: '옷걸이에 걸어뒀는데 집에 올 때 보니 다른 분 옷만 있고 제 옷이 없네요. 바뀐 것 같습니다.',
    category: 'Clothing',
    location: 'Freestyle (프리스타일)',
    date: '2026-04-30',
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'],
    authorId: 'test_user_6',
    authorName: 'Mark',
    authorPhoto: 'https://i.pravatar.cc/150?u=6'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '스타벅스 검은색 텀블러',
    description: '바 테이블 쪽에 놔뒀던 검은색 스탠리 콜라보 텀블러입니다.',
    category: 'Others',
    location: 'Tension (텐션)',
    date: '2026-04-29',
    images: ['https://images.unsplash.com/photo-1622618991746-fe6004db3a47?w=600'],
    authorId: 'test_user_7',
    authorName: 'James',
    authorPhoto: 'https://i.pravatar.cc/150?u=7'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '샤넬 넘버5 향수 50ml',
    description: '탈의실 파우더룸에 두고 그냥 온 것 같습니다 ㅠㅠ',
    category: 'Cosmetics',
    location: 'Romantica (로만티카)',
    date: '2026-04-28',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600'],
    authorId: 'test_user_8',
    authorName: 'Jenny',
    authorPhoto: 'https://i.pravatar.cc/150?u=8'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '아이폰 14 프로 실버',
    description: '케이스는 투명 젤리 케이스입니다. 전원 켜져있으니 습득하신 분 꼭 연락 바랍니다.',
    category: 'Electronics',
    location: 'El Bulin (엘불린)',
    date: '2026-04-30',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'],
    reward: 100000,
    authorId: 'test_user_9',
    authorName: 'Tom',
    authorPhoto: 'https://i.pravatar.cc/150?u=9'
  },
  {
    type: 'LOST',
    status: 'SEARCHING',
    title: '흰색 레이스 부채',
    description: '스페인에서 사온 아끼는 부채입니다. 혹시 보신 분 계실까요?',
    category: 'Accessories',
    location: 'Freestyle (프리스타일)',
    date: '2026-04-26',
    images: ['https://images.unsplash.com/photo-1595180422176-056a1b14a0f4?w=600'],
    authorId: 'test_user_10',
    authorName: 'Maria',
    authorPhoto: 'https://i.pravatar.cc/150?u=10'
  },

  // --- FOUND ITEMS (10) ---
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '바닥에서 주운 은색 발찌',
    description: '스테이지 중간쯤에서 주웠습니다. 바에 맡겨두었습니다.',
    category: 'Accessories',
    location: 'El Bulin (엘불린)',
    date: '2026-04-30',
    images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600'],
    authorId: 'test_user_11',
    authorName: 'Finder',
    authorPhoto: 'https://i.pravatar.cc/150?u=11'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '남성용 검은색 가죽장갑',
    description: '입구 소파에 떨어져 있었습니다.',
    category: 'Clothing',
    location: 'Freestyle (프리스타일)',
    date: '2026-04-29',
    images: ['https://images.unsplash.com/photo-1582845663673-c6c747715ec3?w=600'],
    authorId: 'test_user_12',
    authorName: 'GoodSamaritan',
    authorPhoto: 'https://i.pravatar.cc/150?u=12'
  },
  {
    type: 'FOUND',
    status: 'RESOLVED',
    title: '차키 (현대자동차)',
    description: '키링에 곰돌이 인형 달려있습니다. 주인이 찾아가셨습니다.',
    category: 'Others',
    location: 'Tension (텐션)',
    date: '2026-04-28',
    images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600'],
    authorId: 'test_user_13',
    authorName: 'Helper',
    authorPhoto: 'https://i.pravatar.cc/150?u=13'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '분홍색 파우치 (화장품)',
    description: '화장실 세면대 옆에 있었습니다. 바 매니저님께 전달했습니다.',
    category: 'Cosmetics',
    location: 'Romantica (로만티카)',
    date: '2026-04-27',
    images: ['https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600'],
    authorId: 'test_user_14',
    authorName: 'KindSoul',
    authorPhoto: 'https://i.pravatar.cc/150?u=14'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '신용카드 (국민카드)',
    description: '이름 O민O 님, 카운터에 맡겨두었습니다.',
    category: 'Wallet/Bag',
    location: 'El Bulin (엘불린)',
    date: '2026-04-30',
    images: ['https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600'],
    authorId: 'test_user_15',
    authorName: 'Angel',
    authorPhoto: 'https://i.pravatar.cc/150?u=15'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '보조배터리 10000mAh (흰색)',
    description: '테이블 위에 두고 가신 것 같아서 카운터에 드렸습니다.',
    category: 'Electronics',
    location: 'Freestyle (프리스타일)',
    date: '2026-04-30',
    images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600'],
    authorId: 'test_user_16',
    authorName: 'DJ_Tango',
    authorPhoto: 'https://i.pravatar.cc/150?u=16'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '하늘색 스카프',
    description: '의자에 걸려있었습니다.',
    category: 'Clothing',
    location: 'Tension (텐션)',
    date: '2026-04-26',
    images: ['https://images.unsplash.com/photo-1601228271923-1d0b501d51a6?w=600'],
    authorId: 'test_user_17',
    authorName: 'DancerA',
    authorPhoto: 'https://i.pravatar.cc/150?u=17'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '애플워치 스트랩 (메탈)',
    description: '스트랩만 떨어져있었습니다.',
    category: 'Electronics',
    location: 'Romantica (로만티카)',
    date: '2026-04-25',
    images: ['https://images.unsplash.com/photo-1551816230-ef5ce9a00830?w=600'],
    authorId: 'test_user_18',
    authorName: 'Observer',
    authorPhoto: 'https://i.pravatar.cc/150?u=18'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '샤넬 립밤',
    description: '테이블 바닥에서 주웠습니다.',
    category: 'Cosmetics',
    location: 'El Bulin (엘불린)',
    date: '2026-04-29',
    images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'],
    authorId: 'test_user_19',
    authorName: 'TangoGirl',
    authorPhoto: 'https://i.pravatar.cc/150?u=19'
  },
  {
    type: 'FOUND',
    status: 'SEARCHING',
    title: '검은색 뿔테 안경',
    description: '도수가 있는 안경입니다. 케이스 없이 있었습니다.',
    category: 'Accessories',
    location: 'Freestyle (프리스타일)',
    date: '2026-04-30',
    images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600'],
    authorId: 'test_user_20',
    authorName: 'Manager',
    authorPhoto: 'https://i.pravatar.cc/150?u=20'
  }
];

async function main() {
  console.log('🔍 Lost & Found Seeding Script Started\n');
  const batch = db.batch();

  for (const item of SAMPLE_ITEMS) {
    const ref = db.collection('lost_found_items').doc();
    batch.set(ref, {
      ...item,
      likesCount: 0,
      viewsCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  📦 [${item.type}] ${item.title}`);
  }

  await batch.commit();
  console.log(`\n✅ Seeding Complete: ${SAMPLE_ITEMS.length} items seeded\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
