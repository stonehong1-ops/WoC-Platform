const fs = require('fs');
const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');
const lines = content.split('\n');

let result = [];
let currentSection = null;
let sectionKeys = new Set();
let inSection = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/^\s*EN: \{/)) {
        currentSection = 'EN';
        sectionKeys = new Set();
        inSection = true;
        result.push(line);
        continue;
    } else if (line.match(/^\s*KR: \{/)) {
        currentSection = 'KR';
        sectionKeys = new Set();
        inSection = true;
        result.push(line);
        continue;
    } else if (inSection && line.match(/^\s*\},/)) {
        inSection = false;
        result.push(line);
        continue;
    }

    if (inSection) {
        const match = line.match(/^\s*'([^']+)':/);
        if (match) {
            const key = match[1];
            if (sectionKeys.has(key)) {
                // Skip duplicate
                console.log(`Removing duplicate key "${key}" in section "${currentSection}" at line ${i + 1}`);
                continue;
            } else {
                sectionKeys.add(key);
                result.push(line);
            }
        } else {
            result.push(line);
        }
    } else {
        result.push(line);
    }
}

fs.writeFileSync('src/contexts/LanguageContext.tsx', result.join('\n'));
console.log('Cleanup complete.');
