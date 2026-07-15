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
  const snap = await db.collection("socials").get();
  console.log("TOTAL SOCIALS IN DB:", snap.size);
  const todayStart = new Date("2026-07-08T00:00:00+09:00");
  snap.docs.forEach(d => {
    const data = d.data();
    const created = parseDate(data.createdAt);
    const updated = parseDate(data.updatedAt);
    if ((created && created >= todayStart) || (updated && updated >= todayStart)) {
      console.log(`- Social ID: ${d.id} | Title: ${data.title} | Location: ${data.venueName} | Created: ${created} | Updated: ${updated}`);
    }
  });
}
main().catch(console.error);
