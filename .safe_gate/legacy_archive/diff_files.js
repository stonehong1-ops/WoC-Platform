const fs = require('fs');
const file1 = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf-8').split('\n');
const file2 = fs.readFileSync('src/contexts/LanguageContext.tmp', 'utf-8').split('\n');

let diffs = 0;
for (let i = 0; i < file1.length; i++) {
    const l1 = (file1[i] || '').trim();
    const l2 = (file2[i] || '').trim();
    if (l1 !== l2) {
        console.log(`Line ${i+1}:`);
        console.log(`  - ${l1}`);
        console.log(`  + ${l2}`);
        diffs++;
        if (diffs >= 20) break;
    }
}
if (diffs === 0) {
    console.log("No differences (ignoring whitespace).");
} else if (diffs >= 20) {
    console.log("Showing first 20 differences.");
}
