const fs = require('fs');
// glob removed

function findKoreanInFiles(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = dir + '/' + file;
    if (fs.statSync(filepath).isDirectory()) {
      findKoreanInFiles(filepath, filelist);
    } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const allFiles = findKoreanInFiles('c:/Users/stone/WoC/src');
const koreanRegex = /[\uac00-\ud7a3]/;

const filesWithKoreanUI = [];
let totalCount = 0;

allFiles.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let hasUIKorean = false;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*') && !trimmed.startsWith('<!--') && !trimmed.startsWith('console.log')) {
      if (koreanRegex.test(trimmed)) {
        hasUIKorean = true;
        totalCount++;
      }
    }
  });
  if (hasUIKorean) {
    filesWithKoreanUI.push(f);
  }
});

console.log('Files with UI Korean: ' + filesWithKoreanUI.length);
filesWithKoreanUI.forEach(f => {
  console.log('--- ' + f.replace('c:/Users/stone/WoC/src/', '') + ' ---');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*') && !trimmed.startsWith('<!--') && !trimmed.startsWith('console.log')) {
      if (koreanRegex.test(trimmed)) {
        console.log(`  Line ${i+1}: ${trimmed}`);
      }
    }
  });
});
