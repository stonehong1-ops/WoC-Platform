const fs = require('fs');
const logPath = 'C:/Users/stone/.gemini/antigravity/brain/b9ef8859-cf30-4971-b10e-18aaed55bb92/.system_generated/logs/overview.txt';
const logData = fs.readFileSync(logPath, 'utf8');
const lines = logData.split('\n');

let biggest = { line: -1, length: 0, content: '' };

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('"source":"USER_EXPLICIT"')) {
        try {
            const obj = JSON.parse(line);
            if (obj.content && obj.content.length > biggest.length) {
                biggest = { line: i + 1, length: obj.content.length, content: obj.content };
            }
        } catch (e) {}
    }
}

if (biggest.line !== -1) {
    fs.writeFileSync('c:/Users/stone/WoC/original_design.html', biggest.content);
    console.log('Found biggest USER_EXPLICIT. Line:', biggest.line, 'Length:', biggest.length);
} else {
    console.log('No USER_EXPLICIT found.');
}
