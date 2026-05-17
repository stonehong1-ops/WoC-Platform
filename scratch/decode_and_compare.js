// Decode all recovered base64 files and compare with local
const fs = require('fs');
const path = require('path');

const RECOVERED = 'scratch/recovered_v4/src';
const DECODED = 'scratch/decoded_source';
const LOCAL = '.';

function walkDir(dir) {
  const files = [];
  try {
    for (const item of fs.readdirSync(dir, {withFileTypes:true})) {
      const fp = path.join(dir, item.name);
      if (item.isDirectory()) files.push(...walkDir(fp));
      else files.push(fp);
    }
  } catch(e) {}
  return files;
}

// Step 1: Decode all files
console.log('🔓 Decoding base64 files...');
const recoveredFiles = walkDir(RECOVERED);
let decoded = 0, failed = 0;

for (const rf of recoveredFiles) {
  const rel = path.relative(RECOVERED, rf);
  const outPath = path.join(DECODED, rel);
  
  try {
    const raw = fs.readFileSync(rf, 'utf-8');
    let content;
    
    try {
      const parsed = JSON.parse(raw);
      if (parsed.data) {
        content = Buffer.from(parsed.data, 'base64').toString('utf-8');
      } else if (parsed.error) {
        failed++;
        continue;
      } else {
        content = raw;
      }
    } catch(e) {
      content = raw; // Not JSON, use as-is
    }
    
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);
    decoded++;
  } catch(e) {
    failed++;
  }
}

console.log(`Decoded: ${decoded}, Failed: ${failed}`);

// Step 2: Compare decoded with local
console.log('\n📊 Comparing decoded vs local...');
const decodedFiles = walkDir(DECODED);
const changedFiles = [];
const missingLocal = [];
let same = 0;

for (const df of decodedFiles) {
  const rel = path.relative(DECODED, df);
  const localPath = path.join(LOCAL, rel);
  
  if (!fs.existsSync(localPath)) {
    missingLocal.push(rel);
    continue;
  }
  
  const dc = fs.readFileSync(df, 'utf-8');
  const lc = fs.readFileSync(localPath, 'utf-8');
  
  // Normalize line endings for comparison
  const dcNorm = dc.replace(/\r\n/g, '\n');
  const lcNorm = lc.replace(/\r\n/g, '\n');
  
  if (dcNorm !== lcNorm) {
    changedFiles.push({
      file: rel,
      dLines: dc.split('\n').length,
      lLines: lc.split('\n').length,
      diff: dc.split('\n').length - lc.split('\n').length
    });
  } else {
    same++;
  }
}

console.log(`\n=== RESULTS ===`);
console.log(`Same: ${same}`);
console.log(`Changed: ${changedFiles.length}`);
console.log(`Missing locally: ${missingLocal.length}`);

if (changedFiles.length > 0) {
  console.log('\n=== FILES WITH DIFFERENT CONTENT ===');
  changedFiles.sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff));
  for (const c of changedFiles) {
    console.log(`${c.file} (deployed: ${c.dLines}, local: ${c.lLines}, diff: ${c.diff > 0 ? '+' : ''}${c.diff})`);
  }
}

if (missingLocal.length > 0) {
  console.log('\n=== FILES ONLY IN DEPLOYMENT (not local) ===');
  for (const m of missingLocal) console.log(m);
}
