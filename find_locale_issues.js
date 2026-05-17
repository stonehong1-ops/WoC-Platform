const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('pt') && !file.includes('pt1')) {
        filelist = walk(path.join(dir, file), filelist);
      }
    } else if (file.endsWith('.tsx') && !file.includes('.bak')) {
      filelist.push(path.join(dir, file));
    }
  }
  return filelist;
}

const files = walk('c:/Users/stone/WoC/src');
let out = '';

for (const file of files) {
  if (file.includes('LanguageContext.tsx')) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.trim().startsWith('//')) continue;
    if (line.trim().startsWith('/*')) continue;
    if (line.trim().startsWith('*')) continue;
    
    // Simplistic removal of t() with any quotes, avoiding multiline
    // We just want to see if there's raw Korean text in JSX like <div>한국어</div>
    // or in placeholders placeholder="한국어"
    
    // strip simple console.log
    line = line.replace(/console\.log\(.*?\)/g, '');
    
    // strip t('...', '...') or t("...", "...")
    line = line.replace(/t\([\s\S]*?\)/g, '');

    if (/[가-힣]/.test(line)) {
      out += `${file}:${i + 1} ${line.trim()}\n`;
    }
  }
}

fs.writeFileSync('c:/Users/stone/WoC/unlocalized.txt', out, 'utf8');
