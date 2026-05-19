# 날짜 로케일 포맷팅을 변경하는 치환 스크립트
import re

with open('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# target content to replace
target = """  const formatDate = (date: any, formatStr: string = 'yyyy-MM-dd') => {
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
  };"""

replacement = """  const formatDate = (date: any, formatStr: string = 'yyyy-MM-dd') => {
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
  };"""

content_normalized = content.replace('\r\n', '\n')
target_normalized = target.replace('\r\n', '\n')
replacement_normalized = replacement.replace('\r\n', '\n')

if target_normalized in content_normalized:
    content_normalized = content_normalized.replace(target_normalized, replacement_normalized)
    with open('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', 'w', encoding='utf-8', newline='') as f:
        f.write(content_normalized.replace('\n', '\r\n'))
    print("SUCCESS: LanguageContext.tsx has been updated!")
else:
    # regex fallback
    pattern = r"const\s+formatAliases\s*:\s*Record<string,\s*string>\s*=\s*\{[^\}]+\};"
    if re.search(pattern, content):
        new_aliases = """const formatAliases: Record<Language, Record<string, string>> = {
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
    };"""
        content = re.sub(pattern, new_aliases, content)
        content = content.replace("resolvedFormat = formatAliases[formatStr]", "resolvedFormat = formatAliases[language][formatStr]")
        with open('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS VIA REGEX!")
    else:
        print("ERROR: Target formatDate block not found!")
