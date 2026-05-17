
const fs = require('fs');
const filePath = 'c:/Users/stone/WoC/src/contexts/LanguageContext.tsx';
const content = fs.readFileSync(filePath, 'utf8');

function extractKeys(lang) {
  const startMarker = `${lang}: {`;
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return {};

  let braceCount = 1;
  let currentIndex = startIndex + startMarker.length;
  let section = '';

  while (braceCount > 0 && currentIndex < content.length) {
    if (content[currentIndex] === '{') braceCount++;
    if (content[currentIndex] === '}') braceCount--;
    if (braceCount > 0) section += content[currentIndex];
    currentIndex++;
  }

  const keys = {};
  const lines = section.split('\n');
  const regex = /'([^']+)':\s*'([^']*)'/;
  
  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      keys[match[1]] = match[2];
    }
  });
  return keys;
}

const enKeys = extractKeys('EN');
const krKeys = extractKeys('KR');

const missingInKr = {};
Object.keys(enKeys).forEach(k => {
  if (!krKeys.hasOwnProperty(k)) {
    missingInKr[k] = enKeys[k];
  }
});

fs.writeFileSync('c:/Users/stone/WoC/scratch/missing_keys.json', JSON.stringify(missingInKr, null, 2));
console.log(`Saved ${Object.keys(missingInKr).length} missing keys to scratch/missing_keys.json`);
