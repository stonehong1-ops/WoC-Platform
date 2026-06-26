import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import dotenv from "dotenv";
import path from "path";

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase config loaded for project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runTest() {
  console.log("Starting Firestore Read/Write verification for fysRegistrations...");

  const nickname = "testagent_stone_" + Date.now();
  const nicknameNormalized = nickname.trim().toLowerCase();

  const testData = {
    nickname,
    nicknameNormalized,
    depositorName: "스톤테스트",
    depositorNameNormalized: "스톤테스트",
    depositDate: "2026-06-22",
    role: "leader",
    phone: "010-9999-8888",
    memo: "테스트 자동 신청 데이터입니다.",
    selectedClassIds: ["0901-1", "0901-2", "0905-grand"],
    calculatedAmount: 92000,
    pricingSnapshot: {
      submittedAt: Timestamp.now(),
      pricingType: "mixed",
      classSubtotal: 64000,
      milongaSubtotal: 28000,
      total: 92000,
      detail: [
        { labelKo: "수퍼 얼리버드 2클래스", labelEn: "Super Early Bird", amount: 64000 },
        { labelKo: "밀롱가", labelEn: "Milonga", amount: 28000 }
      ]
    },
    paymentStatus: "pending",
    adminPaymentMemo: "",
    adminInternalMemo: "시스템 자동 검증용 테스트 데이터",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    // 1. 쓰기(Create) 테스트
    console.log("1. Writing test document to Firestore...");
    const docRef = await addDoc(collection(db, "fysRegistrations"), testData);
    console.log("✅ Write Successful! Document ID:", docRef.id);

    // 2. 읽기(Query) 테스트
    console.log("2. Querying document back from Firestore...");
    const q = query(
      collection(db, "fysRegistrations"),
      where("nicknameNormalized", "==", nicknameNormalized)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("❌ Error: Query succeeded but no document was returned!");
    }

    console.log("✅ Query Successful! Found matches:", querySnapshot.size);
    querySnapshot.forEach((d) => {
      console.log(`- Retrieved Doc ID: ${d.id}, Nickname: ${d.data().nickname}`);
    });

    console.log("\n🎉 Firestore permissions verified! Read and Write are fully functional.");
  } catch (error) {
    console.error("❌ Firestore read/write test failed with error:", error);
    process.exit(1);
  }
}

runTest();
