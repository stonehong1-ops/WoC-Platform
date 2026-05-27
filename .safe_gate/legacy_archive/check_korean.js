const fs = require('fs');

function checkNonAscii() {
    try {
        const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf-8');
        const lines = content.split('\n');
        
        let enStart = -1;
        let krStart = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('EN: {')) enStart = i;
            if (lines[i].includes('KR: {')) { krStart = i; break; }
        }
        
        if (enStart === -1 || krStart === -1) {
            console.log('Could not find EN or KR blocks');
            return;
        }
        
        const matches = [];
        
        for (let i = enStart; i < krStart; i++) {
            const line = lines[i].trim();
            if (line === '') continue;
            // Check for Korean characters OR the ₩ symbol
            if (/[가-힣]/.test(line) || line.includes('₩')) {
                matches.push({ lineNum: i + 1, content: line });
            }
        }
        
        console.log(`Found ${matches.length} lines with Korean or Won characters in EN block.`);
        for (let i = 0; i < matches.length; i++) {
            console.log(`Line ${matches[i].lineNum}: ${matches[i].content}`);
        }
        
    } catch (err) {
        console.error('Error:', err);
    }
}

checkNonAscii();
