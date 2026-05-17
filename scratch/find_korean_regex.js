const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/stone/WoC/src';
const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchFiles(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fullPath.includes('LanguageContext.tsx')) return;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let foundInFile = false;
      
      lines.forEach((line, i) => {
        // Ignore comments and console.logs if possible, but for thoroughness we can check all
        if (koreanRegex.test(line)) {
          if (!foundInFile) {
            console.log(`\nFILE: ${fullPath}`);
            foundInFile = true;
          }
          console.log(`  L${i+1}: ${line.trim()}`);
        }
      });
    }
  });
}

console.log('Searching for hardcoded Korean strings in src/ ...');
searchFiles(srcDir);
