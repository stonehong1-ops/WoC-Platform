const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\39aaac6e-4bfc-486d-99b2-e11822ee19f1\\.system_generated\\logs\\overview.txt', 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('안티그래비티 봇 최종 수술 지시서') && lines[i].includes('USER_EXPLICIT')) {
    const data = JSON.parse(lines[i]);
    function findMessage(obj) {
      if (typeof obj === 'string' && obj.includes('안티그래비티 봇 최종 수술 지시서')) return obj;
      if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          const res = findMessage(obj[key]);
          if (res) return res;
        }
      }
      return null;
    }
    const msg = findMessage(data);
    if (msg) {
      fs.writeFileSync('C:\\Users\\stone\\WoC\\full_instruction.txt', msg);
      console.log('Found and wrote instructions.');
      break;
    }
  }
}
