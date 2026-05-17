const fs = require('fs');
const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');
const lines = content.split('\n');
let currentSection = null;
let keys = {};
const duplicates = [];

lines.forEach((line, index) => {
    if (line.match(/^\s*EN: \{/)) {
        currentSection = 'EN';
        keys = {};
    } else if (line.match(/^\s*KR: \{/)) {
        currentSection = 'KR';
        keys = {};
    } else if (line.match(/^\s*\},/)) {
        // End of section
    }

    if (currentSection) {
        const match = line.match(/^\s*'([^']+)':/);
        if (match) {
            const key = match[1];
            if (keys[key]) {
                duplicates.push({ section: currentSection, key, first: keys[key], second: index + 1 });
            } else {
                keys[key] = index + 1;
            }
        }
    }
});

console.log(JSON.stringify(duplicates, null, 2));
