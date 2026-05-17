const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  projectId: "woc-platform-seoul-1234",
  appId: "1:1021887439599:web:7c5741009dd928b8fd311a",
  storageBucket: "woc-platform-seoul-1234.firebasestorage.app",
  apiKey: "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0",
  authDomain: "woc-platform-seoul-1234.firebaseapp.com",
  messagingSenderId: "1021887439599"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const updatesFile = 'C:/Users/stone/.gemini/antigravity/brain/dc58e2cc-d9ad-4ce7-a730-2dc73b2b12b3/scratch/updates_v2.json';
const descriptionUpdates = JSON.parse(fs.readFileSync(updatesFile, 'utf8'));
const updateMap = new Map(descriptionUpdates.map(u => [u.id, u.description]));

async function applyAllUpdates() {
  console.log("Fetching all social documents...");
  try {
    const socialsCol = collection(db, 'socials');
    const snapshot = await getDocs(socialsCol);
    
    console.log(`Found ${snapshot.size} documents. Starting updates...`);
    
    let count = 0;
    for (const docSnapshot of snapshot.docs) {
      const id = docSnapshot.id;
      const updateData = { price: "KRW 13,000" };
      
      if (updateMap.has(id)) {
        updateData.description = updateMap.get(id);
        console.log(`[${++count}/${snapshot.size}] Updating price and description for: ${id}`);
      } else {
        console.log(`[${++count}/${snapshot.size}] Updating price for: ${id}`);
      }
      
      await updateDoc(doc(db, 'socials', id), updateData);
    }
    
    console.log("All updates completed successfully!");
  } catch (error) {
    console.error("An error occurred during updates:", error.message);
  } finally {
    process.exit(0);
  }
}

applyAllUpdates();
