const fs = require('fs');
const logPath = 'C:/Users/stone/.gemini/antigravity/brain/b9ef8859-cf30-4971-b10e-18aaed55bb92/.system_generated/logs/overview.txt';
const logData = fs.readFileSync(logPath, 'utf8');
const lines = logData.split('\n');

const keywords = ['Pulse', 'Notice', 'Moments', 'Upcoming Schedule', 'Recent Feed'];

lines.forEach((line, index) => {
    if (line.includes('"source":"USER_EXPLICIT"') && line.includes('<!DOCTYPE html>')) {
        console.log(`--- Potential Source HTML at line ${index + 1} ---`);
        keywords.forEach(kw => {
            if (line.includes(kw)) {
                console.log(`Found keyword "${kw}" in this line.`);
            }
        });
    }
});
