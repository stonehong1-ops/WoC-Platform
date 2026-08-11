"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSearchIndex = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const searchKeywords_1 = require("./searchKeywords");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * searchIndex 문서 id 규칙. 사람 외 타입(그룹/소셜 등)이 같은 컬렉션에 들어와도
 * 충돌하지 않도록 타입 접두사를 붙인다. 최초 마이그레이션과 동일한 형식이어야 한다.
 */
function searchDocId(uid) {
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
function buildSearchDoc(user) {
    const displayName = typeof user.nickname === "string" ? user.nickname.trim() : "";
    const nativeName = typeof user.nativeNickname === "string" ? user.nativeNickname.trim() : "";
    return {
        type: "person",
        displayName,
        nickname: nativeName,
        photoURL: typeof user.photoURL === "string" ? user.photoURL : "",
        role: typeof user.role === "string" ? user.role : "",
        keywords: (0, searchKeywords_1.buildSearchKeywords)(displayName, nativeName),
    };
}
/** 검색에 쓰이는 값이 하나라도 달라졌는지. 전화번호만 바뀐 저장에는 반응하지 않기 위한 판정. */
function hasSearchChange(before, after) {
    if (!before)
        return true;
    return JSON.stringify(buildSearchDoc(before)) !== JSON.stringify(buildSearchDoc(after));
}
/** 이름이 둘 다 비면 검색으로 찾을 수 없으므로 색인을 두지 않는다. */
function isIndexable(doc) {
    return Boolean(doc.displayName || doc.nickname);
}
/**
 * users/{uid} 가 바뀌면 searchIndex/person_{uid} 를 최신 상태로 유지한다.
 *
 * publicProfiles 동기화와 같은 이벤트를 듣지만 함수는 분리해 둔다.
 * 두 projection 은 스키마도 조회 방식도 다르고, 한쪽 로직을 고칠 때
 * 다른 쪽 색인이 함께 흔들리지 않는 편이 안전하다.
 */
exports.syncSearchIndex = (0, firestore_1.onDocumentWritten)({
    document: "users/{uid}",
    region: "us-central1",
}, async (event) => {
    var _a, _b, _c, _d;
    const uid = event.params.uid;
    const before = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const after = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
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
    await indexRef.set(Object.assign(Object.assign({}, doc), { targetId: uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
    logger.info(`searchIndex synced for ${uid} (${doc.keywords.length} keywords)`);
});
//# sourceMappingURL=syncSearchIndex.js.map