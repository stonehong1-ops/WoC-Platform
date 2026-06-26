// 인앱 브라우저 가드 작동 조건 및 URL 전환 로직 스모크 테스트
import assert from "assert";

// 모의 테스트 대상 경로 및 UA 환경 정의
const FYS_PATH = "/fys";
const PT_PATH = "/pt";
const CURRENT_URL = "https://www.woc.today/fys";

// 인앱 가드 핵심 로직 시뮬레이션 함수
function simulateInAppGuard({ pathname, userAgent, sessionStorageDismissed = false }) {
  // 1. 경로 예외 처리 검증
  if (
    pathname === "/pt" ||
    pathname === "/pt1" ||
    pathname === "/app" ||
    pathname.startsWith("/pt/") ||
    pathname.startsWith("/pt1/") ||
    pathname.startsWith("/app/")
  ) {
    return { status: "ignored", reason: "excluded_path" };
  }

  // 2. 인앱 브라우저 여부 판별
  const isInApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line/i.test(userAgent);
  if (!isInApp) {
    return { status: "ignored", reason: "not_in_app" };
  }

  // 3. 세션 무시 여부 판별
  if (sessionStorageDismissed) {
    return { status: "ignored", reason: "session_dismissed" };
  }

  const isIOS = /iPad|iPhone|iPod/.test(userAgent);

  // 4. iOS 카카오톡 분기
  if (isIOS && /KAKAOTALK/i.test(userAgent)) {
    const redirectUrl = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(CURRENT_URL)}`;
    return { status: "redirect", target: redirectUrl, method: "kakaotalk_scheme" };
  }

  // 5. 안드로이드 분기
  if (!isIOS) {
    const stripped = CURRENT_URL.replace(/https?:\/\//i, "");
    const redirectUrl = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
    return { status: "redirect", target: redirectUrl, method: "android_intent" };
  }

  // 6. iOS 타 인앱 (인스타, 페북 등) 가이드 팝업
  return { status: "show_guide_modal", method: "ios_guide" };
}

function runTests() {
  console.log("🚀 Starting In-App Browser Guard Smoke Tests...");

  // Test 1: iOS 카카오톡 -> 사파리 전환 scheme 작동 검증
  const iosKakaoUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 9.8.5";
  const res1 = simulateInAppGuard({ pathname: FYS_PATH, userAgent: iosKakaoUA });
  assert.strictEqual(res1.status, "redirect");
  assert.strictEqual(res1.method, "kakaotalk_scheme");
  assert.ok(res1.target.includes("kakaotalk://web/openExternalApp"));
  console.log("✅ Test 1 Passed: iOS KakaoTalk redirects to Safari via custom scheme");

  // Test 2: Android 카카오톡 -> 크롬 intent 작동 검증
  const androidKakaoUA = "Mozilla/5.0 (Linux; Android 13; SM-S908N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.162 Mobile Safari/537.36; KAKAOTALK 9.9.2";
  const res2 = simulateInAppGuard({ pathname: FYS_PATH, userAgent: androidKakaoUA });
  assert.strictEqual(res2.status, "redirect");
  assert.strictEqual(res2.method, "android_intent");
  assert.ok(res2.target.includes("intent://"));
  assert.ok(res2.target.includes("package=com.android.chrome"));
  console.log("✅ Test 2 Passed: Android KakaoTalk redirects to Chrome via intent link");

  // Test 3: iOS Instagram -> 안내 모달 노출 검증
  const iosInstaUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 285.0.0.22.81";
  const res3 = simulateInAppGuard({ pathname: FYS_PATH, userAgent: iosInstaUA });
  assert.strictEqual(res3.status, "show_guide_modal");
  assert.strictEqual(res3.method, "ios_guide");
  console.log("✅ Test 3 Passed: iOS Instagram triggers the escape guide modal");

  // Test 4: PT1 독립 랜딩 페이지 -> 무시(Ignore) 검증 (FYS는 작동해야 하고, PT1은 작동 안 해야 함)
  const res4 = simulateInAppGuard({ pathname: PT_PATH, userAgent: iosKakaoUA });
  assert.strictEqual(res4.status, "ignored");
  assert.strictEqual(res4.reason, "excluded_path");
  console.log("✅ Test 4 Passed: Excluded paths (like /pt) bypass in-app guard correctly");

  // Test 5: 일반 모바일 사파리 브라우저 -> 작동 무시 검증
  const regularSafariUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
  const res5 = simulateInAppGuard({ pathname: FYS_PATH, userAgent: regularSafariUA });
  assert.strictEqual(res5.status, "ignored");
  assert.strictEqual(res5.reason, "not_in_app");
  console.log("✅ Test 5 Passed: Normal mobile Safari is ignored by guard");

  console.log("\n🎉 All 5 In-App Browser Guard logic tests passed successfully!");
}

runTests();
