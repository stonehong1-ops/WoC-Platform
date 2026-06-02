import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccountPath = 'c:/Users/stone/WoC/woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// 1. socials Collection (3 Milongas)
const milongasData = [
  {
    type: "regular",
    subCategory: "milonga",
    title: "AB Potluck Party",
    titleNative: "AB포트럭파티",
    startTime: "20:00",
    endTime: "23:00",
    venueName: "Arbol Tango",
    venueNameNative: "아르볼 탱고",
    venueId: "v_manual_arbol",
    organizerId: "system1",
    organizerName: "ab-tango",
    country: "KOREA",
    city: "SEOUL",
    district: "홍대",
    dayOfWeek: 5,
    recurrence: "4th",
    description: "매월 4주차 금요일 정규 포트럭파티 밀롱가",
    price: "",
    imageUrl: "",
    moments: [],
    socialEvents: [],
    staffIds: [],
    staffNames: [],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-06-01T08:00:00Z"))
  },
  {
    type: "popup",
    subCategory: "milonga",
    title: "Muronga",
    titleNative: "뮤롱가",
    startTime: "20:00",
    endTime: "01:00",
    venueName: "Andante",
    venueNameNative: "안단테",
    venueId: "QtjovOcmoPzJ8SPyeZKh",
    organizerId: "system1",
    organizerName: "ab-tango",
    country: "KOREA",
    city: "SEOUL",
    district: "홍대",
    date: admin.firestore.Timestamp.fromDate(new Date("2026-06-19T00:00:00Z")),
    description: "6월 19일 금요일 팝업 뮤롱가-안단테",
    price: "",
    imageUrl: "",
    moments: [],
    socialEvents: [],
    staffIds: [],
    staffNames: [],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-06-01T08:00:00Z"))
  },
  {
    type: "popup",
    subCategory: "milonga",
    title: "The Best Milonga",
    titleNative: "더베스트밀롱가",
    startTime: "19:00",
    endTime: "24:00",
    venueName: "Arbol Tango",
    venueNameNative: "아르볼 탱고",
    venueId: "v_manual_arbol",
    organizerId: "system1",
    organizerName: "ab-tango",
    country: "KOREA",
    city: "SEOUL",
    district: "홍대",
    date: admin.firestore.Timestamp.fromDate(new Date("2026-06-28T00:00:00Z")),
    description: "6월 28일 일요일 팝업 더베스트밀롱가",
    price: "",
    imageUrl: "",
    moments: [],
    socialEvents: [],
    staffIds: [],
    staffNames: [],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-06-01T08:00:00Z"))
  }
];

// 2. ab-tango Classes Subcollection (9 Classes)
const mondayDates = ["2026-06-08", "2026-06-15", "2026-06-22", "2026-06-29"];
const tuesdayDates = ["2026-06-09", "2026-06-16", "2026-06-23", "2026-06-30"];
const wednesdayDates = ["2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24"];
const thursdayDates = ["2026-06-11", "2026-06-18", "2026-06-25"];
const sundayDates = ["2026-06-21"];

const classesData = [
  {
    title: "탱고베이직",
    description: "아르볼 & 보스케와 함께하는 낮시간 탱고 베이직 탄탄히 다지기 강습",
    level: "Basic",
    startTime: "11:40",
    endTime: "12:30",
    dates: mondayDates
  },
  {
    title: "탱고베이직응용",
    description: "기초를 넘어 다양한 변주와 아름다운 커넥션을 위한 베이직 실전 응용",
    level: "Beginner",
    startTime: "12:40",
    endTime: "13:30",
    dates: mondayDates
  },
  {
    title: "밀롱가&발스1",
    description: "경쾌한 밀롱가 리듬과 우아한 발스 선율을 타고 노는 초중급 테크닉",
    level: "Intermediate",
    startTime: "19:40",
    endTime: "21:00",
    dates: mondayDates
  },
  {
    title: "실전 시퀀스1",
    description: "실전 밀롱가 플로어에서 유연하게 사용하는 핵심 패턴 및 즉흥 시퀀스",
    level: "Intermediate",
    startTime: "21:10",
    endTime: "22:00",
    dates: mondayDates
  },
  {
    title: "밀롱가&발스2",
    description: "더 깊이 있는 리듬 쪼개기와 디테일한 포옹의 밀롱가 & 발스 심화 강습",
    level: "Intermediate",
    startTime: "19:40",
    endTime: "21:00",
    dates: tuesdayDates
  },
  {
    title: "실전 시퀀스2",
    description: "다이내믹한 음악적 표현과 유려한 라인 표현을 위한 실전 고급 시퀀스",
    level: "Intermediate",
    startTime: "21:10",
    endTime: "22:00",
    dates: tuesdayDates
  },
  {
    title: "실전고급시퀀스 &땅게라표현 (홍대)",
    description: "고급 탱고를 위한 파워풀한 무브먼트와 여성을 위한 다채로운 아도르노 테크닉",
    level: "Advanced",
    startTime: "20:00",
    endTime: "22:00",
    dates: wednesdayDates
  },
  {
    title: "탱고다지기(홍대)",
    description: "올바른 축과 자세, 안정감 있는 커넥션을 확실하게 다지는 코어 중심 워크숍",
    level: "Intermediate",
    startTime: "20:00",
    endTime: "22:00",
    dates: thursdayDates
  },
  {
    title: "에너지의 활용 (특강)",
    description: "춤에 살아있는 텐션과 밀도를 더해주는 신체 에너지 운용에 관한 정밀 마스터특강",
    level: "Masterclass",
    startTime: "14:10",
    endTime: "16:30",
    dates: sundayDates
  }
];

async function seedAbJuneSchedule() {
  console.log("Starting batch seeding of AB Tango June schedules...");
  
  // 1. Seed Milongas
  const socialsRef = db.collection('socials');
  let milongaCount = 0;
  for (const mil of milongasData) {
    try {
      const docRef = await socialsRef.add(mil);
      console.log(`[Milonga Success] ${mil.titleNative} -> Doc ID: ${docRef.id}`);
      milongaCount++;
    } catch (e) {
      console.error(`[Milonga Failed] ${mil.titleNative}`, e);
    }
  }

  // 2. Seed classes under groups/ab-tango/classes
  const classesRef = db.collection('groups').doc('ab-tango').collection('classes');
  let classCount = 0;
  
  const baseCreatedAt = admin.firestore.Timestamp.fromDate(new Date("2026-06-01T08:00:00Z"));
  
  for (const cls of classesData) {
    // Generate schedule entries
    const scheduleEntries = cls.dates.map((dateStr, index) => ({
      week: index + 1,
      date: dateStr,
      timeSlot: `${cls.startTime}~${cls.endTime}`,
      content: `${index + 1}주차 강습`
    }));

    const docData = {
      title: cls.title,
      description: cls.description,
      level: cls.level,
      currency: "KRW",
      amount: 0,
      price: 0,
      instructors: [
        {
          name: "arbol",
          role: "Instructor"
        },
        {
          name: "bosque",
          role: "Instructor"
        }
      ],
      schedule: scheduleEntries,
      status: "Open",
      targetMonth: "2026-06",
      startTime: cls.startTime,
      endTime: cls.endTime,
      location: "아르볼 탱고 (홍대)",
      createdAt: baseCreatedAt
    };

    try {
      const docRef = await classesRef.add(docData);
      console.log(`[Class Success] ${cls.title} -> Doc ID: ${docRef.id}`);
      classCount++;
    } catch (e) {
      console.error(`[Class Failed] ${cls.title}`, e);
    }
  }

  console.log("Seeding process completed.");
  console.log(`Successfully seeded ${milongaCount} milongas.`);
  console.log(`Successfully seeded ${classCount} classes.`);
}

seedAbJuneSchedule().catch(err => {
  console.error("Batch seeding failed:", err);
  process.exit(1);
});
