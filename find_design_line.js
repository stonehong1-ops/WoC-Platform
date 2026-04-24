const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: fs.createReadStream('C:\\Users\\stone\\.gemini\\antigravity\\brain\\b9ef8859-cf30-4971-b10e-18aaed55bb92\\.system_generated\\logs\\overview.txt'),
    crlfDelay: Infinity
});

let found = false;
rl.on('line', (line) => {
    if (line.includes('USER_EXPLICIT') && line.includes('<!DOCTYPE html>')) {
        console.log('Found it!');
        fs.writeFileSync('original_full_design.json', line);
        found = true;
        rl.close();
    }
});

rl.on('close', () => {
    if (!found) console.log('Not found');
});
