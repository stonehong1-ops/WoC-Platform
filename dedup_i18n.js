const fs = require('fs');
const filePath = './src/contexts/LanguageContext.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Split into lines
const lines = content.split('\n');

// Track keys seen per dictionary (EN starts first, then KR)
// We'll find the two dictionary boundaries
// Strategy: scan all lines, for each key occurrence, if it's the 2nd time in the SAME dict, remove it.

// Find EN and KR dict boundaries by looking for the translation function patterns
// EN dict: first 'const EN = {' or similar, KR dict: 'const KR = {' or similar
// Actually the file uses: const translations = { EN: {...}, KR: {...} }

// Simpler approach: just remove duplicates by keeping the FIRST occurrence of each key
// The auto-generated block is at the END of EN dict, so removing dupes there = removing auto-gen ones

const keyLineRegex = /^(\s*'([^']+)'\s*:)/;
const seenKeys = new Set();
const removedLines = [];
const filteredLines = [];
let inAutoBlock = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track when we hit auto-generated block
  if (line.includes('// Auto-generated missing keys')) {
    inAutoBlock = true;
    filteredLines.push(line);
    continue;
  }
  
  // If in auto block, check for duplicate
  if (inAutoBlock) {
    const match = line.match(keyLineRegex);
    if (match) {
      const key = match[2];
      if (seenKeys.has(key)) {
        // This is a duplicate - skip it
        removedLines.push(`Line ${i+1}: ${key}`);
        continue;
      }
    }
    // If we hit a non-key line (comment or empty), we're still in auto block
    if (!line.trim() || line.trim().startsWith('//')) {
      inAutoBlock = false;
    }
  }
  
  // Track all keys
  const match = line.match(keyLineRegex);
  if (match) {
    seenKeys.add(match[2]);
  }
  
  filteredLines.push(line);
}

fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf-8');
console.log(`Removed ${removedLines.length} duplicate lines from auto-generated blocks.`);
removedLines.slice(0, 10).forEach(l => console.log(`  ${l}`));
if (removedLines.length > 10) console.log(`  ... and ${removedLines.length - 10} more`);
