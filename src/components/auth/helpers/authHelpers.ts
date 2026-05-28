export const getAuthErrorMessage = (code: string, fallback: string, language: string): string => {
  const isKo = language === 'KR';
  const messages: Record<string, string> = {
    'auth/too-many-requests': isKo 
      ? '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' 
      : 'Too many attempts. Please wait a moment and try again.',
    'auth/invalid-verification-code': isKo
      ? '인증 코드가 올바르지 않습니다. 다시 확인해주세요.'
      : 'Invalid verification code. Please check and try again.',
    'auth/code-expired': isKo
      ? '인증 코드가 만료되었습니다. 새 코드를 요청해주세요.'
      : 'Verification code has expired. Please request a new one.',
    'auth/invalid-phone-number': isKo
      ? '유효하지 않은 전화번호입니다.'
      : 'Invalid phone number.',
    'auth/network-request-failed': isKo
      ? '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
      : 'Network error. Please check your connection.',
    'auth/quota-exceeded': isKo
      ? 'SMS 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      : 'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed': isKo
      ? '보안 인증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.'
      : 'Security check failed. Please refresh and try again.',
  };
  return messages[code] || (isKo ? `오류: ${fallback}` : `Error: ${fallback}`);
};

export const getRegionName = (isoCode: string, language: string) => {
  try {
    const locale = language === 'KR' ? 'ko-KR' : 'en-US';
    return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode) || isoCode;
  } catch (e) {
    return isoCode;
  }
};
