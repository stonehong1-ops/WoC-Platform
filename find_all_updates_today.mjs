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
  if (typeof field === "string" || typeof field === "number") return new Date(field);
  return null;
}

async function main() {
  const collections = await db.listCollections();
  const todayStart = new Date("2026-07-08T00:00:00+09:00");
  console.log("Searching all collections for documents updated today...");
  
  const skipList = ["chat_messages", "feeds", "plaza", "antigravity_terminal", "i18n_entries", "notifications"];

  for (const coll of collections) {
    if (skipList.includes(coll.id)) continue;
    try {
      const snap = await coll.get();
      snap.docs.forEach(d => {
        const data = d.data();
        const created = parseDate(data.createdAt);
        const updated = parseDate(data.updatedAt || data.date);
        
        // Also check if any nested timestamp field is today
        let hasTodayField = false;
        for (const [k, v] of Object.entries(data)) {
          const parsed = parseDate(v);
          if (parsed && parsed >= todayStart) {
            hasTodayField = true;
          }
        }

        if ((created && created >= todayStart) || (updated && updated >= todayStart) || hasTodayField) {
          console.log(`- Root Doc: ${coll.id}/${d.id} | Title: ${data.title || data.name || data.nativeName || ""} | Created: ${created} | Updated: ${updated}`);
        }
      });
    } catch (e) {
      console.error(`Error querying ${coll.id}:`, e.message);
    }
  }
}
main().catch(console.error);
