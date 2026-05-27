const fs = require('fs');

function checkKeys() {
    const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf-8');
    const lines = content.split('\n');
    
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
    
    const enKeys = new Set();
    const krKeys = new Set();
    
    const extractKey = (line) => {
        const match = line.match(/^\s*'([^']+)'\s*:/);
        return match ? match[1] : null;
    };
    
    for (let i = enStart; i <= enEnd; i++) {
        const key = extractKey(lines[i]);
        if (key) enKeys.add(key);
    }
    
    for (let i = krStart; i <= krEnd; i++) {
        const key = extractKey(lines[i]);
        if (key) krKeys.add(key);
    }
    
    console.log(`EN keys: ${enKeys.size}`);
    console.log(`KR keys: ${krKeys.size}`);
    
    const missingInEn = [...krKeys].filter(k => !enKeys.has(k));
    const missingInKr = [...enKeys].filter(k => !krKeys.has(k));
    
    if (missingInEn.length > 0) {
        console.log(`\nKeys in KR but missing in EN (${missingInEn.length}):`);
        console.log(missingInEn.slice(0, 10).join(', '));
    }
    if (missingInKr.length > 0) {
        console.log(`\nKeys in EN but missing in KR (${missingInKr.length}):`);
        console.log(missingInKr.slice(0, 10).join(', '));
    }
    
    if (missingInEn.length === 0 && missingInKr.length === 0) {
        console.log("\nKeys perfectly match between EN and KR.");
    }
}

checkKeys();
