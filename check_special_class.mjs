import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function main() {
  const d = await db.collection("groups").doc("special").collection("classes").doc("1301c1ed-5533-4aa1-a958-16ec0b09dc5d").get();
  console.log("SPECIAL CLASS DATA:", JSON.stringify(d.data(), null, 2));
}
main().catch(console.error);
