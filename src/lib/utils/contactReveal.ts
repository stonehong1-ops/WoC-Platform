import { auth } from '@/lib/firebase/clientApp';

/**
 * 전화 걸기.
 *
 * 전화번호를 화면에 미리 들고 있지 않는다. 버튼을 누른 그 순간 서버에 물어보고,
 * 서버가 상대의 `allowPhoneCalls` 동의를 확인해 준 경우에만 번호를 받아 건다.
 * (예전에는 users 문서에서 번호를 통째로 받아와 클라이언트가 동의 여부를 판단했다.)
 *
 * @returns 실제로 전화 앱을 열었으면 true
 */
export async function revealAndCall(
  targetUserId: string,
  options?: { onDeclined?: () => void; onUnavailable?: () => void; fallbackNumber?: string | null }
): Promise<boolean> {
  const { onDeclined, onUnavailable, fallbackNumber } = options || {};

  // 이벤트/그룹 문서에 직접 적어둔 대표번호처럼, 개인 users 문서가 아닌 값은 그대로 쓴다.
  const useFallback = () => {
    if (fallbackNumber) {
      window.location.href = `tel:${fallbackNumber}`;
      return true;
    }
    onUnavailable?.();
    return false;
  };

  if (!targetUserId) return useFallback();

  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return useFallback();

    const res = await fetch('/api/contact/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ targetUserId }),
    });

    if (res.status === 403) { onDeclined?.(); return false; }
    if (!res.ok) return useFallback();

    const { phoneNumber } = await res.json();
    if (!phoneNumber) return useFallback();

    window.location.href = `tel:${phoneNumber}`;
    return true;
  } catch (e) {
    console.error('Failed to reveal contact:', e);
    return useFallback();
  }
}
