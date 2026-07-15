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
  const snap = await db.collectionGroup("classes").get();
  console.log("TOTAL CLASSES IN DB:", snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`- Path: ${d.ref.path} | Title: ${data.title} | Status: ${data.status} | Created: ${parseDate(data.createdAt)}`);
  });
}
main().catch(console.error);
