const fs = require('fs');
const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf-8');
const lines = content.split('\n');

const extractKey = (line) => {
    const match = line.match(/^\s*'([^']+)'\s*:/);
    return match ? match[1] : null;
};

function checkDuplicates(startLine, endLine, blockName) {
    const keys = new Set();
    const duplicates = [];
    for (let i = startLine; i <= endLine; i++) {
        const key = extractKey(lines[i]);
        if (key) {
            if (keys.has(key)) {
                duplicates.push({key, line: i + 1});
            } else {
                keys.add(key);
            }
        }
    }
    console.log(`${blockName} duplicates: ${duplicates.length}`);
    duplicates.forEach(d => console.log(`  - Key: '${d.key}' on line ${d.line}`));
}

let enStart = -1, krStart = -1, enEnd = -1, krEnd = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('EN: {')) enStart = i;
    if (lines[i].includes('KR: {')) {
        enEnd = i - 1;
        krStart = i;
    }
    if (lines[i].includes('};') && krStart !== -1) {
        krEnd = i;
    }
}

checkDuplicates(enStart, enEnd, 'EN');
checkDuplicates(krStart, krEnd, 'KR');
