const fs = require('fs');
const logPath = 'C:/Users/stone/.gemini/antigravity/brain/b9ef8859-cf30-4971-b10e-18aaed55bb92/.system_generated/logs/overview.txt';
const logData = fs.readFileSync(logPath, 'utf8');
const lines = logData.split('\n');

let longestHtml = '';
let bestLine = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<!DOCTYPE html>')) {
        try {
            const obj = JSON.parse(line);
            if (obj.content && obj.content.length > longestHtml.length) {
                longestHtml = obj.content;
                bestLine = i + 1;
            }
        } catch (e) {
            if (line.length > longestHtml.length) {
                longestHtml = line;
                bestLine = i + 1;
            }
        }
    }
}

if (longestHtml) {
    fs.writeFileSync('c:/Users/stone/WoC/original_design.html', longestHtml);
    console.log('Successfully extracted longest HTML. Line:', bestLine, 'Length:', longestHtml.length);
} else {
    console.log('HTML not found.');
}
