import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { buildSearchKeywords } from "./searchKeywords";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * searchIndex 문서 id 규칙. 사람 외 타입(그룹/소셜 등)이 같은 컬렉션에 들어와도
 * 충돌하지 않도록 타입 접두사를 붙인다. 최초 마이그레이션과 동일한 형식이어야 한다.
 */
function searchDocId(uid: string): string {
  return `person_${uid}`;
}

/**
 * 검색 결과 카드에 실제로 쓰이는 필드만 담는다.
 *
 * searchIndex 는 publicProfiles 와 목적이 다르다.
 *  - publicProfiles: 찾은 뒤 **프로필을 표시**하기 위한 문서 단건 조회
 *  - searchIndex:    이름으로 **찾기** 위한 keywords array-contains 조회
 * 그래서 둘을 합치지 않고, 여기에는 검색 결과 렌더에 필요한 최소 필드만 둔다.
 *
 * 화이트리스트 방식이므로 email / phoneNumber / countryCode / fcmTokens /
 * allowPhoneCalls / isAdmin / systemRole / joinedGroups 등은 어떤 경우에도 넘어오지 않는다.
 *
 * 필드명 주의: 최초 마이그레이션 및 `tagSearchService.searchPeople` 과 맞춰야 한다.
 *   displayName <- users.nickname (영문 표기)
 *   nickname    <- users.nativeNickname (현지어 표기)
 */
function buildSearchDoc(user: FirebaseFirestore.DocumentData) {
  const displayName = typeof user.nickname === "string" ? user.nickname.trim() : "";
  const nativeName = typeof user.nativeNickname === "string" ? user.nativeNickname.trim() : "";

  return {
    type: "person",
    displayName,
    nickname: nativeName,
    photoURL: typeof user.photoURL === "string" ? user.photoURL : "",
    role: typeof user.role === "string" ? user.role : "",
    keywords: buildSearchKeywords(displayName, nativeName),
  };
}

/** 검색에 쓰이는 값이 하나라도 달라졌는지. 전화번호만 바뀐 저장에는 반응하지 않기 위한 판정. */
function hasSearchChange(
  before: FirebaseFirestore.DocumentData | undefined,
  after: FirebaseFirestore.DocumentData
): boolean {
  if (!before) return true;
  return JSON.stringify(buildSearchDoc(before)) !== JSON.stringify(buildSearchDoc(after));
}

/** 이름이 둘 다 비면 검색으로 찾을 수 없으므로 색인을 두지 않는다. */
function isIndexable(doc: ReturnType<typeof buildSearchDoc>): boolean {
  return Boolean(doc.displayName || doc.nickname);
}

/**
 * users/{uid} 가 바뀌면 searchIndex/person_{uid} 를 최신 상태로 유지한다.
 *
 * publicProfiles 동기화와 같은 이벤트를 듣지만 함수는 분리해 둔다.
 * 두 projection 은 스키마도 조회 방식도 다르고, 한쪽 로직을 고칠 때
 * 다른 쪽 색인이 함께 흔들리지 않는 편이 안전하다.
 */
export const syncSearchIndex = onDocumentWritten(
  {
    document: "users/{uid}",
    region: "us-central1",
  },
  async (event) => {
    const uid = event.params.uid;
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    const indexRef = admin.firestore().collection("searchIndex").doc(searchDocId(uid));

    // users 문서가 삭제되면 색인도 남기지 않는다.
    if (!after) {
      await indexRef.delete().catch(() => undefined);
      logger.info(`searchIndex deleted for ${uid}`);
      return;
    }

    if (!hasSearchChange(before, after)) {
      return;
    }

    const doc = buildSearchDoc(after);

    // 이름을 모두 지운 경우 색인을 남겨두면 빈 이름이 검색 결과에 뜬다.
    if (!isIndexable(doc)) {
      await indexRef.delete().catch(() => undefined);
      logger.info(`searchIndex removed for ${uid} (no searchable name)`);
      return;
    }

    await indexRef.set(
      {
        ...doc,
        targetId: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    logger.info(`searchIndex synced for ${uid} (${doc.keywords.length} keywords)`);
  }
);
