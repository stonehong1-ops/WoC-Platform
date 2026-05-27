import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";

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

const oldUid = "9KjNhkCWb2TF5sz18NrdI26fBim1"; // 기존 휴대폰 인증 계정 UID (프로필 원본)
const newUid = "DSp7TCZ1YdcXRvoJakfjCNlLh7p2"; // 신규 구글 인증 계정 UID (채팅 활성 계정)

async function runMigration() {
  console.log("====================================================");
  console.log("  아리(Ari) 사용자 이중 계정 데이터 병합 및 프로필 복구 스크립트");
  console.log("====================================================\n");

  const oldDocRef = doc(db, "users", oldUid);
  const newDocRef = doc(db, "users", newUid);

  const oldSnap = await getDoc(oldDocRef);
  const newSnap = await getDoc(newDocRef);

  if (!oldSnap.exists()) {
    console.error(`[오류] 아리님의 기존 프로필 문서(${oldUid})가 존재하지 않습니다!`);
    process.exit(1);
  }

  const oldData = oldSnap.data();
  console.log("기존 프로필 데이터 로드 성공:", {
    nickname: oldData.nickname,
    nativeNickname: oldData.nativeNickname,
    phoneNumber: oldData.phoneNumber,
    joinedGroups: oldData.joinedGroups
  });

  // 1) 롤백용 백업 생성
  const backupDocId = `backup_${oldUid}_${Date.now()}`;
  const backupDocRef = doc(db, "users", backupDocId);
  await setDoc(backupDocRef, {
    backupTargetUid: oldUid,
    originalData: oldData,
    backedUpAt: Timestamp.now()
  });
  console.log(`\n- [백업 성공] 안전한 복구를 위한 백업 문서 '${backupDocId}' 생성 완료.`);

  // 2) 신규 구글 계정 프로필 병합 데이터 구성
  const mergedProfile = {
    ...oldData,
    uid: newUid,
    email: "lilyssong6877@gmail.com",
    displayName: "송순희",
    authMethod: "Phone_Google", // 휴대폰과 소셜이 혼합된 계정임을 표시
    lastVisitedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    migratedAt: Timestamp.now(),
    isRegistered: true
  };

  // 3) 신규 구글 계정에 병합 프로필 생성 및 저장
  await setDoc(newDocRef, mergedProfile);
  console.log("- [프로필 복구 완료] 구글 계정 UID로 아리님의 프로필 문서 생성 성공.");

  // 4) 그룹 멤버십(freestyle-tango) 이전 확인 및 처리
  const groupName = "freestyle-tango";
  const oldMemberRef = doc(db, "groups", groupName, "members", oldUid);
  const newMemberRef = doc(db, "groups", groupName, "members", newUid);
  
  const memberSnap = await getDoc(oldMemberRef);
  if (memberSnap.exists()) {
    const memberData = memberSnap.data();
    await setDoc(newMemberRef, {
      ...memberData,
      userId: newUid,
      migratedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    await deleteDoc(oldMemberRef);
    console.log(`- [멤버십 이관 성공] '${groupName}' 그룹의 멤버십을 신규 계정 UID로 안전하게 이관 완료.`);
  } else {
    console.log(`- [멤버십 확인] '${groupName}' 그룹에 기존 멤버십 문서가 존재하지 않아 이관을 생략합니다.`);
  }

  // 5) 기존 휴대폰 프로필 문서 안전 삭제 (데이터가 신규 구글 문서에 정상 복구되었으므로 충돌 차단)
  await deleteDoc(oldDocRef);
  console.log("- [클렌징 완료] 기존 휴대폰 임시 프로필 문서 Firestore에서 영구 정리 완료.");

  console.log("\n====================================================");
  console.log("  아리(Ari) 사용자 데이터 통합 및 복구 작업 100% 완료!");
  console.log("====================================================");
}

runMigration().then(() => process.exit(0)).catch(console.error);
