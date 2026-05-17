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
    } else if (file.endsWith('.tsx')) {
      if (fullPath.includes('LanguageContext.tsx')) return;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let foundInFile = false;
      
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        // Skip comments and imports
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import')) return;
        
        if (koreanRegex.test(line)) {
          if (!foundInFile) {
            console.log(`\nFILE: ${fullPath}`);
            foundInFile = true;
          }
          console.log(`  L${i+1}: ${trimmed}`);
        }
      });
    }
  });
}

console.log('Searching for UI-impacting hardcoded Korean strings in src/**/*.tsx ...');
searchFiles(srcDir);
