const fs = require('fs');

const filePath = './src/contexts/LanguageContext.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Find duplicates: keys that appear more than once
const keyRegex = /^\s*'([^']+)'\s*:/gm;
const keyCounts = {};
let m;
while ((m = keyRegex.exec(content)) !== null) {
  const key = m[1];
  const line = content.substring(0, m.index).split('\n').length;
  if (!keyCounts[key]) keyCounts[key] = [];
  keyCounts[key].push(line);
}

const dupes = Object.entries(keyCounts).filter(([k, lines]) => lines.length > 2);
// More than 2 means it appears in both EN+KR + extras
// Actually, each key should appear exactly twice (once in EN, once in KR)
// If it appears 3+ times, there's a duplicate

console.log(`Keys appearing 3+ times: ${dupes.length}`);
dupes.slice(0, 20).forEach(([k, lines]) => console.log(`  ${k}: lines ${lines.join(', ')}`));

// Strategy: remove the auto-generated block if it has dupes,
// then re-inject only truly missing ones
// Let's just remove the auto-generated blocks and try a smarter approach

// Remove auto-generated EN block
content = content.replace(/\n\s*\/\/ Auto-generated missing keys\n([\s\S]*?)(?=\n\s*\/\/|\n\s*\})/g, (match, block, offset) => {
  // Only remove if it's followed by another comment or closing brace
  return '\n';
});

// Simpler: remove all lines that were auto-generated
const lines = content.split('\n');
const filtered = [];
let inAutoBlock = false;
for (const line of lines) {
  if (line.includes('// Auto-generated missing keys')) {
    inAutoBlock = true;
    continue;
  }
  if (inAutoBlock && line.trim().startsWith("'") && line.trim().endsWith("',")) {
    continue; // skip auto-generated entry
  }
  if (inAutoBlock && (line.trim() === '' || line.trim().startsWith('//'))) {
    inAutoBlock = false;
  }
  filtered.push(line);
}

fs.writeFileSync(filePath, filtered.join('\n'), 'utf-8');
console.log('Removed auto-generated blocks. Now re-run smart inject.');
