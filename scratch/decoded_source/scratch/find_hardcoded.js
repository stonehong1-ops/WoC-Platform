
const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/stone/WoC/src';
const terms = ["정기 모임", "둘러보기", "공간", "즐겨찾기", "팝업", "이력", "분실물", "점프"];

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchFiles(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      terms.forEach(term => {
        if (content.includes(term) && !fullPath.includes('LanguageContext.tsx')) {
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            if (line.includes(term)) {
              console.log(`${fullPath}:${i+1}: ${line.trim()}`);
            }
          });
        }
      });
    }
  });
}

searchFiles(srcDir);
