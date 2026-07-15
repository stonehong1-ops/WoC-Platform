import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

function parseDate(field) {
  if (!field) return null;
  if (typeof field.toDate === "function") return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  if (typeof field === "string" || typeof field === "number") {
    const d = new Date(field);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

async function main() {
  const collections = await db.listCollections();
  const todayStart = new Date("2026-07-08T00:00:00+09:00");
  const todayEnd = new Date("2026-07-08T23:59:59+09:00");
  console.log("Searching all collections for documents created or updated TODAY (July 8th 2026)...");
  
  const skipList = ["chat_messages", "feeds", "plaza", "antigravity_terminal", "i18n_entries", "notifications"];
  const results = [];

  for (const coll of collections) {
    if (skipList.includes(coll.id)) continue;
    try {
      const snap = await coll.get();
      for (const d of snap.docs) {
        const data = d.data();
        const created = parseDate(data.createdAt);
        const updated = parseDate(data.updatedAt);
        
        const isCreatedToday = created && created >= todayStart && created <= todayEnd;
        const isUpdatedToday = updated && updated >= todayStart && updated <= todayEnd;

        if (isCreatedToday || isUpdatedToday) {
          results.push({
            path: d.ref.path,
            title: data.title || data.name || data.nativeName || "",
            created,
            updated
          });
        }

        // Search subcollections
        const subColls = await d.ref.listCollections();
        for (const sub of subColls) {
          if (skipList.includes(sub.id)) continue;
          try {
            const subSnap = await sub.get();
            subSnap.docs.forEach(sd => {
              const sdata = sd.data();
              const screated = parseDate(sdata.createdAt);
              const supdated = parseDate(sdata.updatedAt);
              const isSubCreatedToday = screated && screated >= todayStart && screated <= todayEnd;
              const isSubUpdatedToday = supdated && supdated >= todayStart && supdated <= todayEnd;
              if (isSubCreatedToday || isSubUpdatedToday) {
                results.push({
                  path: sd.ref.path,
                  title: sdata.title || sdata.name || sdata.nativeName || "",
                  created: screated,
                  updated: supdated
                });
              }
            });
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      console.error(`Error querying ${coll.id}:`, e.message);
    }
  }

  console.log("\nACTUAL UPDATES TODAY:");
  console.log(JSON.stringify(results, null, 2));
}
main().catch(console.error);
