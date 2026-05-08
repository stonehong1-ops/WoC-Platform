
const fs = require('fs');
const content = fs.readFileSync('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', 'utf8');

function extractKeys(section) {
    const keys = new Set();
    const regex = /'([^']+)':/g;
    let match;
    while ((match = regex.exec(section)) !== null) {
        keys.add(match[1]);
    }
    return Array.from(keys);
}

// Split content by language keys to be safe
const parts = content.split(/  (EN|KR): \{/);
// parts[0] is header
// parts[1] is "EN"
// parts[2] is EN content
// parts[3] is "KR"
// parts[4] is KR content

let enKeys = [];
let krKeys = [];

for (let i = 1; i < parts.length; i += 2) {
    if (parts[i] === 'EN') enKeys = extractKeys(parts[i+1]);
    if (parts[i] === 'KR') krKeys = extractKeys(parts[i+1]);
}

const missingInKr = enKeys.filter(k => !krKeys.includes(k));
const missingInEn = krKeys.filter(k => !enKeys.includes(k));

const missingHubKr = missingInKr.filter(k => k.startsWith('hub.'));
const missingHubEn = missingInEn.filter(k => k.startsWith('hub.'));

console.log('Total EN Keys:', enKeys.length);
console.log('Total KR Keys:', krKeys.length);
console.log('--- Missing Hub Keys in KR ---');
console.log(missingHubKr);
console.log('--- Missing Hub Keys in EN ---');
console.log(missingHubEn);
