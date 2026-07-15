import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function main() {
  const snap = await db.collection("groups").doc("special").collection("classes").get();
  console.log("CLASSES UNDER groups/special/classes COUNT:", snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`- ID: ${d.id} | Title: ${data.title} | Status: ${data.status} | Location: ${data.location}`);
  });
}
main().catch(console.error);
