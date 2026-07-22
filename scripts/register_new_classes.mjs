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

async function uploadImage(localPath, destPath, contentType) {
  console.log(`Uploading ${localPath} to ${destPath}...`);
  const fileRef = bucket.file(destPath);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType }
  });
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/${destPath}`;
  console.log(`Uploaded. URL: ${url}`);
  return url;
}

async function registerClassAndConnect(classData, targetGroupId) {
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Class 문서 생성
  const classRef = db.collection('classes').doc(classData.id);
  const finalClassData = {
    ...classData,
    connectedGroupIds: targetGroupId ? [targetGroupId] : [],
    createdAt: now,
    updatedAt: now
  };
  batch.set(classRef, finalClassData);

  // 2. Group Connection 생성 (필요 시)
  if (targetGroupId) {
    const connectionId = `${classData.id}_${targetGroupId}`;
    const connRef = db.collection('classGroupConnections').doc(connectionId);
    batch.set(connRef, {
      id: connectionId,
      classId: classData.id,
      groupId: targetGroupId,
      status: 'SELLER_CONFIRMED',
      requestedBy: classData.createdBy,
      approvedBy: classData.createdBy,
      createdAt: now,
      updatedAt: now
    });
  }

  await batch.commit();
  console.log(`Successfully registered and connected class: ${classData.id}`);
}

async function run() {
  const creatorUid = "25mjwPlqr1Oxbd8blYRR20HJ6U32"; // 스톤님 UID

  // --- 1. 7월 오초 트레이닝 ---
  const ellyUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783463012445.jpg",
    "classes/studio-elly-ocho-training-202607/poster.jpg",
    "image/jpeg"
  );
  
  const ellyClass = {
    id: "studio-elly-ocho-training-202607",
    type: "regular",
    title: "7월 오초 트레이닝 (토요일)",
    description: "엘리와 지운의 트레이닝 특강\n오초가 바뀌면, 탱고가 달라집니다. 오초를 많이 연습하는 것보다 중요한 것은 올바르게 연습하는 것입니다.\n\n이번 4주 트레이닝에서는 단순히 스텝을 외우는 것이 아니라, 몸의 원리를 이해하고 안정적인 축과 부드러운 피벗을 만들어 자연스럽게 연결하는 방법을 배웁니다.\n\n• 중심축(Axis)과 디소시에이션의 이해\n• 안정적인 피벗 만들기\n• 오초 아델란떼 & 오초 아뜨라스 완성\n• 자연스럽고 편안한 연결",
    level: "Beginner",
    imageUrl: ellyUrl,
    instructorIds: [],
    organizerType: "group",
    organizerId: "studio-elly",
    venueId: "Gq18RHjLp084r8JpIeEl",
    location: "Studio Elly (연남동 563-10 지하)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-07-18",
      endDate: "2026-08-08",
      dayOfWeek: 6,
      startTime: "16:00",
      endTime: "17:00"
    },
    sessions: [
      { id: "s1", date: "2026-07-18", startTime: "16:00", endTime: "17:00" },
      { id: "s2", date: "2026-07-25", startTime: "16:00", endTime: "17:00" },
      { id: "s3", date: "2026-08-01", startTime: "16:00", endTime: "17:00" },
      { id: "s4", date: "2026-08-08", startTime: "16:00", endTime: "17:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0
    },
    status: "Open",
    instructors: [
      { name: "엘리", role: "Instructor" },
      { name: "지운", role: "Instructor" }
    ],
    amount: 0,
    price: 0,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };
  await registerClassAndConnect(ellyClass, "studio-elly");


  // --- 2. 밀롱가 한 곡 완성반 ---
  const iataUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784540446245.png",
    "classes/tangolife-milonga-complete-202607/poster.png",
    "image/png"
  );

  const iataClass = {
    id: "tangolife-milonga-complete-202607",
    type: "regular",
    title: "밀롱가 한 곡 완성반",
    description: "뮤지컬리티의 제왕, 훌리안 & 나탈리아 초청 특강\n밀롱가, 이제는 음악이 들리기 시작합니다!\n신나는 밀롱가 음악은 좋은데, 막상 밀롱가에서 추려니 긴장되고 리듬 타기가 어렵다면?\n5주 후, 한 곡을 자신 있게 완성하는 경험을 해보세요.\n\n• 강사: 훌리안 & 나탈리아 (Julian & Natalia)\n• 시간: 매주 목요일 20:00 ~ 22:10 (총 5주)\n• 수강료: 1인 22만원, 커플 40만원\n• 수납계좌: 카카오뱅크 3333-18-8414917 김규호\n• 모집 정원: 선착순 5커플 (총 10명)",
    level: "Intermediate",
    imageUrl: iataUrl,
    instructorIds: [],
    organizerType: "group",
    organizerId: "tangolife",
    venueId: "Z8XjPNw7il0B9zilFPGx",
    location: "TangoLife (서울특별시 강남구 역삼로 109)",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-07-23",
      endDate: "2026-08-20",
      dayOfWeek: 4,
      startTime: "20:00",
      endTime: "22:10"
    },
    sessions: [
      { id: "s1", date: "2026-07-23", startTime: "20:00", endTime: "22:10" },
      { id: "s2", date: "2026-07-30", startTime: "20:00", endTime: "22:10" },
      { id: "s3", date: "2026-08-06", startTime: "20:00", endTime: "22:10" },
      { id: "s4", date: "2026-08-13", startTime: "20:00", endTime: "22:10" },
      { id: "s5", date: "2026-08-20", startTime: "20:00", endTime: "22:10" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0,
      bundle: 220000
    },
    status: "Open",
    instructors: [
      { name: "Julian", role: "Instructor" },
      { name: "Natalia", role: "Instructor" }
    ],
    amount: 220000,
    price: 220000,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };
  await registerClassAndConnect(iataClass, "tangolife");


  // --- 3. 쁘락 달트랑 7월 발스 특강 ---
  const daltrangUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784541225251.png",
    "classes/practica-daltrang-vals-202607/poster.png",
    "image/png"
  );

  const daltrangClass = {
    id: "practica-daltrang-vals-202607",
    type: "special",
    title: "쁘락 달트랑 7월 발스 특강",
    description: "달자 & 트레이시의 7월 발스 특강\n\n• 레슨 주제: 발스(Vals) - 밀롱가에서 자주 쓰이는 실용 스텝\n• 구성: 1시간 20분 수업 + 40분 가이드 쁘락\n• 수강료: 1일 수강 1인 15,000원, 커플 25,000원\n• 신청 양식: https://forms.gle/nFaz5Hz8K48ku9i69\n• 대상: 탱고 경력 1년 이상 숙련자",
    level: "Intermediate",
    imageUrl: daltrangUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "HT5MODxCgWPHs3abmXng",
    location: "소셜탱고 (서울특별시 마포구 동교로 201 4층)",
    schedule: {
      recurrenceType: "none",
      startDate: "2026-07-24",
      endDate: "2026-07-31"
    },
    sessions: [
      { id: "s1", date: "2026-07-24", startTime: "20:00", endTime: "22:00" },
      { id: "s2", date: "2026-07-31", startTime: "20:00", endTime: "22:00" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 15000
    },
    status: "Open",
    instructors: [
      { name: "달자", role: "Instructor" },
      { name: "트레이시", role: "Instructor" }
    ],
    amount: 15000,
    price: 15000,
    dailyClassPrice: 15000,
    createdBy: creatorUid
  };
  await registerClassAndConnect(daltrangClass, null);


  // --- 4. 데이비드 밀롱가 특강 시즌 2 ---
  const davidUrl = await uploadImage(
    "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1784541271229.png",
    "classes/david-kim-milonga-season2-part2/poster.jpg",
    "image/jpeg"
  );

  const davidClass = {
    id: "david-kim-milonga-season2-part2",
    type: "regular",
    title: "실전 밀롱가 고급 테크닉 (데이비드 밀롱가 특강 시즌 2 - 2탄)",
    description: "귀여운 카리스마 & 데이비드의 실전 밀롱가 테크닉 특강\n밀롱가는 가장 추기 쉬운 장르입니다!\n\n• 강사: 데이비드 & 귀여운 카리스마 (David Kim)\n• 장소: 탱고 빠시온 (Tango Pasion)\n• 시간: 임시 가등록 상태 (화요일 20:00 ~ 21:30)\n• 수강료: 상세 문의 바랍니다.",
    level: "Intermediate",
    imageUrl: davidUrl,
    instructorIds: [],
    organizerType: "person",
    organizerId: creatorUid,
    venueId: "zM1i7XFth8H6KbODpb1O",
    location: "탱고 빠시온",
    schedule: {
      recurrenceType: "weekly",
      startDate: "2026-07-21",
      endDate: "2026-08-11",
      dayOfWeek: 2,
      startTime: "20:00",
      endTime: "21:30"
    },
    sessions: [
      { id: "s1", date: "2026-07-21", startTime: "20:00", endTime: "21:30" },
      { id: "s2", date: "2026-07-28", startTime: "20:00", endTime: "21:30" },
      { id: "s3", date: "2026-08-04", startTime: "20:00", endTime: "21:30" },
      { id: "s4", date: "2026-08-11", startTime: "20:00", endTime: "21:30" }
    ],
    pricing: {
      currency: "KRW",
      dropIn: 0
    },
    status: "Open",
    instructors: [
      { name: "David Kim", role: "Instructor" },
      { name: "귀여운 카리스마", role: "Instructor" }
    ],
    amount: 0,
    price: 0,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };
  await registerClassAndConnect(davidClass, null);

  console.log("All registrations finished successfully.");
}

run().catch(console.error);
