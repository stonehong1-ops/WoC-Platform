export function calculateCareerDuration(startDateStr: string | null | undefined, t: (key: string) => string): string {
  if (!startDateStr) return '';
  
  // 날짜 형식이 YYYY-MM 인지 검증
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(startDateStr)) {
    return startDateStr; // 기존의 단순 텍스트 입력값(예: "2년") 호환성을 유지하기 위해 그대로 반환
  }

  const [year, month] = startDateStr.split('-').map(Number);
  const startDate = new Date(year, month - 1);
  const currentDate = new Date();

  let years = currentDate.getFullYear() - startDate.getFullYear();
  let months = currentDate.getMonth() - startDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  // 미래 시점이 선택되었을 때의 방어 코드
  if (years < 0) {
    return t('myinfo.career_less_than_month');
  }

  const yearText = years > 0 ? `${years}${t('myinfo.career_year')}` : '';
  const monthText = months > 0 ? `${months}${t('myinfo.career_month')}` : '';

  if (!yearText && !monthText) {
    return t('myinfo.career_less_than_month');
  }

  return [yearText, monthText].filter(Boolean).join(' ');
}
