const fs = require('fs');
const logPath = 'C:/Users/stone/.gemini/antigravity/brain/b9ef8859-cf30-4971-b10e-18aaed55bb92/.system_generated/logs/overview.txt';
const logData = fs.readFileSync(logPath, 'utf8');
const lines = logData.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"source":"USER_EXPLICIT"') && lines[i].includes('<!DOCTYPE html>')) {
        console.log('Found HTML at line:', i + 1);
        try {
            const obj = JSON.parse(lines[i]);
            fs.writeFileSync('c:/Users/stone/WoC/original_design.html', obj.content);
            console.log('Saved to original_design.html. Length:', obj.content.length);
        } catch (e) {
            console.log('Failed to parse JSON at line:', i + 1, e.message);
        }
    }
}
