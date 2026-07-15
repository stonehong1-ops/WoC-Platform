import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function main() {
  const collections = await db.listCollections();
  const results = [];
  const skipCollections = [
    "chat_messages", "feeds", "plaza", "antigravity_terminal", 
    "i18n_entries", "i18n_versions", "notifications", "syncfit_colorbooks",
    "syncfit_messages", "syncfit_read_logs", "bookings", "stay_bookings"
  ];
  console.log("Searching all collections for tangolife/≈ ∞Ì∂Û¿Ã«¡...");
  for (const coll of collections) {
    if (skipCollections.includes(coll.id)) continue;
    
    console.log(`- Searching collection: ${coll.id}`);
    try {
      const snap = await coll.get();
      for (const d of snap.docs) {
        if (d.id === "tangolife" || d.id === "Z8XjPNw7il0B9zilFPGx" || d.id.includes("tangolife")) continue;
        const data = d.data();
        const str = JSON.stringify({ id: d.id, path: d.ref.path, ...data }).toLowerCase();
        if (str.includes("tangolife") || str.includes("≈ ∞Ì∂Û¿Ã«¡")) {
          results.push({
            path: d.ref.path,
            title: data.title || data.name || data.nativeName || ""
          });
        }
        
        // Search subcollections
        const subColls = await d.ref.listCollections();
        for (const sub of subColls) {
          if (skipCollections.includes(sub.id)) continue;
          try {
            const subSnap = await sub.get();
            subSnap.docs.forEach(sd => {
              const sdata = sd.data();
              const sstr = JSON.stringify({ id: sd.id, path: sd.ref.path, ...sdata }).toLowerCase();
              if (sstr.includes("tangolife") || sstr.includes("≈ ∞Ì∂Û¿Ã«¡")) {
                results.push({
                  path: sd.ref.path,
                  title: sdata.title || sdata.name || sdata.nativeName || ""
                });
              }
            });
          } catch (e) {
            console.error(`Error querying subcollection ${sub.id} under doc ${d.id}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error(`Error querying collection ${coll.id}:`, e.message);
    }
  }

  console.log("\nSEARCH RESULTS:");
  console.log(JSON.stringify(results, null, 2));
}
main().catch(console.error);
