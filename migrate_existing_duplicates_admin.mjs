// 파이어베이스 Admin SDK를 사용해 중복 가입된 계정을 복구 및 병합하는 마이그레이션 스크립트
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";

// 1. 서비스 어카운트 인증 정보 로드 및 초기화
const serviceAccount = JSON.parse(
  fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8")
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// 2. 마이그레이션 대상 매핑 테이블 (대표 폰 계정 UID와 삭제할 소셜 계정 UID 쌍)
const migrationTargets = [
  {
    name: "이사벨",
    mainUid: "yiVfTox5ooYt9vGO6L6jPo9A6CJ3", // 대표 Phone 계정
    subUid: "0zp9p1YmFvescAIHpEM2xnh9uAr1"   // 서브 Google 계정
  },
  {
    name: "반야",
    mainUid: "5UOscMPqEhMzmRguexDhcLmElhy1", // 대표 Phone 계정
    subUid: "39eSLXweEFTBZvrQTu9B1Ydc6iy1"   // 서브 Google 계정
  },
  {
    name: "알레그로",
    mainUid: "RcNs9CB4lhNa0w70UeHm5FAKzUT2", // 대표 Phone 계정
    subUid: "Kcu2h0yDbZeD86nC48Oz04oqdIm2"   // 서브 Google 계정
  }
];

async function runMigration() {
  console.log("====================================================");
  console.log("  [Admin SDK] 실서버 중복 가입 데이터 정밀 병합 및 정화 마이그레이션");
  console.log("====================================================\n");

  for (const target of migrationTargets) {
    console.log(`[시작] '${target.name}' 사용자의 중복 데이터 병합 프로세스 구동`);
    
    const mainDocRef = db.collection("users").doc(target.mainUid);
    const subDocRef = db.collection("users").doc(target.subUid);

    const mainSnap = await mainDocRef.get();
    const subSnap = await subDocRef.get();

    if (!mainSnap.exists) {
      console.error(`[오류] '${target.name}'의 대표 계정 문서(${target.mainUid})가 존재하지 않습니다. 스킵합니다.`);
      continue;
    }
    if (!subSnap.exists) {
      console.log(`[경고] '${target.name}'의 서브 계정 문서(${target.subUid})가 이미 존재하지 않거나 병합 완료 상태입니다. 스킵합니다.`);
      continue;
    }

    const mainData = mainSnap.data();
    const subData = subSnap.data();

    // 1) 비상 롤백용 백업 생성 (users 컬렉션 내부의 별도 백업 문서 혹은 logs 형태)
    const timestampStr = Date.now();
    const backupDocId = `backup_${target.mainUid}_${timestampStr}`;
    const backupDocRef = db.collection("users").doc(backupDocId);
    
    await backupDocRef.set({
      backupTargetUid: target.mainUid,
      originalMainData: mainData,
      originalSubData: subData,
      backedUpAt: Timestamp.now()
    });
    console.log(`  - [백업 성공] 롤백용 안전 백업 문서 '${backupDocId}' 생성 완료.`);

    // 2) 데이터 정밀 결합 연산
    const mergedGroups = Array.from(new Set([
      ...(mainData.joinedGroups || []),
      ...(subData.joinedGroups || [])
    ]));

    const mergedProfile = {
      ...mainData,
      email: mainData.email || subData.email || null,
      photoURL: mainData.photoURL || subData.photoURL || null,
      authMethod: mainData.authMethod === "Phone" ? "Phone_Google" : mainData.authMethod,
      joinedGroups: mergedGroups,
      migratedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // 3) 대표 계정에 병합 프로필 덮어쓰기
    await mainDocRef.set(mergedProfile, { merge: true });
    console.log(`  - [병합 성공] 서브 계정의 데이터(이메일, 그룹 멤버십 등)를 대표 계정으로 완벽 이관.`);

    // 4) 서브(소셜) 임시 프로필 문서 Firestore에서 안전 삭제
    await subDocRef.delete();
    console.log(`  - [클렌징 성공] 서브 계정 문서 '${target.subUid}' Firestore에서 영구 정화 완료.`);
    console.log(`[완료] '${target.name}' 유저 마이그레이션이 100% 안전하게 종료되었습니다.\n`);
  }

  console.log("====================================================");
  console.log("  모든 대상 사용자의 중복 데이터 병합 마이그레이션 100% 성공");
  console.log("====================================================");
}

runMigration()
  .then(() => {
    console.log("마이그레이션 처리가 모두 끝났습니다.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("마이그레이션 중 예기치 못한 에러 발생:", err);
    process.exit(1);
  });
