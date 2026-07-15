import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function main() {
  const d = await db.collection("users").doc("E4w5SqJ0nBTHfOkvj5yey6GpYbt2").get();
  console.log("STONE PROFILE DATA:");
  console.log(JSON.stringify(d.data(), null, 2));
}
main().catch(console.error);
