import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * `publicProfiles/{uid}` 에 실을 필드 목록.
 *
 * Firestore 는 문서 단위로 읽히므로 보안 규칙만으로는 한 문서 안의 특정 필드를 숨길 수 없다.
 * 그래서 민감 정보는 규칙이 아니라 **컬렉션 분리**로 차단하고, 이 화이트리스트에 있는 값만 복사한다.
 *
 * 여기에 없는 필드는 어떤 경우에도 publicProfiles 로 넘어가지 않는다:
 * email, phoneNumber, phone, contactNumber, countryCode(전화 국가번호), fcmTokens,
 * allowPhoneCalls, isAdmin, isStaff, systemRole, joinedGroups, likedClassIds,
 * likedStayIds, lastVisitedAt, authMethod, platform, notificationSnoozedUntil ...
 */
const STRING_FIELDS = [
  "nickname",
  "nativeNickname",
  "photoURL",
  "gender",
  "role",
  "career",
  "partnerStatus",
  "language",
] as const;

const BOOLEAN_FIELDS = [
  "isInstructor",
  "isOrganizer",
  "isDj",
  "isServiceProvider",
  "isSeller",
  "isStayHost",
] as const;

const SOCIAL_LINK_KEYS = ["facebook", "instagram", "whatsapp"] as const;

type PublicProfileData = Record<string, unknown>;

/** users 문서에서 공개 가능한 값만 뽑아낸다. 화이트리스트 밖의 값은 절대 포함되지 않는다. */
export function buildPublicProfile(user: FirebaseFirestore.DocumentData): PublicProfileData {
  const out: PublicProfileData = {};

  for (const field of STRING_FIELDS) {
    const value = user[field];
    out[field] = typeof value === "string" ? value : "";
  }
  for (const field of BOOLEAN_FIELDS) {
    out[field] = user[field] === true;
  }

  const links = user.socialLinks;
  if (links && typeof links === "object") {
    const safeLinks: Record<string, string> = {};
    for (const key of SOCIAL_LINK_KEYS) {
      const value = (links as Record<string, unknown>)[key];
      safeLinks[key] = typeof value === "string" ? value : "";
    }
    out.socialLinks = safeLinks;
  }

  return out;
}

/** 공개 필드 중 하나라도 달라졌는지. 전화번호만 바뀐 저장에는 반응하지 않기 위한 판정. */
function hasPublicChange(
  before: FirebaseFirestore.DocumentData | undefined,
  after: FirebaseFirestore.DocumentData
): boolean {
  if (!before) return true;
  const a = buildPublicProfile(before);
  const b = buildPublicProfile(after);
  return JSON.stringify(a) !== JSON.stringify(b);
}

/**
 * users/{uid} 가 바뀌면 publicProfiles/{uid} 를 최신 상태로 유지한다.
 *
 * 쓰기 경로가 여러 곳(프로필 편집, 가입, 관리자 화면, Admin SDK)이라 각 경로에서
 * dual-write 하면 한 곳만 빠뜨려도 데이터가 어긋난다. 트리거 한 곳으로 모은다.
 */
export const syncPublicProfile = onDocumentWritten(
  {
    document: "users/{uid}",
    region: "us-central1",
  },
  async (event) => {
    const uid = event.params.uid;
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    const publicRef = admin.firestore().collection("publicProfiles").doc(uid);

    // users 문서가 삭제되면 공개 프로필도 남기지 않는다.
    if (!after) {
      await publicRef.delete().catch(() => undefined);
      logger.info(`publicProfile deleted for ${uid}`);
      return;
    }

    // 전화번호·푸시토큰만 바뀐 저장에도 트리거가 돌기 때문에, 공개 필드가 그대로면 쓰지 않는다.
    if (!hasPublicChange(before, after)) {
      return;
    }

    const data = buildPublicProfile(after);
    data.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await publicRef.set(data, { merge: true });
    logger.info(`publicProfile synced for ${uid}`);
  }
);
