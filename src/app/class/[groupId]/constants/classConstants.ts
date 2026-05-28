export const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
  FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};

export const DAY_COLORS: Record<string, string> = {
  MON: '#0057bd', TUE: '#7c3aed', WED: '#059669', THU: '#d97706',
  FRI: '#dc2626', SAT: '#0891b2', SUN: '#be185d',
};

export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/\./g, '-');
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return '';
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

export function formatScheduleDates(schedule: { week: number; date: string }[]): string {
  if (!schedule || schedule.length === 0) return '';
  const days = schedule.map(s => {
    if (!s.date) return '';
    const cleanDate = s.date.replace(/\./g, '-');
    const d = new Date(cleanDate);
    return isNaN(d.getTime()) ? '' : String(d.getDate());
  }).filter(Boolean);
  return days.join(', ');
}
