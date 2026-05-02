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

// Helper to generate some random past timestamp
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const PAST_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Up to 7 days ago

// Data for 20 representative posts
const POSTS = [
  {
    userId: 'user_plaza_1',
    userName: 'Elena',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza1',
    category: 'STORY',
    targets: ['tango', 'plaza'],
    content: `🔥 **밀롱가 엘불린에서의 환상적인 토요일 밤!** 🔥\n\n어제 정말 많은 분들이 오셔서 분위기 최고였어요.\n에어컨이 빵빵해서 쾌적하게 춤췄네요!\n\n이번 주말에 오셨던 분들 다들 즐거우셨나요?\n다음 주에는 더 재미있는 이벤트가 있다고 하니 기대해봅시다.\n\n#밀롱가 #탱고 #엘불린 #주말 #춤스타그램 #아르헨티나탱고`,
    media: [
      { url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1502519144081-aca150d10592?w=800', type: 'image' }
    ],
    likesCount: 24,
    reactionCounts: { LIKE: 10, LOVE: 10, FIRE: 4 },
    commentsCount: 3,
  },
  {
    userId: 'user_plaza_2',
    userName: 'Mark',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza2',
    category: 'QNA',
    targets: ['tango', 'plaza'],
    content: `안녕하세요! 탱고 시작한지 3개월 된 초보입니다. 🥺\n\n다름이 아니라 댄스화 굽 높이에 대해 질문이 있어요.\n\n현재 7cm 신다가 조금 발이 아파서 5cm로 바꿀까 고민중인데,\n\n- 5cm 굽도 밀롱가에서 무난하게 신을 수 있나요?\n- 턴할 때 차이가 많이 날까요?\n- 추천하시는 브랜드가 있다면 알려주세요!\n\n선배님들의 조언 부탁드립니다!! 🙏🙏🙏`,
    likesCount: 12,
    reactionCounts: { LIKE: 8, WOW: 4 },
    commentsCount: 0,
  },
  {
    userId: 'user_plaza_3',
    userName: 'TangoDJ_Chris',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza3',
    category: 'MUSIC',
    targets: ['tango', 'plaza'],
    content: `🎧 **오늘의 추천 딴다: D'Arienzo (1930s)**\n\n1. Loca\n2. El Flete\n3. Nada Mas\n4. Paciencia\n\n비트감이 강렬해서 초보자부터 숙련자까지 모두가 좋아하는 곡들입니다.\n특히 Paciencia의 반도네온 솔로 파트는 언제 들어도 가슴이 뛰네요.\n이 곡들로 춤출 때 여러분은 어떤 느낌이신가요? 🎶`,
    media: [
      { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800', type: 'image' }
    ],
    likesCount: 45,
    reactionCounts: { LOVE: 30, WOW: 10, FIRE: 5 },
    commentsCount: 2,
  },
  {
    userId: 'user_plaza_4',
    userName: 'Maestro_Juan',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza4',
    category: 'LESSON',
    targets: ['tango', 'plaza'],
    content: `✨ **Ocho Cortado 마스터하기 포인트** ✨\n\n오초 꼬르따도는 밀롱가에서 정말 유용하게 쓰이는 동작입니다.\n많은 분들이 스텝만 밟으려고 하는데, 가장 중요한 건 **리바운드(Rebound)와 안착(Grounding)**입니다.\n\n영상으로 짧게 준비해봤습니다. 같이 보실까요? 👇\n\n(참고: 파트너와의 커넥션 유지에 집중하세요!)`,
    media: [
      { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', type: 'video' }
    ],
    likesCount: 89,
    reactionCounts: { LIKE: 40, LOVE: 20, WOW: 29 },
    commentsCount: 0,
  },
  {
    userId: 'user_plaza_5',
    userName: 'Sarah',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza5',
    category: 'REVIEW',
    targets: ['tango', 'plaza'],
    content: `오늘 프리스타일 밀롱가 바닥 상태 너무 좋았어요!! 🌟\n\n왁스칠 새로 하셨는지 미끄러짐도 적당하고 피벗 돌 때 발목에 무리가 안 가네요.\n음향 세팅도 지난주보다 훨씬 밸런스가 잡힌 느낌이었습니다.\n\n다들 오늘 어떠셨나요? 🤩`,
    media: [
      { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', type: 'video' }
    ],
    likesCount: 33,
    reactionCounts: { LIKE: 20, LOVE: 13 },
    commentsCount: 4,
  },
  {
    userId: 'user_plaza_6',
    userName: 'DanceHolik',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza6',
    category: 'STORY',
    targets: ['tango', 'plaza'],
    content: `👗 **새로운 댄스복 장만했어요!** 👗\n\n오랜만에 마음에 쏙 드는 드레스를 발견해서 바로 구매했습니다.\n등 파임이 시원해서 여름에 입기 딱 좋을 것 같아요.\n\n이번 주 토요일 로만티카 밀롱가에 입고 갈 예정입니다. 💃\n보시면 인사해 주세요!!\n\n#탱고드레스 #쇼핑성공 #밀롱가룩 #기분전환`,
    media: [
      { url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800', type: 'image' }
    ],
    likesCount: 55,
    reactionCounts: { LIKE: 25, LOVE: 30 },
    commentsCount: 0,
  },
  {
    userId: 'user_plaza_7',
    userName: 'Milonguero_Alex',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza7',
    category: 'NOTICE',
    targets: ['tango', 'plaza'],
    content: `📣 **[긴급 공지] 오늘 홍대 인근 교통 통제 안내** 📣\n\n오늘 저녁 홍대 걷고싶은거리에서 대형 행사가 있어서 차량 진입이 매우 어렵다고 합니다!\n밀롱가 오시는 분들은 가급적 **대중교통** 이용을 권장드립니다.\n\n* 통제 시간: 17:00 ~ 23:00\n* 주차장 만차 예상\n\n다들 안전하게 오세요! 🚶‍♂️🚶‍♀️`,
    likesCount: 18,
    reactionCounts: { LIKE: 18 },
    commentsCount: 1,
  },
  {
    userId: 'user_plaza_8',
    userName: 'Jenny',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza8',
    category: 'STORY',
    targets: ['tango', 'plaza'],
    content: `비 오는 날의 탱고 감성... ☔️\n\n이런 날은 Di Sarli 음악에 맞춰서 끄네끈적하게 춤추고 싶어지네요.\n따뜻한 커피 한 잔 마시고 저녁 밀롱가 준비해야겠어요.\n\n모두 우산 잘 챙기시고 빗길 조심하세요!`,
    media: [
      { url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800', type: 'image' }
    ],
    likesCount: 42,
    reactionCounts: { LOVE: 35, LIKE: 7 },
    commentsCount: 0,
  },
  {
    userId: 'user_plaza_9',
    userName: 'Organizer_Kim',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza9',
    category: 'EVENT',
    targets: ['tango', 'plaza'],
    content: `🎉 **제 5회 서울 국제 탱고 마라톤 등록 시작!** 🎉\n\n드디어 올해도 마라톤 등록이 시작되었습니다.\n\n📅 **일정:** 2026. 10. 15 ~ 10. 17\n📍 **장소:** 서울 중심부 호텔 연회장\n\n얼리버드 할인은 이번 주 일요일까지만 진행되니 놓치지 마세요!\n자세한 사항은 프로필 링크를 확인해주세요.\n\n#탱고마라톤 #서울이벤트 #아르헨티나탱고`,
    media: [
      { url: 'https://images.unsplash.com/photo-1504609774528-694747ed3a2c?w=800', type: 'image' },
      { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', type: 'video' }
    ],
    likesCount: 120,
    reactionCounts: { WOW: 50, LOVE: 40, FIRE: 30 },
    commentsCount: 2,
  },
  {
    userId: 'user_plaza_10',
    userName: 'TangoBeginner',
    userPhoto: 'https://i.pravatar.cc/150?u=plaza10',
    category: 'STORY',
    targets: ['tango', 'plaza'],
    content: `첫 밀롱가 데뷔 성공적으로 마쳤습니다! 😭\n\n너무 떨려서 심장이 터지는 줄 알았는데, 까베세오 받아주신 선배님들 너무 감사해요.\n다들 너무 친절하게 리드해주시고 배려해주셔서 감동받았습니다.\n\n앞으로 더 열심히 연습해서 좋은 팔로워가 될게요!! 화이팅!! 💪`,
    likesCount: 88,
    reactionCounts: { LIKE: 40, LOVE: 40, WOW: 8 },
    commentsCount: 5, // Will add comments for this
  },
  // Posts 11-20 (Simpler content)
  {
    userId: 'user_plaza_11', userName: 'David', userPhoto: 'https://i.pravatar.cc/150?u=plaza11', category: 'STORY', targets: ['tango', 'plaza'],
    content: `오늘 텐션 밀롱가 진짜 역대급 물이네요. 다들 너무 춤 잘 추셔서 구경하는 재미도 쏠쏠합니다.`,
    likesCount: 15, reactionCounts: { LIKE: 10, FIRE: 5 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_12', userName: 'Emma', userPhoto: 'https://i.pravatar.cc/150?u=plaza12', category: 'QNA', targets: ['tango', 'plaza'],
    content: `혹시 이번주 금요일에 부산 밀롱가 가시는 분 계신가요? 카풀 구하고 있습니다!`,
    likesCount: 5, reactionCounts: { LIKE: 5 }, commentsCount: 1
  },
  {
    userId: 'user_plaza_13', userName: 'Lucas', userPhoto: 'https://i.pravatar.cc/150?u=plaza13', category: 'STORY', targets: ['tango', 'plaza'],
    content: `연습실 대관해서 3시간째 기본기만 파고 있습니다. 걷기가 세상에서 제일 어려운 것 같아요.`,
    media: [{ url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800', type: 'image' }],
    likesCount: 30, reactionCounts: { LIKE: 15, SAD: 10, FIRE: 5 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_14', userName: 'Sophia', userPhoto: 'https://i.pravatar.cc/150?u=plaza14', category: 'MUSIC', targets: ['tango', 'plaza'],
    content: `최근 꽂힌 곡: Osvaldo Pugliese - Recuerdo\n들을 때마다 전율이 돋습니다. 진짜 명곡이에요.`,
    likesCount: 22, reactionCounts: { LOVE: 22 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_15', userName: 'Liam', userPhoto: 'https://i.pravatar.cc/150?u=plaza15', category: 'STORY', targets: ['tango', 'plaza'],
    content: `새 구두 길들이는 중인데 물집 잡혔네요 ㅠㅠ 밴드 필수...`,
    likesCount: 12, reactionCounts: { SAD: 10, LIKE: 2 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_16', userName: 'Mia', userPhoto: 'https://i.pravatar.cc/150?u=plaza16', category: 'LESSON', targets: ['tango', 'plaza'],
    content: `아브라소(Abrazo) 할 때 팔에 힘 빼는 법 좀 알려주세요. 자꾸 어깨가 올라가요.`,
    likesCount: 8, reactionCounts: { LIKE: 8 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_17', userName: 'Noah', userPhoto: 'https://i.pravatar.cc/150?u=plaza17', category: 'STORY', targets: ['tango', 'plaza'],
    content: `친구 따라서 구경 갔다가 탱고의 매력에 빠져버렸습니다. 내일부터 당장 클래스 등록합니다!`,
    media: [{ url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', type: 'video' }],
    likesCount: 60, reactionCounts: { WOW: 30, LOVE: 30 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_18', userName: 'Isabella', userPhoto: 'https://i.pravatar.cc/150?u=plaza18', category: 'STORY', targets: ['tango', 'plaza'],
    content: `밀롱가 끝나고 먹는 국밥이 제일 맛있는 거 아시죠? 국룰입니다. 🍲`,
    media: [{ url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', type: 'image' }],
    likesCount: 75, reactionCounts: { LIKE: 45, FIRE: 30 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_19', userName: 'Ethan', userPhoto: 'https://i.pravatar.cc/150?u=plaza19', category: 'REVIEW', targets: ['tango', 'plaza'],
    content: `어제 워크샵 정말 유익했습니다! 마에스트로의 설명이 귀에 쏙쏙 박혔어요. 다음 워크샵도 무조건 참석입니다.`,
    likesCount: 20, reactionCounts: { LIKE: 20 }, commentsCount: 0
  },
  {
    userId: 'user_plaza_20', userName: 'Ava', userPhoto: 'https://i.pravatar.cc/150?u=plaza20', category: 'STORY', targets: ['tango', 'plaza'],
    content: `벌써 주말이 끝났다니 믿기지 않네요... 다음 밀롱가만 기다리며 이번 주도 버텨봅니다. 다들 화이팅!`,
    likesCount: 38, reactionCounts: { SAD: 18, LOVE: 20 }, commentsCount: 0
  }
];

// Seed logic
async function main() {
  console.log('🚀 Starting Plaza Feed Seeding Script...\n');
  const batch = db.batch();

  let postIds = [];

  // Create Posts
  for (const post of POSTS) {
    const docRef = db.collection('feeds').doc();
    const createdAtDate = randomDate(PAST_DATE, new Date());
    
    batch.set(docRef, {
      ...post,
      createdAt: FieldValue.serverTimestamp(), // We use serverTimestamp for fresh seeding
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    postIds.push({ id: docRef.id, ref: docRef, data: post });
    console.log(`📝 Prepared Post: [${post.category}] ${post.userName} - ${post.content.substring(0, 20)}...`);
  }

  // Add Comments and Nested Comments to a specific post (post_index 9 - TangoBeginner)
  const targetPost = postIds[9];
  if (targetPost) {
    console.log(`\n💬 Adding comments to post by ${targetPost.data.userName}`);
    
    // Comment 1
    const comment1Ref = db.collection(`feeds/${targetPost.id}/comments`).doc();
    batch.set(comment1Ref, {
      userId: 'user_plaza_3',
      userName: 'TangoDJ_Chris',
      userPhoto: 'https://i.pravatar.cc/150?u=plaza3',
      content: '와! 첫 데뷔 축하드립니다!! 처음이 제일 떨리죠 ㅎㅎ',
      parentId: null,
      repliesCount: 1,
      createdAt: FieldValue.serverTimestamp()
    });

    // Reply to Comment 1
    const reply1Ref = db.collection(`feeds/${targetPost.id}/comments`).doc();
    batch.set(reply1Ref, {
      userId: 'user_plaza_10',
      userName: 'TangoBeginner',
      userPhoto: 'https://i.pravatar.cc/150?u=plaza10',
      content: '크리스님 음악 너무 좋았어요! 감사합니다 ㅠㅠ',
      parentId: comment1Ref.id,
      repliesCount: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    // Comment 2
    const comment2Ref = db.collection(`feeds/${targetPost.id}/comments`).doc();
    batch.set(comment2Ref, {
      userId: 'user_plaza_6',
      userName: 'DanceHolik',
      userPhoto: 'https://i.pravatar.cc/150?u=plaza6',
      content: '어제 춤추는 거 봤어요! 초보라고 믿기지 않게 자세가 너무 좋으시던데요?👍',
      parentId: null,
      repliesCount: 2,
      createdAt: FieldValue.serverTimestamp()
    });

    // Reply to Comment 2
    const reply2Ref = db.collection(`feeds/${targetPost.id}/comments`).doc();
    batch.set(reply2Ref, {
      userId: 'user_plaza_10',
      userName: 'TangoBeginner',
      userPhoto: 'https://i.pravatar.cc/150?u=plaza10',
      content: '헉 정말요? 너무 부끄럽네요... 더 열심히 할게요!',
      parentId: comment2Ref.id,
      repliesCount: 0,
      createdAt: FieldValue.serverTimestamp()
    });
    
    const reply3Ref = db.collection(`feeds/${targetPost.id}/comments`).doc();
    batch.set(reply3Ref, {
      userId: 'user_plaza_4',
      userName: 'Maestro_Juan',
      userPhoto: 'https://i.pravatar.cc/150?u=plaza4',
      content: '저도 동의합니다. 코어 힘이 아주 좋으세요. 화이팅!',
      parentId: comment2Ref.id,
      repliesCount: 0,
      createdAt: FieldValue.serverTimestamp()
    });
  }

  // Add Comment to post_index 4 (Sarah REVIEW)
  const targetPost2 = postIds[4];
  if (targetPost2) {
    const c1 = db.collection(`feeds/${targetPost2.id}/comments`).doc();
    batch.set(c1, {
      userId: 'user_plaza_1', userName: 'Elena', userPhoto: 'https://i.pravatar.cc/150?u=plaza1',
      content: '어제 저도 갔었는데 진짜 바닥 최고였어요!!', parentId: null, repliesCount: 0, createdAt: FieldValue.serverTimestamp()
    });
    const c2 = db.collection(`feeds/${targetPost2.id}/comments`).doc();
    batch.set(c2, {
      userId: 'user_plaza_2', userName: 'Mark', userPhoto: 'https://i.pravatar.cc/150?u=plaza2',
      content: '저도 다음주에 꼭 가봐야겠네요.', parentId: null, repliesCount: 0, createdAt: FieldValue.serverTimestamp()
    });
    const c3 = db.collection(`feeds/${targetPost2.id}/comments`).doc();
    batch.set(c3, {
      userId: 'user_plaza_7', userName: 'Milonguero_Alex', userPhoto: 'https://i.pravatar.cc/150?u=plaza7',
      content: '음향 세팅 바꿨다고 사장님이 그러시더라구요 퀄리티 대박', parentId: null, repliesCount: 1, createdAt: FieldValue.serverTimestamp()
    });
    const c4 = db.collection(`feeds/${targetPost2.id}/comments`).doc();
    batch.set(c4, {
      userId: 'user_plaza_5', userName: 'Sarah', userPhoto: 'https://i.pravatar.cc/150?u=plaza5',
      content: '아하 역시 세팅을 바꾸신거였군요!', parentId: c3.id, repliesCount: 0, createdAt: FieldValue.serverTimestamp()
    });
  }


  await batch.commit();
  console.log(`\n✅ Successfully seeded ${POSTS.length} posts and their comments!`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
