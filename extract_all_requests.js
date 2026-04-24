const fs = require('fs');
const logPath = 'C:/Users/stone/.gemini/antigravity/brain/b9ef8859-cf30-4971-b10e-18aaed55bb92/.system_generated/logs/overview.txt';
const logData = fs.readFileSync(logPath, 'utf8');
const lines = logData.split('\n');

const userRequests = [];
lines.forEach((line, index) => {
    if (line.includes('"source":"USER_EXPLICIT"')) {
        try {
            const obj = JSON.parse(line);
            userRequests.push({ line: index + 1, content: obj.content });
        } catch (e) {}
    }
});

fs.writeFileSync('c:/Users/stone/WoC/all_user_requests.json', JSON.stringify(userRequests, null, 2));
console.log('Saved all user requests. Count:', userRequests.length);
