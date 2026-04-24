const fs = require('fs');
const requests = JSON.parse(fs.readFileSync('c:/Users/stone/WoC/all_user_requests.json', 'utf8'));

for (const req of requests) {
    if (req.content && typeof req.content === 'string' && req.content.includes('<!DOCTYPE html>')) {
        console.log('Found HTML in request on line:', req.line);
        fs.writeFileSync('c:/Users/stone/WoC/original_design.html', req.content);
        console.log('Saved to original_design.html. Length:', req.content.length);
        break;
    }
}
