import { formatDate } from 'date-fns'; // or however we do it

// 2024-2025 Korean Holidays
export const KOREAN_HOLIDAYS = [
  '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
  '2024-03-01', '2024-04-10', '2024-05-05', '2024-05-06', '2024-05-15',
  '2024-06-06', '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18',
  '2024-10-03', '2024-10-09', '2024-12-25',
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-01',
  '2025-03-03', '2025-05-05', '2025-05-06', '2025-06-06', '2025-08-15',
  '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-09',
  '2025-12-25'
];

/**
 * Checks if a given date is a weekend (Fri/Sat usually in this context? Or Sat/Sun?
 * The original code checked: `day === 5 || day === 6` which is Friday and Saturday.)
 * Wait, `day === 5 || day === 6` is Friday and Saturday night! 
 * A stay on Friday night or Saturday night is a weekend stay.
 * The original logic:
 * const day = curr.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
 * const tomorrow = addDays(curr, 1);
 * if (day === 5 || day === 6 || KOREAN_HOLIDAYS.includes(formatDate(tomorrow, 'yyyy-MM-dd'))) { weekendNights++; }
 * 
 * So it's weekend if the night is Friday, Saturday, or the NEXT DAY is a holiday.
 */
export const isWeekendOrHolidayStay = (currentDate: Date, nextDate: Date, formatDateFn: (d: Date, format: string) => string): boolean => {
  const day = currentDate.getDay();
  // 5 = Friday, 6 = Saturday
  if (day === 5 || day === 6) return true;
  
  // Check if next day is a holiday
  const nextDateStr = formatDateFn(nextDate, 'iso');
  if (KOREAN_HOLIDAYS.includes(nextDateStr)) return true;

  return false;
};
