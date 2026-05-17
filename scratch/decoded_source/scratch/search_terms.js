
const fs = require('fs');
const filePath = 'c:/Users/stone/WoC/src/contexts/LanguageContext.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const terms = ["정기 모임", "둘러보기", "공간", "즐겨찾기", "팝업", "이력", "분실물", "점프"];

terms.forEach(term => {
  console.log(`--- Searching for: ${term} ---`);
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes(term)) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
});
