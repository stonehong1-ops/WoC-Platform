const fs = require('fs');
const path = require('path');

const logPath = 'C:/Users/stone/.gemini/antigravity/brain/21caf8bf-08bf-458b-82ef-a2a9d5968628/.system_generated/logs/overview.txt';
const data = fs.readFileSync(logPath, 'utf8');
const lines = data.split('\n');
const line126 = lines[125]; // index is 0-based

try {
    const json = JSON.parse(line126);
    const content = json.content;
    const htmlStart = content.indexOf('<!DOCTYPE html>');
    if (htmlStart !== -1) {
        const html = content.substring(htmlStart);
        fs.writeFileSync('scratch/info_full.html', html);
        console.log('Successfully extracted HTML to scratch/info_full.html');
    } else {
        console.log('HTML not found in content');
    }
} catch (e) {
    console.error('Failed to parse line 126:', e);
}
