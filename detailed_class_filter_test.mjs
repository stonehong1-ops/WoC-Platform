import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper functions matching clientApp / utils
function safeDate(field) {
  if (!field) return null;
  if (typeof field.toDate === "function") return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

function matchLocationGroup(selectedCity, locString) {
  if (!selectedCity || selectedCity === "ALL") return true;
  if (!locString) return false;
  const s = selectedCity.toUpperCase();
  const l = locString.toUpperCase();
  if (s === "SEOUL" && (l.includes("서울") || l.includes("SEOUL") || l.includes("역삼") || l.includes("홍대") || l.includes("합정") || l.includes("신촌") || l.includes("강남"))) return true;
  if (s === "BUSAN" && (l.includes("부산") || l.includes("BUSAN") || l.includes("서면") || l.includes("해운대"))) return true;
  if (s === "DAEGU" && (l.includes("대구") || l.includes("DAEGU"))) return true;
  if (s === "INCHEON" && (l.includes("인천") || l.includes("INCHEON"))) return true;
  if (s === "GWANGJU" && (l.includes("광주") || l.includes("GWANGJU"))) return true;
  if (s === "DAEJEON" && (l.includes("대전") || l.includes("DAEJEON") || l.includes("온아다"))) return true;
  if (s === "ULSAN" && (l.includes("울산") || l.includes("ULSAN"))) return true;
  return l.includes(s);
}

function isLocationMatch(city, itemLoc, groupLoc, groupCity) {
  if (!city || city === "ALL") return true;
  return matchLocationGroup(city, itemLoc) || matchLocationGroup(city, groupLoc) || matchLocationGroup(city, groupCity);
}

async function main() {
  // Load actual Firestore data
  const groupsSnap = await db.collection("groups").get();
  const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const venuesSnap = await db.collection("venues").get();
  const venues = venuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const classesSnap = await db.collectionGroup("classes").get();
  const allClasses = classesSnap.docs.map(d => {
    const pathSegments = d.ref.path.split("/");
    const groupId = pathSegments[1] || "";
    return { id: d.id, groupId, ...d.data() };
  });

  console.log("==================================================================");
  console.log(`📊 Firestore DB Loaded: Groups (${groups.length}), Venues (${venues.length}), Classes (${allClasses.length})`);
  console.log("==================================================================\n");

  // Today (July 8th, 2026) for testing
  const today = new Date("2026-07-08T00:00:00+09:00");
  const todayStr = today.toDateString();
  console.log(`🕒 Test Standard Date: ${today.toLocaleDateString("ko-KR")} (${todayStr})`);

  // Cities to test
  const testCities = ["ALL", "SEOUL", "BUSAN", "DAEJEON"];

  for (const city of testCities) {
    console.log(`\n------------------------------------------------------------------`);
    console.log(`📍 Testing City: ${city}`);
    console.log(`------------------------------------------------------------------`);

    // 1. TODAY Tab
    console.log("\n[1. 오늘 (TODAY) 탭]");
    const todayList = [];
    allClasses.forEach(cls => {
      if (cls.classType === "special") return;

      const group = groups.find(g => g.id === cls.groupId);
      if (!isLocationMatch(city, cls.location, group?.address || group?.name, group?.city)) return;

      cls.schedule?.forEach(s => {
        if (!s.date) return;
        const dObj = safeDate(s.date);
        if (dObj && dObj.toDateString() === todayStr) {
          if (!todayList.some(c => c.id === cls.id)) {
            todayList.push({ ...cls, scheduleEntry: s });
          }
        }
      });
    });
    console.log(`-> Matching Today Classes (${todayList.length}):`);
    todayList.forEach(c => console.log(`   - [${c.groupId}] ${c.title} | 시간: ${c.scheduleEntry.timeSlot} | 장소: ${c.location}`));

    // 2. WEEK Tab (Offset 0, 1, 2)
    console.log("\n[2. 주간 (WEEK) 탭]");
    for (let offset = 0; offset <= 2; offset++) {
      const targetWeekStart = new Date(today);
      const currentDay = targetWeekStart.getDay();
      const diffToMonday = targetWeekStart.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      targetWeekStart.setDate(diffToMonday + offset * 7);
      targetWeekStart.setHours(0,0,0,0);

      const targetWeekEnd = new Date(targetWeekStart);
      targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
      targetWeekEnd.setHours(23,59,59,999);

      const weekClasses = [];
      allClasses.forEach(cls => {
        if (cls.classType === "special") return;

        const group = groups.find(g => g.id === cls.groupId);
        if (!isLocationMatch(city, cls.location, group?.address || group?.name, group?.city)) return;

        cls.schedule?.forEach(s => {
          if (!s.date) return;
          const dObj = safeDate(s.date);
          if (dObj && dObj >= targetWeekStart && dObj <= targetWeekEnd) {
            if (!weekClasses.some(c => c.id === cls.id)) {
              weekClasses.push({ ...cls, scheduleEntry: s });
            }
          }
        });
      });
      console.log(`   * Week Offset ${offset} (${targetWeekStart.toLocaleDateString("ko-KR")} ~ ${targetWeekEnd.toLocaleDateString("ko-KR")}) Count: ${weekClasses.length}`);
      weekClasses.forEach(c => console.log(`     - [${c.groupId}] ${c.title} | 날짜: ${c.scheduleEntry.date} | 시간: ${c.scheduleEntry.timeSlot}`));
    }

    // 3. MONTH Tab (Regular Class Studios)
    console.log("\n[3. 정규수업 (MONTH) 탭 스튜디오 필터링]");
    const monthlyStudios = groups.filter(g => {
      const venue = venues.find(v => v.id === g.venueId);
      const isStudio = g.tags?.some(tag => ["studio", "class"].includes(tag.toLowerCase())) || g.activeServices?.class === true;
      const match = isLocationMatch(city, venue?.address || g.address || venue?.name, g.name, g.city);
      return isStudio && match;
    });

    const mappedStudios = monthlyStudios.map(g => {
      const classCount = allClasses.filter(c => c.groupId === g.id && c.classType !== "special").length;
      return { id: g.id, name: g.name, nativeName: g.nativeName, classCount };
    });
    console.log(`-> Matching Studios (${mappedStudios.length}):`);
    mappedStudios.forEach(s => console.log(`   - [${s.id}] ${s.name} (${s.nativeName || ""}) | 운영 중인 클래스 수: ${s.classCount}`));

    // 4. SPECIAL Tab (특강)
    console.log("\n[4. 특강 (SPECIAL) 탭]");
    const specialList = allClasses.filter(cls => {
      if (cls.classType !== "special") return false;
      const group = groups.find(g => g.id === cls.groupId);
      return isLocationMatch(city, cls.location, group?.address || group?.name, group?.city);
    });
    console.log(`-> Matching Special Classes (${specialList.length}):`);
    specialList.forEach(c => console.log(`   - [${c.groupId}] ${c.title} | 날짜: ${c.schedule?.[0]?.date || ""} | 장소: ${c.location}`));
  }

  // 5. Instructor counts (for Seoul)
  console.log("\n==================================================================");
  console.log("Detailed Filter Match Check for Seoul");
  console.log("==================================================================");

  const instructorCounts = {};
  allClasses.forEach(cls => {
    if (cls.classType === "special") return;
    const group = groups.find(g => g.id === cls.groupId);
    if (!isLocationMatch("SEOUL", cls.location, group?.address || group?.name, group?.city)) return;

    cls.instructors?.forEach(inst => {
      if (inst.name) {
        instructorCounts[inst.name] = (instructorCounts[inst.name] || 0) + 1;
      }
    });
  });

  console.log("\n[강사 필터 매칭 데이터 (서울 전체 정규수업 기준)]:");
  Object.entries(instructorCounts).sort((a,b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`- ${name} (클래스 수: ${count})`);
  });
}
main().catch(console.error);
