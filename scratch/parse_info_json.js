const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'info_line.json');
const buffer = fs.readFileSync(jsonPath);

// Detect UTF-16LE BOM
let content;
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
} else {
    content = buffer.toString('utf8');
}

// Remove BOM if present at the start of the string
if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
}

try {
    const data = JSON.parse(content);
    const htmlStart = data.content.indexOf('<!DOCTYPE html>');
    if (htmlStart !== -1) {
        const html = data.content.substring(htmlStart);
        fs.writeFileSync(path.join(__dirname, 'info_design.html'), html);
        console.log('Successfully extracted HTML to info_design.html');
    } else {
        console.log('HTML not found in content');
    }
} catch (e) {
    console.error('Error parsing JSON:', e);
}
