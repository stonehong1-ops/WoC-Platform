import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function main() {
  const snap = await db.collection("groups").doc("woc-specials").collection("classes").get();
  console.log("CLASSES UNDER woc-specials COUNT:", snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`- ID: ${d.id} | Title: ${data.title} | Status: ${data.status} | Location: ${data.location} | Created: ${data.createdAt?.toDate()}`);
  });
}
main().catch(console.error);
