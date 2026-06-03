import admin from 'firebase-admin';
import crypto from 'crypto';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const CLASS_INSTRUCTORS = [
  {
    name: "Okiz Baek",
    role: "Lead Instructor",
    userId: "rNlMcPgoapaReMXt4P0ux35WklJ2",
    avatar: "https://firebasestorage.googleapis.com/v0/b/woc-platform-seoul-1234.firebasestorage.app/o/profiles%2FrNlMcPgoapaReMXt4P0ux35WklJ2%2F1780357566204_profile?alt=media&token=dfa8e9ae-098b-47e8-be57-f206602df431"
  }
];

const NEW_CLASSES = [
  {
    title: "화)브루호 초급심화 4주",
    level: "Basic",
    amount: 50000,
    description: "초급입문 과정을 이수하신 분들을 위한 초급 심화 과정입니다.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/woc-platform-seoul-1234.firebasestorage.app/o/groups%2Ftango-brujo%2Fclasses%2Fimages%2F38e6db13-94af-4f6e-81eb-0bd23be83e2d_IMG_1530.jpeg?alt=media&token=cb014c08-d4fb-4b4b-b377-db281ea5470c",
    schedule: [
      { week: 1, date: "2026-07-07", timeSlot: "20:40 - 21:40", content: "" },
      { week: 2, date: "2026-07-14", timeSlot: "20:40 - 21:40", content: "" },
      { week: 3, date: "2026-07-21", timeSlot: "20:40 - 21:40", content: "" },
      { week: 4, date: "2026-07-28", timeSlot: "20:40 - 21:40", content: "" }
    ]
  },
  {
    title: "수)브루호 쁘락띠롱가 8주",
    level: "Intermediate",
    amount: 100000,
    description: "탱고 브루호의 수요일 Practilonga 연습 공간입니다.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/woc-platform-seoul-1234.firebasestorage.app/o/groups%2Ftango-brujo%2Fclasses%2Fimages%2F8f2e2ae1-d8fb-4c86-ad7c-6a63a4f0daff_IMG_1530.jpeg?alt=media&token=e593d08e-2703-42ed-b490-1811031cb35e",
    schedule: [
      { week: 1, date: "2026-06-10", timeSlot: "19:30 - 22:30", content: "" },
      { week: 2, date: "2026-06-17", timeSlot: "19:30 - 22:30", content: "" },
      { week: 3, date: "2026-06-24", timeSlot: "19:30 - 22:30", content: "" },
      { week: 4, date: "2026-07-01", timeSlot: "19:30 - 22:30", content: "" },
      { week: 5, date: "2026-07-08", timeSlot: "19:30 - 22:30", content: "" },
      { week: 6, date: "2026-07-15", timeSlot: "19:30 - 22:30", content: "" },
      { week: 7, date: "2026-07-22", timeSlot: "19:30 - 22:30", content: "" },
      { week: 8, date: "2026-07-29", timeSlot: "19:30 - 22:30", content: "" }
    ]
  },
  {
    title: "목)브루호 인텐시브 코스 8주",
    level: "Advanced",
    amount: 240000,
    description: "오키즈 강사님이 진행하는 목요일 탱고 인텐시브 집중 코스입니다.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/woc-platform-seoul-1234.firebasestorage.app/o/groups%2Ftango-brujo%2Fclasses%2Fimages%2F8f2e2ae1-d8fb-4c86-ad7c-6a63a4f0daff_IMG_1530.jpeg?alt=media&token=e593d08e-2703-42ed-b490-1811031cb35e",
    schedule: [
      { week: 1, date: "2026-06-11", timeSlot: "20:00 - 22:30", content: "" },
      { week: 2, date: "2026-06-18", timeSlot: "20:00 - 22:30", content: "" },
      { week: 3, date: "2026-06-25", timeSlot: "20:00 - 22:30", content: "" },
      { week: 4, date: "2026-07-02", timeSlot: "20:00 - 22:30", content: "" },
      { week: 5, date: "2026-07-09", timeSlot: "20:00 - 22:30", content: "" },
      { week: 6, date: "2026-07-16", timeSlot: "20:00 - 22:30", content: "" },
      { week: 7, date: "2026-07-23", timeSlot: "20:00 - 22:30", content: "" },
      { week: 8, date: "2026-07-30", timeSlot: "20:00 - 22:30", content: "" }
    ]
  },
  {
    title: "금)브루호 뮤지컬리티1 8주",
    level: "Intermediate",
    amount: 180000,
    description: "오키즈 & 셈로즈 강사님이 진행하는 금요일 뮤지컬리티1 정규 과정입니다.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/woc-platform-seoul-1234.firebasestorage.app/o/groups%2Ftango-brujo%2Fclasses%2Fimages%2F8f2e2ae1-d8fb-4c86-ad7c-6a63a4f0daff_IMG_1530.jpeg?alt=media&token=e593d08e-2703-42ed-b490-1811031cb35e",
    schedule: [
      { week: 1, date: "2026-06-12", timeSlot: "19:40 - 20:40", content: "" },
      { week: 2, date: "2026-06-19", timeSlot: "19:40 - 20:40", content: "" },
      { week: 3, date: "2026-06-26", timeSlot: "19:40 - 20:40", content: "" },
      { week: 4, date: "2026-07-03", timeSlot: "19:40 - 20:40", content: "" },
      { week: 5, date: "2026-07-10", timeSlot: "19:40 - 20:40", content: "" },
      { week: 6, date: "2026-07-17", timeSlot: "19:40 - 20:40", content: "" },
      { week: 7, date: "2026-07-24", timeSlot: "19:40 - 20:40", content: "" },
      { week: 8, date: "2026-07-31", timeSlot: "19:40 - 20:40", content: "" }
    ]
  },
  {
    title: "금)브루호 밀롱가1 8주",
    level: "Intermediate",
    amount: 180000,
    description: "오키즈 & 셈로즈 강사님이 진행하는 금요일 밀롱가1 정규 과정입니다.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/woc-platform-seoul-1234.firebasestorage.app/o/groups%2Ftango-brujo%2Fclasses%2Fimages%2F8f2e2ae1-d8fb-4c86-ad7c-6a63a4f0daff_IMG_1530.jpeg?alt=media&token=e593d08e-2703-42ed-b490-1811031cb35e",
    schedule: [
      { week: 1, date: "2026-06-12", timeSlot: "20:40 - 21:40", content: "" },
      { week: 2, date: "2026-06-19", timeSlot: "20:40 - 21:40", content: "" },
      { week: 3, date: "2026-06-26", timeSlot: "20:40 - 21:40", content: "" },
      { week: 4, date: "2026-07-03", timeSlot: "20:40 - 21:40", content: "" },
      { week: 5, date: "2026-07-10", timeSlot: "20:40 - 21:40", content: "" },
      { week: 6, date: "2026-07-17", timeSlot: "20:40 - 21:40", content: "" },
      { week: 7, date: "2026-07-24", timeSlot: "20:40 - 21:40", content: "" },
      { week: 8, date: "2026-07-31", timeSlot: "20:40 - 21:40", content: "" }
    ]
  }
];

async function importBrujoClasses() {
  try {
    console.log('Starting import of Brujo classes...');
    const groupRef = db.collection('groups').doc('tango-brujo');

    for (const cls of NEW_CLASSES) {
      const classId = crypto.randomUUID();
      const docRef = groupRef.collection('classes').doc(classId);

      const classData = {
        id: classId,
        groupId: "tango-brujo",
        title: cls.title,
        level: cls.level,
        classType: "Partner Class with Change",
        amount: cls.amount,
        currency: "KRW",
        startTime: "10:00",
        endTime: "11:30",
        location: "Tango Brujo",
        locationMemo: "",
        notice: "",
        description: cls.description,
        status: "Open",
        targetMonth: "2026-06",
        imageUrl: cls.imageUrl,
        videoUrl: "",
        instructorProfile: "",
        instructors: CLASS_INSTRUCTORS,
        schedule: cls.schedule,
        leaderCount: 0,
        followerCount: 0,
        maxCapacity: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await docRef.set(classData);
      console.log(`Successfully imported class: "${cls.title}" (ID: ${classId})`);
    }

    console.log('All Brujo classes have been successfully imported.');
  } catch (error) {
    console.error('Import Error:', error);
  } finally {
    process.exit(0);
  }
}

importBrujoClasses();
