// 날짜별 신규 가입 회원 수와 누적 회원 수를 집계하는 분석 스크립트.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0",
  authDomain: "woc-platform-seoul-1234.firebaseapp.com",
  projectId: "woc-platform-seoul-1234",
  storageBucket: "woc-platform-seoul-1234.firebasestorage.app",
  messagingSenderId: "1021887439599",
  appId: "1:1021887439599:web:7c5741009dd928b8fd311a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const coll = collection(db, "users");
  const snapshot = await getDocs(coll);
  
  const stats = {};
  let totalCount = 0;
  let missingCreatedAtCount = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    let seconds = null;

    if (data.createdAt) {
      if (data.createdAt.seconds !== undefined) {
        seconds = data.createdAt.seconds;
      } else if (typeof data.createdAt === 'number') {
        seconds = Math.floor(data.createdAt / 1000);
      } else if (data.createdAt.toDate) {
        seconds = Math.floor(data.createdAt.toDate().getTime() / 1000);
      } else if (typeof data.createdAt === 'string') {
        seconds = Math.floor(new Date(data.createdAt).getTime() / 1000);
      }
    }

    if (seconds) {
      // 한국 시간(KST, UTC+9) 기준으로 날짜 변환
      const kstDate = new Date((seconds * 1000) + (9 * 60 * 60 * 1000));
      const yyyy = kstDate.getUTCFullYear();
      const mm = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(kstDate.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      stats[dateStr] = (stats[dateStr] || 0) + 1;
      totalCount++;
    } else {
      missingCreatedAtCount++;
    }
  });

  const sortedDates = Object.keys(stats).sort();
  let cumulativeCount = 0;

  console.log("=== STATISTICS RESULT ===");
  console.log(`전체 회원 수: ${snapshot.size}`);
  console.log(`가입일 집계된 회원 수: ${totalCount}`);
  console.log(`가입일 누락된 회원 수: ${missingCreatedAtCount}`);
  console.log("\n| 가입 날짜 (KST) | 신규 가입자 수 | 누적 회원 수 |");
  console.log("| :--- | :---: | :---: |");
  
  sortedDates.forEach(date => {
    const dailyCount = stats[date];
    cumulativeCount += dailyCount;
    console.log(`| ${date} | ${dailyCount}명 | ${cumulativeCount}명 |`);
  });
}

run().then(() => process.exit(0)).catch(console.error);
