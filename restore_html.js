const fs = require('fs');
const chunk = fs.readFileSync('chunk_6.txt', 'utf8');
const start = chunk.indexOf('<!DOCTYPE html>');
const end = chunk.indexOf('</html>') + 7;
if (start !== -1 && end !== -1) {
    let html = chunk.substring(start, end);
    // Unescape \n and \" if it's still escaped
    html = html.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    fs.writeFileSync('restored_design.html', html);
    console.log('Restored design saved to restored_design.html');
} else {
    console.log('Start or end not found', {start, end});
}
