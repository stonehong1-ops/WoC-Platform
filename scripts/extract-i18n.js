// LanguageContext.tsx에서 다국어 사전을 자동 분리하는 헬퍼 스크립트.

const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, '../src/contexts/LanguageContext.tsx');
const i18nDir = path.join(__dirname, '../src/i18n');

if (!fs.existsSync(i18nDir)) {
  fs.mkdirSync(i18nDir, { recursive: true });
}

console.log('Reading LanguageContext.tsx...');
const content = fs.readFileSync(contextPath, 'utf8');
const lines = content.split(/\r?\n/);

console.log(`Total lines read: ${lines.length}`);

// Line numbers are 1-indexed, so array indexes are line_number - 1
// EN: lines 21 to 3032 (0-indexed: index 20 to 3031)
const enContentLines = lines.slice(21, 3032);
// KR: lines 3034 to 6036 (0-indexed: index 3033 to 6035)
const krContentLines = lines.slice(3033, 6036);

console.log(`Extracted ${enContentLines.length} lines for EN dictionary.`);
console.log(`Extracted ${krContentLines.length} lines for KR dictionary.`);

// Format en.ts
const enFileContent = `// 영어 다국어 사전 정의 파일.

export const en: Record<string, string> = {
${enContentLines.join('\n')}
};
`;

// Format kr.ts
const krFileContent = `// 한국어 다국어 사전 정의 파일.

export const kr: Record<string, string> = {
${krContentLines.join('\n')}
};
`;

// Write files
fs.writeFileSync(path.join(i18nDir, 'en.ts'), enFileContent, 'utf8');
fs.writeFileSync(path.join(i18nDir, 'kr.ts'), krFileContent, 'utf8');

console.log('Successfully created en.ts and kr.ts in src/i18n/.');

// Create index.ts
const indexFileContent = `// 다국어 사전을 통합하여 내보내는 파일.

import { en } from './en';
import { kr } from './kr';

export const dictionary = {
  EN: en,
  KR: kr,
};
`;

fs.writeFileSync(path.join(i18nDir, 'index.ts'), indexFileContent, 'utf8');
console.log('Successfully created index.ts in src/i18n/.');
