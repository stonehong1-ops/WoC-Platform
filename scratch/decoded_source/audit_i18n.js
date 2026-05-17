const fs = require('fs');
const path = require('path');

// 1. Extract all t('key') usages from components
const srcDir = path.join(__dirname, 'src');
const tKeyRegex = /\bt\(\s*['"`]([^'"`\n]+?)['"`]\s*[,)]/g;

function scanDir(dir) {
  const keys = new Set();
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath).forEach(k => keys.add(k));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.includes('LanguageContext')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      let match;
      while ((match = tKeyRegex.exec(content)) !== null) {
        keys.add(match[1]);
      }
    }
  }
  return keys;
}

const usedKeys = scanDir(srcDir);

// 2. Extract all keys from LanguageContext EN and KR dictionaries
const langFile = fs.readFileSync(path.join(srcDir, 'contexts', 'LanguageContext.tsx'), 'utf-8');

const dictKeyRegex = /^\s*'([^']+)'\s*:/gm;
const dictKeys = new Set();
let m;
while ((m = dictKeyRegex.exec(langFile)) !== null) {
  dictKeys.add(m[1]);
}

// 3. Find missing
const missing = [...usedKeys].filter(k => !dictKeys.has(k)).sort();

console.log(`\n=== i18n Audit ===`);
console.log(`Used keys in components: ${usedKeys.size}`);
console.log(`Keys in dictionary: ${dictKeys.size}`);
console.log(`Missing keys: ${missing.length}\n`);

if (missing.length > 0) {
  missing.forEach(k => console.log(`  MISSING: ${k}`));
}

// Save to file for reference
fs.writeFileSync(path.join(__dirname, 'i18n_missing.txt'), missing.join('\n'), 'utf-8');
console.log(`\nSaved to i18n_missing.txt`);
