const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\5f8a0a1f-7364-4fb4-817c-3872396b4283\\.system_generated\\logs\\overview.txt';

try {
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('"source":"USER"')) {
            try {
                const data = JSON.parse(line);
                console.log(`--- USER MESSAGE ${i} ---`);
                console.log(data.text.substring(0, 100) + "...");
            } catch (e) {
                continue;
            }
        }
    }
} catch (e) {
    console.error(`Error: ${e.message}`);
}
