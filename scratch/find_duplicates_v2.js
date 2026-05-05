
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\stone\\WoC\\src\\contexts\\LanguageContext.tsx', 'utf8');

const lines = content.split('\n');
const enStart = lines.findIndex(l => l.includes('EN: {'));
const krStart = lines.findIndex(l => l.includes('KR: {'));

function findDuplicates(startLine, endLine) {
    const keys = {};
    for (let i = startLine; i < endLine; i++) {
        const match = lines[i].match(/'([^']+)':/);
        if (match) {
            const key = match[1];
            if (keys[key]) {
                console.log(`Duplicate key "${key}" at line ${i + 1} (previous at line ${keys[key]})`);
            }
            keys[key] = i + 1;
        }
    }
}

console.log('--- EN Duplicates ---');
findDuplicates(enStart + 1, krStart);
console.log('--- KR Duplicates ---');
findDuplicates(krStart + 1, lines.length);
