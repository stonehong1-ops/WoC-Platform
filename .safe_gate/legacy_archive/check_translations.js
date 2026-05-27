const fs = require('fs');
const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf-8');

const krStart = content.indexOf('KR: {');
const krContent = content.substring(krStart);
const lines = krContent.split('\n');

console.log("Analyzing KR dictionary...");
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(':') && /['"`]/.test(line)) {
        const valMatch = line.match(/:\s*(['"`])(.*?)\1/);
        if (valMatch) {
            const val = valMatch[2];
            if (/[a-zA-Z]{4,}/.test(val) && !/[가-힣]/.test(val)) {
                // Ignore purely placeholder like {count}
                if (!/^\{[a-zA-Z_]+\}$/.test(val) && !val.includes('://') && !val.includes('.com') && val !== 'Free' && val !== 'TBA') {
                    console.log(`[KR Line ${i + 2248}] ${line.trim()}`);
                }
            }
        }
    }
}
