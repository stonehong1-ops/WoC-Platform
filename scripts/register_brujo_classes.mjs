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
  const localImg = "C:/Users/stone/.gemini/antigravity/brain/fac9e3f3-cf32-4315-ae22-0cc0330e6ce2/.user_uploaded/media__1784856575855.png";
  const destImg = "classes/tango-brujo-schedule-202608/poster.png";

  const posterUrl = await uploadImage(localImg, destImg, "image/png");

  // 공통 기본 정보
  const baseClass = {
    type: "regular",
    imageUrl: posterUrl,
    instructorIds: [],
    organizerType: "group",
    organizerId: "tango-brujo",
    venueId: "dFHFZ2z12DMVTrGxWiMm",
    location: "Tango Brujo (서울특별시 마포구 잔다리로 68)",
    status: "Open",
    instructors: [
      { name: "탱고 브루호 강사진", role: "Instructor" }
    ],
    amount: 0,
    price: 0,
    dailyClassPrice: 0,
    createdBy: creatorUid
  };

  const classes = [
    // 1. 준중급
    {
      ...baseClass,
      id: "brujo-mon-pre-intermediate-202608",
      title: "준중급 (월요일 7:40pm)",
      description: "탱고 브루호 8/9월 정규 강습\n\n• 준중급 과정 (8주)\n• 일정: 8/3(월) 개강 ~ 9/21(월) 종강 (매주 월요일 19:40 ~ 20:40)\n• 강습 신청 바로가기: https://docs.google.com/forms/d/1A0Ndk4GlJj1QATOBusTvXMOPw_lD-V41y7HYGqi-DDE/preview\n• 문의: 010-2838-4446",
      level: "Intermediate",
      schedule: {
        recurrenceType: "weekly",
        startDate: "2026-08-03",
        endDate: "2026-09-21",
        dayOfWeek: 1,
        startTime: "19:40",
        endTime: "20:40"
      },
      sessions: [
        { id: "s1", date: "2026-08-03", startTime: "19:40", endTime: "20:40" },
        { id: "s2", date: "2026-08-10", startTime: "19:40", endTime: "20:40" },
        { id: "s3", date: "2026-08-17", startTime: "19:40", endTime: "20:40" },
        { id: "s4", date: "2026-08-24", startTime: "19:40", endTime: "20:40" },
        { id: "s5", date: "2026-08-31", startTime: "19:40", endTime: "20:40" },
        { id: "s6", date: "2026-09-07", startTime: "19:40", endTime: "20:40" },
        { id: "s7", date: "2026-09-14", startTime: "19:40", endTime: "20:40" },
        { id: "s8", date: "2026-09-21", startTime: "19:40", endTime: "20:40" }
      ]
    },
    // 2. 걷기 안기
    {
      ...baseClass,
      id: "brujo-mon-walking-embracing-202608",
      title: "걷기 안기 (월요일 8:40pm)",
      description: "탱고 브루호 8/9월 정규 강습\n\n• 걷기 안기 과정 (8주)\n• 일정: 8/3(월) 개강 ~ 9/21(월) 종강 (매주 월요일 20:40 ~ 21:40)\n• 강습 신청 바로가기: https://docs.google.com/forms/d/1A0Ndk4GlJj1QATOBusTvXMOPw_lD-V41y7HYGqi-DDE/preview\n• 문의: 010-2838-4446",
      level: "Beginner",
      schedule: {
        recurrenceType: "weekly",
        startDate: "2026-08-03",
        endDate: "2026-09-21",
        dayOfWeek: 1,
        startTime: "20:40",
        endTime: "21:40"
      },
      sessions: [
        { id: "s1", date: "2026-08-03", startTime: "20:40", endTime: "21:40" },
        { id: "s2", date: "2026-08-10", startTime: "20:40", endTime: "21:40" },
        { id: "s3", date: "2026-08-17", startTime: "20:40", endTime: "21:40" },
        { id: "s4", date: "2026-08-24", startTime: "20:40", endTime: "21:40" },
        { id: "s5", date: "2026-08-31", startTime: "20:40", endTime: "21:40" },
        { id: "s6", date: "2026-09-07", startTime: "20:40", endTime: "21:40" },
        { id: "s7", date: "2026-09-14", startTime: "20:40", endTime: "21:40" },
        { id: "s8", date: "2026-09-21", startTime: "20:40", endTime: "21:40" }
      ]
    },
    // 3. 초중급
    {
      ...baseClass,
      id: "brujo-tue-intermediate-202608",
      title: "초중급 (화요일 7:40pm)",
      description: "탱고 브루호 8/9월 정규 강습\n\n• 초중급 과정 (8주)\n• 일정: 8/4(화) 개강 ~ 9/29(화) 종강 / 9/22 휴강 (매주 화요일 19:40 ~ 20:40)\n• 강습 신청 바로가기: https://docs.google.com/forms/d/1A0Ndk4GlJj1QATOBusTvXMOPw_lD-V41y7HYGqi-DDE/preview\n• 문의: 010-2838-4446",
      level: "Intermediate",
      schedule: {
        recurrenceType: "weekly",
        startDate: "2026-08-04",
        endDate: "2026-09-29",
        dayOfWeek: 2,
        startTime: "19:40",
        endTime: "20:40"
      },
      sessions: [
        { id: "s1", date: "2026-08-04", startTime: "19:40", endTime: "20:40" },
        { id: "s2", date: "2026-08-11", startTime: "19:40", endTime: "20:40" },
        { id: "s3", date: "2026-08-18", startTime: "19:40", endTime: "20:40" },
        { id: "s4", date: "2026-08-25", startTime: "19:40", endTime: "20:40" },
        { id: "s5", date: "2026-09-01", startTime: "19:40", endTime: "20:40" },
        { id: "s6", date: "2026-09-08", startTime: "19:40", endTime: "20:40" },
        { id: "s7", date: "2026-09-15", startTime: "19:40", endTime: "20:40" },
        { id: "s8", date: "2026-09-29", startTime: "19:40", endTime: "20:40" }
      ]
    },
    // 4. 초급 입문/초급 41기
    {
      ...baseClass,
      id: "brujo-tue-beginner-entry-41-202608",
      title: "초급 입문/초급 41기 (화요일 8:40pm)",
      description: "탱고 브루호 8/9월 정규 강습\n\n• 초급 입문 / 초급 41기 과정 (4주)\n• 일정: 8/4(화) 개강 ~ 8/25(화) 종강 (매주 화요일 20:40 ~ 21:40)\n• 강습 신청 바로가기: https://docs.google.com/forms/d/1A0Ndk4GlJj1QATOBusTvXMOPw_lD-V41y7HYGqi-DDE/preview\n• 문의: 010-2838-4446",
      level: "Beginner",
      schedule: {
        recurrenceType: "weekly",
        startDate: "2026-08-04",
        endDate: "2026-08-25",
        dayOfWeek: 2,
        startTime: "20:40",
        endTime: "21:40"
      },
      sessions: [
        { id: "s1", date: "2026-08-04", startTime: "20:40", endTime: "21:40" },
        { id: "s2", date: "2026-08-11", startTime: "20:40", endTime: "21:40" },
        { id: "s3", date: "2026-08-18", startTime: "20:40", endTime: "21:40" },
        { id: "s4", date: "2026-08-25", startTime: "20:40", endTime: "21:40" }
      ]
    },
    // 5. 뮤지컬리티2
    {
      ...baseClass,
      id: "brujo-fri-musicality2-202608",
      title: "뮤지컬리티2 (금요일 7:40pm)",
      description: "탱고 브루호 8/9월 정규 강습\n\n• 뮤지컬리티2 과정 (8주)\n• 일정: 8/7(금) 개강 ~ 10/2(금) 종강 / 9/25 휴강 (매주 금요일 19:40 ~ 20:40)\n• 강습 신청 바로가기: https://docs.google.com/forms/d/1A0Ndk4GlJj1QATOBusTvXMOPw_lD-V41y7HYGqi-DDE/preview\n• 문의: 010-2838-4446",
      level: "Intermediate",
      schedule: {
        recurrenceType: "weekly",
        startDate: "2026-08-07",
        endDate: "2026-10-02",
        dayOfWeek: 5,
        startTime: "19:40",
        endTime: "20:40"
      },
      sessions: [
        { id: "s1", date: "2026-08-07", startTime: "19:40", endTime: "20:40" },
        { id: "s2", date: "2026-08-14", startTime: "19:40", endTime: "20:40" },
        { id: "s3", date: "2026-08-21", startTime: "19:40", endTime: "20:40" },
        { id: "s4", date: "2026-08-28", startTime: "19:40", endTime: "20:40" },
        { id: "s5", date: "2026-09-04", startTime: "19:40", endTime: "20:40" },
        { id: "s6", date: "2026-09-11", startTime: "19:40", endTime: "20:40" },
        { id: "s7", date: "2026-09-18", startTime: "19:40", endTime: "20:40" },
        { id: "s8", date: "2026-10-02", startTime: "19:40", endTime: "20:40" }
      ]
    },
    // 6. 밀롱가2
    {
      ...baseClass,
      id: "brujo-fri-milonga2-202608",
      title: "밀롱가2 (금요일 8:40pm)",
      description: "탱고 브루호 8/9월 정규 강습\n\n• 밀롱가2 과정 (8주)\n• 일정: 8/7(금) 개강 ~ 10/2(금) 종강 / 9/25 휴강 (매주 금요일 20:40 ~ 21:40)\n• 강습 신청 바로가기: https://docs.google.com/forms/d/1A0Ndk4GlJj1QATOBusTvXMOPw_lD-V41y7HYGqi-DDE/preview\n• 문의: 010-2838-4446",
      level: "Intermediate",
      schedule: {
        recurrenceType: "weekly",
        startDate: "2026-08-07",
        endDate: "2026-10-02",
        dayOfWeek: 5,
        startTime: "20:40",
        endTime: "21:40"
      },
      sessions: [
        { id: "s1", date: "2026-08-07", startTime: "20:40", endTime: "21:40" },
        { id: "s2", date: "2026-08-14", startTime: "20:40", endTime: "21:40" },
        { id: "s3", date: "2026-08-21", startTime: "20:40", endTime: "21:40" },
        { id: "s4", date: "2026-08-28", startTime: "20:40", endTime: "21:40" },
        { id: "s5", date: "2026-09-04", startTime: "20:40", endTime: "21:40" },
        { id: "s6", date: "2026-09-11", startTime: "20:40", endTime: "21:40" },
        { id: "s7", date: "2026-09-18", startTime: "20:40", endTime: "21:40" },
        { id: "s8", date: "2026-10-02", startTime: "20:40", endTime: "21:40" }
      ]
    }
  ];

  for (const classData of classes) {
    await registerClassAndConnect(classData, "tango-brujo");
  }

  console.log("All Brujo registrations finished successfully.");
}

run().catch(console.error);
