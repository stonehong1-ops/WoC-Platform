const admin = require("firebase-admin");
const serviceAccount = require("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json");

// 파이어베이스 어드민 SDK 초기화 (어드민 권한으로 보안 규칙 우회)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const oldUid = "9KjNhkCWb2TF5sz18NrdI26fBim1"; // 기존 휴대폰 인증 계정 UID
const newUid = "DSp7TCZ1YdcXRvoJakfjCNlLh7p2"; // 신규 구글 인증 계정 UID

async function runMigration() {
  console.log("====================================================");
  console.log("  [Admin] 아리 사용자 이중 계정 데이터 병합 및 복구");
  console.log("====================================================\n");

  const oldDocRef = db.collection("users").doc(oldUid);
  const newDocRef = db.collection("users").doc(newUid);

  const oldSnap = await oldDocRef.get();
  if (!oldSnap.exists) {
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

  // 1) 백업 문서 생성
  const backupDocId = `backup_${oldUid}_${Date.now()}`;
  const backupDocRef = db.collection("users").doc(backupDocId);
  await backupDocRef.set({
    backupTargetUid: oldUid,
    originalData: oldData,
    backedUpAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`\n- [백업 성공] 복구용 안전 백업 문서 '${backupDocId}' 생성 완료.`);

  // 2) 신규 구글 계정 병합 프로필 데이터 구성
  const mergedProfile = {
    ...oldData,
    uid: newUid,
    email: "lilyssong6877@gmail.com",
    displayName: "송순희",
    authMethod: "Phone_Google",
    lastVisitedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    isRegistered: true
  };

  // 3) 신규 구글 계정에 병합 프로필 저장
  await newDocRef.set(mergedProfile);
  console.log("- [프로필 복구 완료] 구글 계정 UID로 아리님의 프로필 문서 생성 성공.");

  // 4) 그룹 멤버십(freestyle-tango) 이관
  const groupName = "freestyle-tango";
  const oldMemberRef = db.collection("groups").doc(groupName).collection("members").doc(oldUid);
  const newMemberRef = db.collection("groups").doc(groupName).collection("members").doc(newUid);

  const memberSnap = await oldMemberRef.get();
  if (memberSnap.exists) {
    const memberData = memberSnap.data();
    await newMemberRef.set({
      ...memberData,
      userId: newUid,
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await oldMemberRef.delete();
    console.log(`- [멤버십 이관 성공] '${groupName}' 그룹의 멤버십을 신규 계정 UID로 이관 완료.`);
  } else {
    console.log(`- [멤버십 확인] '${groupName}' 그룹에 기존 멤버십 문서가 존재하지 않아 생략합니다.`);
  }

  // 5) 기존 휴대폰 프로필 문서 안전 삭제
  await oldDocRef.delete();
  console.log("- [클렌징 완료] 기존 휴대폰 임시 프로필 문서 Firestore에서 정리 완료.");

  console.log("\n====================================================");
  console.log("  아리(Ari) 사용자 데이터 통합 및 복구 작업 100% 완료! (어드민)");
  console.log("====================================================");
}

runMigration().then(() => process.exit(0)).catch(console.error);
