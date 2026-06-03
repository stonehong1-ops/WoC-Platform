require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, collectionGroup, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// helpers from TodayPageContent.tsx
function getWeekDates(baseDate, weekOffset = 0) {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function toJsDate(ts) {
  if (!ts) return new Date(0);
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function parseDateStr(date) {
  if (!date) return "";
  if (typeof date === "string") return date.trim();
  if (typeof date.toDate === "function") {
    const d = date.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  if (date.seconds) {
    const d = new Date(date.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return "";
}

function normalizeDateStr(dStr) {
  if (!dStr) return null;
  const normalized = dStr.replace(/[.\\/]/g, "-").replace(/\s+/g, "");
  const parts = normalized.split("-");
  let y, m, d;
  if (parts.length >= 3) {
    y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
    m = parts[1].padStart(2, "0");
    d = parts[2].padStart(2, "0");
  } else if (parts.length === 2) {
    y = new Date().getFullYear().toString();
    m = parts[0].padStart(2, "0");
    d = parts[1].padStart(2, "0");
  } else {
    return null;
  }
  return new Date(`${y}-${m}-${d}T00:00:00`);
}

const parseDateToYmd = (dateVal) => {
  if (!dateVal) return "";
  const d = toJsDate(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

async function main() {
  const selectedGroupId = 'freestyle-tango';
  const selectedDate = new Date("2026-06-02T16:21:51"); // User's local time: 2026-06-02T16:21:51+09:00
  const weekDates = getWeekDates(selectedDate, 0);

  console.log("selectedDate YMD:", parseDateToYmd(selectedDate));
  console.log("weekDates YMDs:", weekDates.map(d => parseDateToYmd(d)));

  // Load Groups
  const groupsSnap = await getDocs(collection(db, 'groups'));
  const allGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const selectedGroup = allGroups.find(g => g.id === selectedGroupId);
  console.log("Found selectedGroup in DB:", !!selectedGroup, selectedGroup?.name);

  // Load Classes
  const classesSnap = await getDocs(collectionGroup(db, 'classes'));
  const allClasses = classesSnap.docs.map(d => {
    const pathSegments = d.ref.path.split('/');
    const groupId = pathSegments[1] || '';
    return {
      cls: {
        id: d.id,
        groupId,
        ...d.data()
      }
    };
  });
  console.log("Total classes loaded:", allClasses.length);

  // Load Socials
  const socialsSnap = await getDocs(collection(db, 'socials'));
  const allSocials = socialsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("Total socials loaded:", allSocials.length);

  // 1. classEvents
  const groupCls = allClasses.filter(c => c.cls.groupId === selectedGroupId).map(c => c.cls);
  console.log("groupCls count for freestyle-tango:", groupCls.length);

  const classEvents = groupCls.flatMap(cls => {
    return (cls.schedule || []).map((sch, idx) => {
      const parsedDate = sch.date ? (normalizeDateStr(parseDateStr(sch.date)) || new Date()) : new Date();
      return {
        id: `class-${cls.id}-${idx}`,
        title: cls.title,
        startDate: parsedDate.getTime(),
        type: "class",
      };
    });
  });
  console.log("classEvents generated:", classEvents.length);
  classEvents.forEach(e => {
    console.log(`  -> ClassEvent: ${e.title}, startDate timestamp: ${e.startDate}, YMD: ${parseDateToYmd(e.startDate)}`);
  });

  // 2. socialEvents
  const matchedSocials = allSocials.filter(s => 
    (selectedGroup.venueId && s.venueId === selectedGroup.venueId) || 
    (s.organizerId === selectedGroup.id) ||
    (selectedGroup.ownerId && s.organizerId === selectedGroup.ownerId)
  );
  console.log("matchedSocials count for freestyle-tango:", matchedSocials.length);

  // 3. Combined
  const allCombinedEvents = [...classEvents]; // since socialEvents is empty for this group
  console.log("allCombinedEvents count:", allCombinedEvents.length);

  const selectedDateYmd = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  console.log("selectedDateYmd:", selectedDateYmd);

  // 4. groupTodayEvents
  const groupTodayEvents = allCombinedEvents.filter(ev => parseDateToYmd(ev.startDate) === selectedDateYmd);
  console.log("groupTodayEvents count:", groupTodayEvents.length);

  // 5. groupOtherWeekEventsByDate
  const dates = weekDates.filter(d => {
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return ymd !== selectedDateYmd;
  });

  const result = [];
  dates.forEach(d => {
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const evs = allCombinedEvents.filter(ev => parseDateToYmd(ev.startDate) === ymd);
    if (evs.length > 0) {
      result.push({ date: d, ymd, events: evs });
    }
  });
  console.log("groupOtherWeekEventsByDate count:", result.length);
  result.forEach(r => {
    console.log(`  -> Date: ${r.ymd}, events count: ${r.events.length}`);
  });

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
