const fs = require('fs');
const lines = fs.readFileSync('C:\\\\Users\\\\stone\\\\.gemini\\\\antigravity\\\\brain\\\\39aaac6e-4bfc-486d-99b2-e11822ee19f1\\\\.system_generated\\\\logs\\\\overview.txt', 'utf8').split('\n');
const msg = lines.find(l => l.includes('"step_index":5081'));
if(msg) {
    fs.writeFileSync('C:\\\\Users\\\\stone\\\\WoC\\\\final_msg.txt', JSON.parse(msg).content);
}
