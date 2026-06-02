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

// 35 regular practicas in Seoul
const practicasData = [
  // === MONDAY (6) ===
  {
    title: "Pista Day Practica",
    titleNative: "피스타 낮 쁘락띠카",
    startTime: "14:00",
    endTime: "18:00",
    venueName: "Tango Pista",
    venueNameNative: "탕고 피스타",
    venueId: "xVJsZb5y34WjlqP5iHDr",
    organizerName: "추우",
    dayOfWeek: 1,
    district: "홍대"
  },
  {
    title: "Free Style Practica",
    titleNative: "자율 쁘락띠카",
    startTime: "19:00",
    endTime: "24:00",
    venueName: "Tango Pista",
    venueNameNative: "탕고 피스타",
    venueId: "xVJsZb5y34WjlqP5iHDr",
    organizerName: "코난",
    dayOfWeek: 1,
    district: "홍대"
  },
  {
    title: "Practica M",
    titleNative: "쁘락띠까 M",
    startTime: "19:30",
    endTime: "23:30",
    venueName: "Otra",
    venueNameNative: "오트라",
    venueId: "v_manual_otra",
    organizerName: "엘리스 y 범이",
    dayOfWeek: 1,
    district: "홍대"
  },
  {
    title: "Social Tango Day Practica",
    titleNative: "소셜 탱고 낮쁘락",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Socialtango Academy",
    venueNameNative: "소셜탱고 아카데미",
    venueId: "v_manual_socialtango",
    organizerName: "",
    dayOfWeek: 1,
    district: "홍대"
  },
  {
    title: "RYU PRACTICA",
    titleNative: "RYU PRACTICA",
    startTime: "19:20",
    endTime: "22:00",
    venueName: "RYU Studio",
    venueNameNative: "류 스튜디오",
    venueId: "v_manual_ryu",
    organizerName: "",
    description: "연남점 역전할머니맥주 건물 4층",
    dayOfWeek: 1,
    district: "홍대"
  },
  {
    title: "Weekday Day Practica",
    titleNative: "평일 낮쁘락",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Tango Hwasuon",
    venueNameNative: "탱고화시온",
    venueId: "v_manual_hwasuon",
    organizerName: "주니 y 유진",
    dayOfWeek: 1,
    district: "강남"
  },

  // === TUESDAY (6) ===
  {
    title: "Pista Day Practica",
    titleNative: "피스타 낮 쁘락띠카",
    startTime: "14:00",
    endTime: "18:00",
    venueName: "Tango Pista",
    venueNameNative: "탕고 피스타",
    venueId: "xVJsZb5y34WjlqP5iHDr",
    organizerName: "추우",
    dayOfWeek: 2,
    district: "홍대"
  },
  {
    title: "EG Practica",
    titleNative: "EG Practica",
    startTime: "20:00",
    endTime: "23:00",
    venueName: "Club Troilo",
    venueNameNative: "클럽 트로일로",
    venueId: "v_manual_troilo",
    organizerName: "Guwoo y Epitone",
    description: "20:00~20:55 All About Connection / 공휴일은 쉽니다.",
    dayOfWeek: 2,
    district: "홍대"
  },
  {
    title: "Hwaen Practica",
    titleNative: "화엔쁘락",
    startTime: "14:00",
    endTime: "17:00",
    venueName: "En Paz Studio",
    venueNameNative: "앤파 스튜디오",
    venueId: "79lEMskDvGUQQW4o4ZHx",
    organizerName: "반달이",
    dayOfWeek: 2,
    district: "강남"
  },
  {
    title: "Social Tango Day Practica",
    titleNative: "소셜 탱고 낮쁘락",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Socialtango Academy",
    venueNameNative: "소셜탱고 아카데미",
    venueId: "v_manual_socialtango",
    organizerName: "",
    dayOfWeek: 2,
    district: "홍대"
  },
  {
    title: "Manner Practica",
    titleNative: "매너쁘락",
    startTime: "21:00",
    endTime: "24:00",
    venueName: "Ocho",
    venueNameNative: "오초",
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    organizerName: "",
    dayOfWeek: 2,
    district: "홍대"
  },
  {
    title: "Weekday Day Practica",
    titleNative: "평일 낮쁘락",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Tango Pasion",
    venueNameNative: "탱고파시온",
    venueId: "v_manual_pasion",
    organizerName: "주니 y 유진",
    dayOfWeek: 2,
    district: "홍대"
  },

  // === WEDNESDAY (6) ===
  {
    title: "Practical Sequence & Practica",
    titleNative: "실전 시퀀스 및 쁘락티카",
    startTime: "19:10",
    endTime: "23:00",
    venueName: "Arbol Tango",
    venueNameNative: "아르볼",
    venueId: "v_manual_arbol",
    organizerName: "아르볼 y 보스케",
    dayOfWeek: 3,
    district: "홍대"
  },
  {
    title: "Maximo Practica",
    titleNative: "막시모 쁘락",
    startTime: "20:00",
    endTime: "23:00",
    venueName: "RYU Studio",
    venueNameNative: "류 스튜디오",
    venueId: "v_manual_ryu",
    organizerName: "범범 y 지아",
    dayOfWeek: 3,
    district: "홍대"
  },
  {
    title: "Solo Tango Wednesday Practica",
    titleNative: "Solo Tango 수요쁘락",
    startTime: "20:00",
    endTime: "23:00",
    venueName: "Solo Tango",
    venueNameNative: "솔로탱고 아카데미",
    venueId: "v_manual_solotango",
    organizerName: "",
    dayOfWeek: 3,
    district: "홍대"
  },
  {
    title: "Luminoso Practica",
    titleNative: "Luminoso Practica",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Ocho",
    venueNameNative: "오초",
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    organizerName: "미키",
    dayOfWeek: 3,
    district: "홍대"
  },
  {
    title: "Practica TangTangTang",
    titleNative: "쁘락띠까 땅땅땅",
    startTime: "20:00",
    endTime: "22:00",
    venueName: "Leendance",
    venueNameNative: "린댄스연습실",
    venueId: "v_manual_leendance",
    organizerName: "",
    dayOfWeek: 3,
    district: "홍대"
  },
  {
    title: "Weekday Day Practica",
    titleNative: "평일 낮쁘락",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Tango Pasion",
    venueNameNative: "탱고파시온",
    venueId: "v_manual_pasion",
    organizerName: "사라",
    dayOfWeek: 3,
    district: "홍대"
  },

  // === THURSDAY (5) ===
  {
    title: "Pista Day Practica",
    titleNative: "피스타 낮 쁘락띠카",
    startTime: "14:00",
    endTime: "18:00",
    venueName: "Tango Pista",
    venueNameNative: "탕고 피스타",
    venueId: "xVJsZb5y34WjlqP5iHDr",
    organizerName: "추우",
    dayOfWeek: 4,
    district: "홍대"
  },
  {
    title: "Pista Practica",
    titleNative: "피스타 쁘락띠카",
    startTime: "19:00",
    endTime: "24:00",
    venueName: "Tango Pista",
    venueNameNative: "탕고 피스타",
    venueId: "xVJsZb5y34WjlqP5iHDr",
    organizerName: "코난",
    description: "가이드 없는 자율 쁘락 *4인용 발레바 있어요!",
    dayOfWeek: 4,
    district: "홍대"
  },
  {
    title: "AB Practica",
    titleNative: "AB쁘락",
    startTime: "16:00",
    endTime: "19:00",
    venueName: "Ocho",
    venueNameNative: "오초",
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    organizerName: "아르볼 y 보스케",
    dayOfWeek: 4,
    district: "홍대"
  },
  {
    title: "Our Town Dance Troupe",
    titleNative: "우리동네무용단",
    startTime: "20:45",
    endTime: "23:00",
    venueName: "Tango Pasion",
    venueNameNative: "탱고파시온",
    venueId: "v_manual_pasion",
    organizerName: "주니 y 유진",
    dayOfWeek: 4,
    district: "홍대"
  },
  {
    title: "Weekday Day Practica",
    titleNative: "평일 낮쁘락",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Tango Pasion",
    venueNameNative: "탱고파시온",
    venueId: "v_manual_pasion",
    organizerName: "사라",
    dayOfWeek: 4,
    district: "홍대"
  },

  // === FRIDAY (3) ===
  {
    title: "Friday Practica",
    titleNative: "금요 쁘락띠까",
    startTime: "14:00",
    endTime: "17:00",
    venueName: "En Paz Studio",
    venueNameNative: "앤파 스튜디오",
    venueId: "79lEMskDvGUQQW4o4ZHx",
    organizerName: "아란 & 향연",
    dayOfWeek: 5,
    district: "강남"
  },
  {
    title: "Friday Seda Practica",
    titleNative: "금요 세다 쁘락",
    startTime: "19:30",
    endTime: "21:30",
    venueName: "La Vida Studio",
    venueNameNative: "라비다 스튜디오",
    venueId: "v_manual_lavida",
    organizerName: "Cecil & Dani",
    dayOfWeek: 5,
    district: "강남"
  },
  {
    title: "Luminoso Practica",
    titleNative: "Luminoso Practica",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Ocho",
    venueNameNative: "오초",
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    organizerName: "미키",
    dayOfWeek: 5,
    district: "홍대"
  },

  // === SATURDAY (5) ===
  {
    title: "Guided Practica",
    titleNative: "Guided Practica",
    startTime: "19:30",
    endTime: "21:00",
    venueName: "Club Troilo",
    venueNameNative: "클럽 트로일로",
    venueId: "v_manual_troilo",
    organizerName: "",
    dayOfWeek: 6,
    district: "홍대"
  },
  {
    title: "Practica 100",
    titleNative: "쁘락100",
    startTime: "19:00",
    endTime: "21:30",
    venueName: "La Vida Studio",
    venueNameNative: "라비다 스튜디오",
    venueId: "v_manual_lavida",
    organizerName: "Dani",
    dayOfWeek: 6,
    district: "강남"
  },
  {
    title: "Vamos Juntos Tango Practica",
    titleNative: "¡VAMOS JUNTOS! TANGO PRACTICA",
    startTime: "13:00",
    endTime: "17:00",
    venueName: "Ocho",
    venueNameNative: "오초",
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    organizerName: "",
    dayOfWeek: 6,
    district: "홍대"
  },
  {
    title: "LB Tango Practica",
    titleNative: "LB 탱고 쁘락",
    startTime: "17:00",
    endTime: "19:30",
    venueName: "Ocho",
    venueNameNative: "오초",
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    organizerName: "매파 y 라벤더",
    dayOfWeek: 6,
    district: "홍대"
  },
  {
    title: "Practica 79",
    titleNative: "쁘락79",
    startTime: "19:00",
    endTime: "21:00",
    venueName: "Tango Pasion",
    venueNameNative: "탱고파시온",
    venueId: "v_manual_pasion",
    organizerName: "미키",
    dayOfWeek: 6,
    district: "홍대"
  },

  // === SUNDAY (4) ===
  {
    title: "Jiwoon & Ellie Practica",
    titleNative: "지운&엘리 쁘락띠까",
    startTime: "15:00",
    endTime: "18:00",
    venueName: "Bailamos Tango",
    venueNameNative: "바일라모스",
    venueId: "v_manual_bailamos",
    organizerName: "",
    dayOfWeek: 7,
    district: "홍대"
  },
  {
    title: "El Tango Practica",
    titleNative: "엘땅고 쁘락",
    startTime: "17:00",
    endTime: "19:00",
    venueName: "El Tango",
    venueNameNative: "엘땅고",
    venueId: "v_manual_eltango",
    organizerName: "태봉 y 피쉬",
    dayOfWeek: 7,
    district: "강남"
  },
  {
    title: "Viva Practica",
    titleNative: "비바 쁘락",
    startTime: "15:00",
    endTime: "17:00",
    venueName: "Bonita",
    venueNameNative: "보니따",
    venueId: "v_manual_bonita",
    organizerName: "",
    dayOfWeek: 7,
    district: "홍대"
  },
  {
    title: "SUNDAY PRACTICA",
    titleNative: "SUNDAY PRACTICA",
    startTime: "11:00",
    endTime: "14:00",
    venueName: "Ocho",
    venueNameNative: "오초",
    venueId: "6Z5SuLBNSGZezwBgJ5r0",
    organizerName: "",
    dayOfWeek: 7,
    district: "홍대"
  }
];

async function seedPracticas() {
  console.log(`Starting seeding of ${practicasData.length} regular practicas...`);
  const socialsRef = db.collection('socials');
  
  let successCount = 0;
  
  // Seeding base time is set to Monday, June 1, 2026 as per user direction
  const baseCreatedAt = admin.firestore.Timestamp.fromDate(new Date("2026-06-01T08:00:00Z"));
  
  for (const item of practicasData) {
    const docData = {
      type: "regular",
      subCategory: "practica",
      title: item.title,
      titleNative: item.titleNative || "",
      startTime: item.startTime,
      endTime: item.endTime,
      venueName: item.venueName,
      venueNameNative: item.venueNameNative || "",
      venueId: item.venueId || "",
      organizerId: "system1",
      organizerName: item.organizerName || "",
      organizerNameNative: "",
      country: "KOREA",
      city: "SEOUL",
      district: item.district || "홍대",
      dayOfWeek: item.dayOfWeek,
      recurrence: "every",
      description: item.description || "",
      price: "",
      imageUrl: "",
      moments: [],
      socialEvents: [],
      staffIds: [],
      staffNames: [],
      createdAt: baseCreatedAt
    };
    
    try {
      const docRef = await socialsRef.add(docData);
      console.log(`Successfully added: [${item.titleNative}] -> Document ID: ${docRef.id}`);
      successCount++;
    } catch (error) {
      console.error(`Failed to add: [${item.titleNative}]`, error);
    }
  }
  
  console.log(`Seeding completed. Successfully seeded ${successCount} / ${practicasData.length} documents.`);
}

seedPracticas().catch(err => {
  console.error("Seeding crashed:", err);
  process.exit(1);
});
