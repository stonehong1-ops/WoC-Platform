export function formatLocalPhoneNumber(phone: string | null | undefined, countryCode: string | null | undefined): string {
  if (!phone) return '';
  
  // 공백 및 하이픈 제거하여 표준 가공
  let rawPhone = phone.replace(/[\s\-]/g, '');
  
  // 드롭다운 국가 코드에서 숫자 및 + 기호만 정제 (예: "+82 (KR)" -> "+82")
  let cleanCode = '';
  if (countryCode) {
    const match = countryCode.match(/^\+(\d+)/);
    if (match) {
      cleanCode = match[0];
    } else if (countryCode.toUpperCase().includes('KR') || countryCode.includes('82')) {
      cleanCode = '+82';
    }
  }

  // 만약 폰번호가 국가 번호로 시작한다면
  if (cleanCode && rawPhone.startsWith(cleanCode)) {
    rawPhone = rawPhone.slice(cleanCode.length);
  }

  // 대한민국의 경우, 국가번호(+82)를 떼고 남은 국번이 "10", "11", "16", "17", "18", "19" 등 0이 누락된 2자리로 시작하면 맨 앞에 '0'을 자연스럽게 덧붙여 줍니다.
  if (cleanCode === '+82' || (countryCode && countryCode.toUpperCase().includes('KR'))) {
    if (/^(10|11|16|17|18|19)/.test(rawPhone)) {
      rawPhone = '0' + rawPhone;
    }
  }

  return rawPhone;
}
