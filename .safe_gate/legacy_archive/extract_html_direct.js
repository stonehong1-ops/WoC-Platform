const fs = require('fs');
const logPath = 'C:/Users/stone/.gemini/antigravity/brain/b9ef8859-cf30-4971-b10e-18aaed55bb92/.system_generated/logs/overview.txt';
const logData = fs.readFileSync(logPath, 'utf8');
const lines = logData.split('\n');
const targetLine = lines[1537]; // Line 1538
const obj = JSON.parse(targetLine);
fs.writeFileSync('c:/Users/stone/WoC/original_design.html', obj.content);
console.log('HTML extracted successfully from log directly');
