
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:/Users/stone/WoC/src/contexts/LanguageContext.tsx', 'utf8');

const enMatch = content.match(/EN:\s*{([\s\S]*?)},\s*KR:/);
const krMatch = content.match(/KR:\s*{([\s\S]*?)}\s*};/);

if (!enMatch || !krMatch) {
    console.log("Could not find EN or KR blocks");
    process.exit(1);
}

function extractKeys(block) {
    const keys = [];
    const lines = block.split('\n');
    lines.forEach(line => {
        const match = line.match(/'([^']+)'\s*:/);
        if (match) {
            keys.push(match[1]);
        }
    });
    return keys;
}

const enKeys = extractKeys(enMatch[1]);
const krKeys = extractKeys(krMatch[1]);

const missingInKr = enKeys.filter(k => !krKeys.includes(k));
const missingInEn = krKeys.filter(k => !enKeys.includes(k));

console.log("Missing in KR:", JSON.stringify(missingInKr, null, 2));
console.log("Missing in EN:", JSON.stringify(missingInEn, null, 2));
