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

const groupId = "juni-yujin-tango";

// 로컬 이미지 경로
const localImageVeteran = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783457508404.png";
const localImageBasic = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/media__1783457514660.png";

// Storage 업로드 경로
const destVeteran = `groups/${groupId}/classes/lets-go-veteran-202607.png`;
const destBasic = `groups/${groupId}/classes/lets-go-basic-202607.png`;

async function uploadImage(localPath, destPath) {
  console.log(`Uploading ${localPath} to ${destPath}...`);
  const fileRef = bucket.file(destPath);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: {
      contentType: 'image/png'
    }
  });
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/woc-platform-seoul-1234.firebasestorage.app/${destPath}`;
  console.log(`Successfully uploaded. URL: ${url}`);
  return url;
}

const instructors = [
  {
    role: "Instructor",
    name: "주니 y 유진",
    userId: "juni_yujin"
  }
];

const classesData = [
  {
    id: "lets_go_veteran_202607",
    title: "Let's Go Veteran (월)",
    description: "탱고경력자들의 안정감있는 춤추기를 위한 4개월 속성반\n\n- 대상: 탱고 입문 2년 이상 땅게라와 땅게로\n- 주요주제: 히로와 엔로스케, 아도르노\n- 장소: 탱고빠시온 (마포구 월드컵북로6길 69 지하 1층)\n\n탱고경력은 있지만 다양한 분들과의 훈련이 필요하시다면!\n알고있는 탱고가 아니라 행동하고 반응하는 탱고를 원하신다면!!!\n문의주세요!!!",
    level: "Intermediate",
    startTime: "19:30",
    endTime: "21:20",
    dates: ["2026-07-20", "2026-07-27", "2026-08-03", "2026-08-10"],
    content: "히로와 엔로스케, 아도르노 특강",
    localImgPath: localImageVeteran,
    destStoragePath: destVeteran
  },
  {
    id: "lets_go_basic_202607",
    title: "Let's Go Basic (목)",
    description: "탱고경력자들을 위한 베이직 되새기기와 실전훈련\n\n- 대상: 탱고 입문 2년 이상 땅게라와 땅게로\n- 주요주제: 실전 테크닉 1 (기본기 강화와 고급 피겨의 결합 - 레보떼, 오초꼬르따도, 엔간체)\n- 장소: 탱고빠시온 (마포구 월드컵북로6길 69 지하 1층)\n\n※ 쁘락띠까: 수업 후 20:45 ~ 23:00 진행되며 비수강생도 참여 가능합니다 (유료).",
    level: "Beginner",
    startTime: "19:45",
    endTime: "20:45",
    dates: ["2026-07-16", "2026-07-23", "2026-07-30", "2026-08-06"],
    content: "실전 테크닉 1 (레보떼, 오초꼬르따도, 엔간체)",
    localImgPath: localImageBasic,
    destStoragePath: destBasic
  }
];

async function run() {
  console.log("Starting Juni & Yujin classes registration...");

  for (const c of classesData) {
    // 1. 이미지 업로드
    const imageUrl = await uploadImage(c.localImgPath, c.destStoragePath);

    // 2. 스케줄 객체 배열 빌드
    const schedule = c.dates.map((dateStr, idx) => ({
      week: idx + 1,
      date: dateStr,
      timeSlot: `${c.startTime} - ${c.endTime}`,
      content: c.content
    }));

    // 3. Firestore 데이터 셋팅
    const classDocData = {
      id: c.id,
      groupId: groupId,
      title: c.title,
      description: c.description,
      level: c.level,
      currency: "KRW",
      amount: 0,
      price: 0,
      imageUrl: imageUrl,
      instructors: instructors,
      schedule: schedule,
      status: "Open",
      targetMonth: "2026-07",
      startTime: c.startTime,
      endTime: c.endTime,
      location: "탱고빠시온 (마포구 월드컵북로6길 69 지하 1층)",
      classType: "Partner Class",
      leaderCount: 0,
      followerCount: 0,
      maxCapacity: 0,
      createdAt: Date.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection("groups").doc(groupId).collection("classes").doc(c.id);
    await docRef.set(classDocData);
    console.log(`Firestore registration complete: ${c.title} (${c.id})`);
  }

  console.log("All tasks completed successfully.");
}

run().catch(console.error);
