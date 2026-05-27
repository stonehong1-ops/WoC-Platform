// 날짜 로케일 포맷팅을 변경하는 Node.js 치환 스크립트
const fs = require('fs');

try {
  let content = fs.readFileSync('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', 'utf8');

  const target = `  const formatDate = (date: any, formatStr: string = 'yyyy-MM-dd') => {
    if (!date) return '';
    // Map custom alias strings to date-fns format tokens
    const formatAliases: Record<string, string> = {
      'iso': 'yyyy-MM-dd',
      'dayOnly': 'd',
      'monthYear': 'MMMM yyyy',
      'shortMonthDay': 'MMM d',
      'shortMonth': 'MMM',
      'shortWeekday': 'EEE',
      'weekday': 'EEEE',
      'timeOnly': 'HH:mm',
      'dateOnly': 'yyyy.MM.dd',
      'dateTime': 'yyyy.MM.dd HH:mm',
    };
    const resolvedFormat = formatAliases[formatStr] || formatStr;
    try {
      const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
      return format(d, resolvedFormat, { locale: language === 'KR' ? ko : enUS });
    } catch (e) {
      return '';
    }
  };`;

  const replacement = `  const formatDate = (date: any, formatStr: string = 'yyyy-MM-dd') => {
    if (!date) return '';
    // Map custom alias strings to date-fns format tokens based on active language
    const formatAliases: Record<Language, Record<string, string>> = {
      KR: {
        'iso': 'yyyy-MM-dd',
        'dayOnly': 'd일',
        'monthYear': 'yyyy년 M월',
        'shortMonthDay': 'M월 d일',
        'shortMonth': 'M월',
        'shortWeekday': 'EEE',
        'weekday': 'EEEE',
        'timeOnly': 'HH:mm',
        'dateOnly': 'yyyy.MM.dd',
        'dateTime': 'yyyy.MM.dd HH:mm',
      },
      EN: {
        'iso': 'yyyy-MM-dd',
        'dayOnly': 'd',
        'monthYear': 'MMMM yyyy',
        'shortMonthDay': 'MMM d',
        'shortMonth': 'MMM',
        'shortWeekday': 'EEE',
        'weekday': 'EEEE',
        'timeOnly': 'HH:mm',
        'dateOnly': 'yyyy.MM.dd',
        'dateTime': 'yyyy.MM.dd HH:mm',
      }
    };
    const resolvedFormat = formatAliases[language][formatStr] || formatStr;
    try {
      const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
      return format(d, resolvedFormat, { locale: language === 'KR' ? ko : enUS });
    } catch (e) {
      return '';
    }
  };`;

  // Normalize newlines to LF for matching, then write back with original newlines
  const isCRLF = content.includes('\r\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedTarget = target.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

  if (normalizedContent.includes(normalizedTarget)) {
    let result = normalizedContent.replace(normalizedTarget, normalizedReplacement);
    if (isCRLF) {
      result = result.replace(/\n/g, '\r\n');
    }
    fs.writeFileSync('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', result, 'utf8');
    console.log('SUCCESS: LanguageContext.tsx has been updated!');
  } else {
    // Regex fallback
    const pattern = /const\s+formatAliases\s*:\s*Record<string,\s*string>\s*=\s*\{[^}]+\};/;
    if (pattern.test(normalizedContent)) {
      const newAliases = `const formatAliases: Record<Language, Record<string, string>> = {
      KR: {
        'iso': 'yyyy-MM-dd',
        'dayOnly': 'd일',
        'monthYear': 'yyyy년 M월',
        'shortMonthDay': 'M월 d일',
        'shortMonth': 'M월',
        'shortWeekday': 'EEE',
        'weekday': 'EEEE',
        'timeOnly': 'HH:mm',
        'dateOnly': 'yyyy.MM.dd',
        'dateTime': 'yyyy.MM.dd HH:mm',
      },
      EN: {
        'iso': 'yyyy-MM-dd',
        'dayOnly': 'd',
        'monthYear': 'MMMM yyyy',
        'shortMonthDay': 'MMM d',
        'shortMonth': 'MMM',
        'shortWeekday': 'EEE',
        'weekday': 'EEEE',
        'timeOnly': 'HH:mm',
        'dateOnly': 'yyyy.MM.dd',
        'dateTime': 'yyyy.MM.dd HH:mm',
      }
    };`;
      let result = normalizedContent.replace(pattern, newAliases);
      result = result.replace('resolvedFormat = formatAliases[formatStr]', 'resolvedFormat = formatAliases[language][formatStr]');
      if (isCRLF) {
        result = result.replace(/\n/g, '\r\n');
      }
      fs.writeFileSync('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', result, 'utf8');
      console.log('SUCCESS VIA REGEX!');
    } else {
      console.error('ERROR: Target formatDate block not found!');
    }
  }
} catch (err) {
  console.error('ERROR:', err);
}
