const fs = require('fs');
const logFile = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\39aaac6e-4bfc-486d-99b2-e11822ee19f1\\.system_generated\\logs\\overview.txt';
const lines = fs.readFileSync(logFile, 'utf8').split('\n');
const lastUser = lines.filter(l => l.includes('"type":"USER_INPUT"')).pop();
if (lastUser) {
    fs.writeFileSync('C:\\Users\\stone\\WoC\\user_msg_utf8.txt', JSON.parse(lastUser).content, 'utf8');
}
