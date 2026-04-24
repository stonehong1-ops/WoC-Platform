const fs = require('fs');

const logPath = 'C:/Users/stone/.gemini/antigravity/brain/21caf8bf-08bf-458b-82ef-a2a9d5968628/.system_generated/logs/overview.txt';
const buffer = fs.readFileSync(logPath);
const content = buffer.toString('utf8');

const marker = 'group > info';
const startIdx = content.indexOf(marker);

if (startIdx !== -1) {
    const htmlStart = content.indexOf('<!DOCTYPE html>', startIdx);
    if (htmlStart !== -1) {
        // Find the end of the JSON string or </html>
        // Since it's in a JSON "content" field, </html> will be followed by \" or \n
        const htmlEnd = content.indexOf('</html>', htmlStart);
        if (htmlEnd !== -1) {
            const html = content.substring(htmlStart, htmlEnd + 7);
            // Unescape double quotes and newlines if they are escaped
            const unescapedHtml = html.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
            fs.writeFileSync('scratch/info_full_extracted.html', unescapedHtml);
            console.log('Successfully extracted HTML to scratch/info_full_extracted.html');
            console.log('Size:', unescapedHtml.length);
        } else {
            console.log('</html> not found after marker');
        }
    } else {
        console.log('<!DOCTYPE html> not found after marker');
    }
} else {
    console.log('Marker "group > info" not found');
}
