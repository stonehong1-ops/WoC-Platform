import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function main() {
  const snap = await db.collection("groups").get();
  console.log("TOTAL GROUPS IN DB:", snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`- ID: ${d.id} | Name: ${data.name} | nativeName: ${data.nativeName} | activeServices: ${JSON.stringify(data.activeServices)} | tags: ${JSON.stringify(data.tags)}`);
  });
}
main().catch(console.error);
