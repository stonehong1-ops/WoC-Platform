const fs = require('fs');
const line = fs.readFileSync('original_full_design.json', 'utf8');
const data = JSON.parse(line);
// The HTML is likely in data.content or similar
// Let's check where it is. Usually it's in data.content for USER_EXPLICIT
let html = data.content;
if (!html) {
    // Check if it's in metadata or somewhere else
    html = line.substring(line.indexOf('<!DOCTYPE html>'));
    html = html.substring(0, html.lastIndexOf('"}'));
    // Unescape \n and \"
    html = html.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}
fs.writeFileSync('full_design.html', html);
console.log('Saved to full_design.html');
