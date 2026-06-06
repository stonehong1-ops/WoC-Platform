import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const instructors = [
  {
    role: "Guest Champion",
    name: "Ariel Taritolay",
    userId: "ariel_taritolay"
  },
  {
    role: "Director",
    name: "Misun Kang",
    userId: "misun_kang"
  }
];

const bankDetails = {
  bankName: "국민은행",
  accountHolder: "강선미",
  accountNumber: "123-45-12345"
};

const classesData = [
  // 토요일 클래스
  {
    id: "todotango_202606_intensive",
    title: "상급 인텐시브",
    description: "아리엘 & 미선 강사의 상급 인텐시브 클래스입니다.",
    level: "Advanced",
    amount: 690000,
    startTime: "14:00",
    endTime: "15:20",
    location: "Todo Tango Studio",
    weeks: [6, 13, 20, 27]
  },
  {
    id: "todotango_202606_vals",
    title: "발스",
    description: "음악성과 흐름을 배우는 발스 클래스입니다.",
    level: "Beginner",
    amount: 80000,
    startTime: "15:30",
    endTime: "16:20",
    location: "Todo Tango Studio",
    weeks: [6, 13, 20, 27]
  },
  {
    id: "todotango_202606_walking",
    title: "걷기&안기",
    description: "탱고의 가장 본질적인 걷기와 안기를 깊이 있게 배우는 클래스입니다.",
    level: "Basic",
    amount: 80000,
    startTime: "16:30",
    endTime: "17:20",
    location: "Todo Tango Studio",
    weeks: [6, 13, 20, 27]
  },
  {
    id: "todotango_202606_beginner",
    title: "초급",
    description: "탱고 기초를 확실하게 다지는 초급 클래스입니다.",
    level: "Basic",
    amount: 80000,
    startTime: "17:30",
    endTime: "18:20",
    location: "Todo Tango Studio",
    weeks: [6, 13, 20, 27]
  },
  // 일요일 클래스
  {
    id: "todotango_202606_instructor",
    title: "강사반",
    description: "강사 수준의 테크닉과 티칭 법을 전수하는 스페셜 강사 클래스입니다.",
    level: "Advanced",
    amount: 240000,
    startTime: "13:00",
    endTime: "14:00",
    location: "Todo Tango Studio",
    weeks: [7, 14, 21, 28]
  },
  {
    id: "todotango_202606_disarli",
    title: "한곡 완성 (디살리)",
    description: "디살리 음악의 스타일을 구현해 내는 한곡 완성 클래스입니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "14:00",
    endTime: "14:50",
    location: "Todo Tango Studio",
    weeks: [7, 14, 21, 28]
  },
  {
    id: "todotango_202606_escenario",
    title: "에쎄나리오",
    description: "무대 탱고(에쎄나리오)의 연출과 화려한 테크닉을 익히는 클래스입니다.",
    level: "Advanced",
    amount: 240000,
    startTime: "15:00",
    endTime: "16:30",
    location: "Todo Tango Studio",
    weeks: [7, 14, 21, 28]
  },
  {
    id: "todotango_202606_hongdae_musicality",
    title: "홍대 뮤지컬리티",
    description: "홍대 스튜디오에서 진행되는 탱고 음악 해석과 뮤지컬리티 클래스입니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "18:30",
    endTime: "19:20",
    location: "Hongdae Studio",
    weeks: [7, 14, 21, 28]
  },
  {
    id: "todotango_202606_hongdae_milonga",
    title: "홍대 밀롱가특강반",
    description: "홍대 스튜디오에서 진행되는 스페셜 밀롱가 특강 클래스입니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "19:30",
    endTime: "20:20",
    location: "Hongdae Studio",
    weeks: [7, 14, 21, 28]
  },
  // 월요일 클래스
  {
    id: "todotango_202606_sequence",
    title: "밀롱가에서 유용한시퀀스",
    description: "실전 밀롱가에서 바로 활용할 수 있는 유용한 패턴과 시퀀스를 학습합니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "19:00",
    endTime: "19:50",
    location: "Todo Tango Studio",
    weeks: [1, 8, 15, 22, 29]
  },
  {
    id: "todotango_202606_tanguera_mon",
    title: "땅게라&땅게로 클래스 (월)",
    description: "월요일에 진행되는 땅게라와 땅게로의 역할별 정교화 클래스입니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "20:00",
    endTime: "20:50",
    location: "Todo Tango Studio",
    weeks: [1, 8, 15, 22, 29]
  },
  // 화요일 클래스 (분당실루엣 초청 특강)
  {
    id: "todotango_202606_tanguera_tue",
    title: "땅게라&땅게로 클래스 (화)",
    description: "분당실루엣 초청 특강으로 진행되는 땅게라와 땅게로의 파트너십 테크닉 클래스입니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "19:30",
    endTime: "20:20",
    location: "Bundang Silhouette",
    weeks: [2, 9, 16, 23, 30]
  },
  {
    id: "todotango_202606_milonga_tue",
    title: "밀롱가 특강 (화)",
    description: "분당실루엣 초청 특강으로 진행되는 밀롱가 스페셜 특강 클래스입니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "20:30",
    endTime: "21:20",
    location: "Bundang Silhouette",
    weeks: [2, 9, 16, 23, 30]
  },
  // 수요일 클래스
  {
    id: "todotango_202606_milonga_wed_noon",
    title: "밀롱가 특강 (수 낮)",
    description: "수요일 낮 시간에 열리는 상큼한 밀롱가 특강 클래스입니다.",
    level: "Intermediate",
    amount: 120000,
    startTime: "12:00",
    endTime: "12:50",
    location: "Todo Tango Studio",
    weeks: [3, 10, 17, 24]
  },
  {
    id: "todotango_202606_siempre",
    title: "미선특강&낮밀롱가 \"씨엠쁘레\"",
    description: "수요일 낮에 열리는 미선특강과 낮밀롱가 씨엠쁘레 세션입니다.",
    level: "Intermediate",
    amount: 0,
    startTime: "13:00",
    endTime: "16:00",
    location: "Todo Tango Studio",
    weeks: [3, 10, 17, 24]
  },
  {
    id: "todotango_202606_toppo",
    title: "자유쁘락 \"또쁘\"",
    description: "자유롭게 연습하고 춤출 수 있는 또도땅고 쁘락티카 또쁘입니다.",
    level: "Basic",
    amount: 10000,
    startTime: "19:00",
    endTime: "22:30",
    location: "Todo Tango Studio",
    weeks: [3, 10, 17, 24]
  },
  {
    id: "todotango_202606_milonga_wed_night",
    title: "밀롱가 한곡완성",
    description: "수요일 저녁에 진행되는 밀롱가 음악 해석과 실전 한곡 완성 클래스입니다.",
    level: "Intermediate",
    amount: 120000,
    startTime: "20:00",
    endTime: "20:50",
    location: "Todo Tango Studio",
    weeks: [3, 10, 17, 24]
  },
  {
    id: "todotango_202606_all_that_giro",
    title: "올 댓 히로",
    description: "탱고 턴(히로)의 모든 기술과 커넥션을 마스터하는 테마 클래스입니다.",
    level: "Intermediate",
    amount: 100000,
    startTime: "21:00",
    endTime: "21:50",
    location: "Todo Tango Studio",
    weeks: [3, 10, 17, 24]
  }
];

async function registerClassesAdmin() {
  console.log("Registering 6th month classes for Todo Tango using Admin SDK...");
  for (const c of classesData) {
    const classId = c.id;
    const schedule = c.weeks.map((dayNum, idx) => ({
      week: idx + 1,
      date: `2026-06-${String(dayNum).padStart(2, '0')}`,
      timeSlot: `${c.startTime} - ${c.endTime}`,
      content: `${idx + 1}주차 수업`
    }));

    const classDocData = {
      id: classId,
      groupId: "todo-tango",
      title: c.title,
      description: c.description,
      level: c.level,
      currency: "KRW",
      amount: c.amount,
      price: c.amount,
      instructors: instructors,
      schedule: schedule,
      status: "Open",
      targetMonth: "2026-06",
      startTime: c.startTime,
      endTime: c.endTime,
      location: c.location,
      bankName: bankDetails.bankName,
      accountHolder: bankDetails.accountHolder,
      accountNumber: bankDetails.accountNumber,
      classType: "Partner Class",
      leaderCount: 0,
      followerCount: 0,
      maxCapacity: 0,
      createdAt: Date.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection("groups").doc("todo-tango").collection("classes").doc(classId);
    await docRef.set(classDocData);
    console.log(`Successfully registered: ${c.title} (${classId})`);
  }
  console.log("All Todo Tango classes registered successfully via Admin SDK.");
}

registerClassesAdmin().catch(console.error);
