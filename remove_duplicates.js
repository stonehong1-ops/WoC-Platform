const fs = require('fs');

const filePath = './src/contexts/LanguageContext.tsx';
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');

let inEnBlock = false;
let inKrBlock = false;

const uniqueEnKeys = new Set();
const uniqueKrKeys = new Set();

const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('EN: {')) {
    inEnBlock = true;
    inKrBlock = false;
    newLines.push(line);
    continue;
  } else if (line.includes('KR: {')) {
    inKrBlock = true;
    inEnBlock = false;
    newLines.push(line);
    continue;
  }
  
  // check if line has a key
  const match = line.match(/^\s*'([^']+)'\s*:/);
  if (match) {
    const key = match[1];
    if (inEnBlock && uniqueEnKeys.has(key)) {
      // duplicate EN key, skip
      continue;
    }
    if (inKrBlock && uniqueKrKeys.has(key)) {
      // duplicate KR key, skip
      continue;
    }
    
    if (inEnBlock) uniqueEnKeys.add(key);
    if (inKrBlock) uniqueKrKeys.add(key);
    newLines.push(line);
  } else {
    // If it's a comment or empty line, we should be careful not to keep duplicate comments if they are part of a duplicate block.
    // But keeping extra comments won't break the build.
    // Let's just push it. Wait, the // Function Builder Data will be duplicated.
    if (line.includes('// Function Builder Data')) {
        // Let's only keep the first occurrence of this comment per language block
        if (inEnBlock) {
            if (!uniqueEnKeys.has('__comment_fb_data')) {
                uniqueEnKeys.add('__comment_fb_data');
                newLines.push(line);
            }
        } else if (inKrBlock) {
            if (!uniqueKrKeys.has('__comment_fb_data')) {
                uniqueKrKeys.add('__comment_fb_data');
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
  }
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
console.log('Duplicates removed.');
