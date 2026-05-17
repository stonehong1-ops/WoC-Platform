const fs = require('fs');
const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf-8');

const dictStart = content.indexOf('export const dictionary');
const krStart = content.indexOf('KR: {', dictStart);
const enStart = content.indexOf('EN: {', dictStart);

const krContent = content.substring(krStart);
const enContent = content.substring(enStart, krStart);

const getKeys = (block) => {
    const keys = [];
    const lines = block.split('\n');
    for (let line of lines) {
        if (line.includes(':') && /['"`]/.test(line)) {
            const match = line.match(/^\s*['"`](.*?)['"`]\s*:/);
            if (match) {
                keys.push(match[1]);
            }
        }
    }
    return keys;
}

const enKeys = getKeys(enContent);
const krKeys = getKeys(krContent);

const krKeySet = new Set(krKeys);
const enKeySet = new Set(enKeys);

console.log("Keys in EN but not in KR:");
for (let key of enKeys) {
    if (!krKeySet.has(key)) {
        console.log("Missing in KR:", key);
    }
}

console.log("\nKeys in KR but not in EN:");
for (let key of krKeys) {
    if (!enKeySet.has(key)) {
        console.log("Missing in EN:", key);
    }
}
