const fs = require('fs');
const requests = JSON.parse(fs.readFileSync('c:/Users/stone/WoC/all_user_requests.json', 'utf8'));

requests.forEach((req, i) => {
    if (req.content) {
        console.log(`Request ${i} (Line ${req.line}): Length ${req.content.length}`);
        if (req.content.includes('<!DOCTYPE html>')) {
            console.log('   -> Contains DOCTYPE');
        }
    }
});
