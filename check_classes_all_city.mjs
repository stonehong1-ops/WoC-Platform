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

async function main() {
  const groupsSnap = await db.collection("groups").get();
  const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const classesSnap = await db.collectionGroup("classes").get();
  const allClasses = classesSnap.docs.map(d => {
    const pathSegments = d.ref.path.split("/");
    const groupId = pathSegments[1] || "";
    return { id: d.id, groupId, ...d.data() };
  });

  const today = new Date("2026-07-08T00:00:00+09:00");
  
  console.log("------------------------------------------------------------------");
  console.log("?? Testing City: ALL");
  console.log("------------------------------------------------------------------");

  // WEEK Tab (Offset 0, 1, 2)
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
    console.log(`\n* Week Offset ${offset} (${targetWeekStart.toLocaleDateString("ko-KR")} ~ ${targetWeekEnd.toLocaleDateString("ko-KR")}) Count: ${weekClasses.length}`);
    weekClasses.forEach(c => {
      if (c.groupId === "juni-yujin-tango") {
        console.log(`  - [${c.groupId}] ${c.title} | 날짜: ${c.scheduleEntry.date} | 시간: ${c.scheduleEntry.timeSlot} | 장소: ${c.location}`);
      }
    });
  }
}
main().catch(console.error);
