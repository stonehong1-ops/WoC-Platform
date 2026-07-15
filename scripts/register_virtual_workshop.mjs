import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const groupId = "woc-specials";
const classId = "lavender-emilio-dynamic-sequence-202608";
const localImagePath = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783462646905.png";
const destPath = `groups/${groupId}/classes/${classId}/poster.png`;

async function run() {
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Storage 이미지 업로드
  console.log(`Uploading local image ${localImagePath} to Storage...`);
  const fileRef = bucket.file(destPath);
  await bucket.upload(localImagePath, {
    destination: destPath,
    metadata: {
      contentType: 'image/png'
    }
  });
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/${destPath}`;
  console.log(`Uploaded successfully. URL: ${url}`);

  // 2. 가상 그룹 woc-specials 생성 (존재하지 않으면)
  console.log(`Checking/Creating virtual group: groups/${groupId}...`);
  const groupRef = db.collection('groups').doc(groupId);
  const groupSnap = await groupRef.get();
  
  if (!groupSnap.exists) {
    await groupRef.set({
      id: groupId,
      name: "WOC Specials",
      nativeName: "WOC 스페셜 워크숍 / 특강",
      slug: groupId,
      description: "소속 그룹 없이 개설되는 단발성 특강 및 특별 워크숍을 위한 가상 그룹입니다.",
      coverImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80",
      memberCount: 0,
      memberIds: [],
      posts: [],
      members: [],
      activeServices: {
        class: true,
        shop: false,
        stay: false,
        rental: false
      },
      isPublished: true,
      updatedAt: now
    });
    console.log("Virtual group created.");
  } else {
    console.log("Virtual group already exists.");
  }

  // 3. 클래스 lavender-emilio-dynamic-sequence-202608 등록
  console.log(`Registering class: groups/${groupId}/classes/${classId}...`);
  const classRef = groupRef.collection('classes').doc(classId);

  const descriptionText = `💃 더 리드미컬하게, 더 다이나믹하게!!
라벤더 & 에밀리오의 다이나믹 시퀀스 4주 워크숍

탱고의 시퀀스는 단순히 동작을 나열하는 것이 아니라, 리듬과 에너지의 변화 속에서 흐름을 만들어가는 과정입니다.
이번 워크숍은 다이나믹한 시퀀스를 주제로, 걷기와 회전, 가속과 감속, 공간의 활용을 바탕으로 밀롱가와 대회, 소셜에서 모두 활용할 수 있는 움직임들을 탐구합니다.

• 강사: 라벤더 & 에밀리오 (Lavender & Emilio)
• 시간: 매주 화요일 PM 8:00 ~ 9:30 (총 4주)
• 장소: 바모스 연습실 (서울 마포구 동교로 212-2 지하 1층)
• 대상: 탱고 경력 8개월 이상`;

  const scheduleList = [
    {
      week: 1,
      date: "2026-08-04",
      timeSlot: "20:00~21:30",
      content: "1주차: 걷기와 회전, 가속과 감속, 공간의 활용"
    },
    {
      week: 2,
      date: "2026-08-11",
      timeSlot: "20:00~21:30",
      content: "2주차: 리듬과 에너지 변화 속 흐름 만들기"
    },
    {
      week: 3,
      date: "2026-08-18",
      timeSlot: "20:00~21:30",
      content: "3주차: 움직임의 원리와 연결을 통한 응용 방법"
    },
    {
      week: 4,
      date: "2026-08-25",
      timeSlot: "20:00~21:30",
      content: "4주차: 밀롱가와 대회, 소셜에서 활용 가능한 시퀀스 실습"
    }
  ];

  await classRef.set({
    id: classId,
    groupId: groupId,
    title: "라벤더 & 에밀리오의 다이나믹 시퀀스",
    description: descriptionText,
    level: "Intermediate",
    currency: "KRW",
    price: 120000,
    imageUrl: url,
    instructors: [
      {
        name: "라벤더",
        role: "Instructor"
      },
      {
        name: "에밀리오",
        role: "Instructor"
      }
    ],
    location: "바모스 연습실 (서울 마포구 동교로 212-2 지하 1층)",
    maxCapacity: 16,
    leaderCount: 0,
    followerCount: 0,
    todayLeaderRemaining: 8,
    todayFollowerRemaining: 8,
    isTodayBookingClosed: false,
    status: "Open",
    targetMonth: "2026-08",
    notice: "구글 폼 신청 링크: https://forms.gle/yTZorQFJUxbrRNkVA\n\n개인적인 사정으로 결석 시 기간 연장 불가합니다.",
    schedule: scheduleList,
    updatedAt: now
  });

  console.log("Class registration complete.");
}

run().catch(console.error);
