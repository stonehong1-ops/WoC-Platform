import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function main() {
  const snap = await db.collection("groups").doc("tangolife").collection("members").get();
  console.log("MEMBERS COUNT FOR TANGOLIFE:", snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`- Member ID: ${d.id} | Name: ${data.name || data.displayName} | Role: ${data.role} | Status: ${data.status}`);
  });
}
main().catch(console.error);
