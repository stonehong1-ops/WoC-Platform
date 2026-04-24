const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\5aef59ee-8019-48a7-9bcb-aa09283fa701\\.system_generated\\logs\\overview.txt';
const outputPath = 'c:\\Users\\stone\\WoC\\extracted_html.html';

const targetLineNum = 248;

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');
console.log(`Total lines in log: ${lines.length}`);
const line = lines[targetLineNum - 1];
console.log(`Line ${targetLineNum} length: ${line.length}`);

try {
    const data = JSON.parse(line);
    let htmlContent = data.content;
    console.log(`Initial content length: ${htmlContent.length}`);
    if (htmlContent.includes('<USER_REQUEST>')) {
        const parts = htmlContent.split('<USER_REQUEST>');
        if (parts.length > 1) {
            const innerParts = parts[1].split('</USER_REQUEST>');
            htmlContent = innerParts[0].trim();
        }
    }
    console.log(`Final HTML content length: ${htmlContent.length}`);
    fs.writeFileSync(outputPath, htmlContent, 'utf8');
    console.log(`Extracted to ${outputPath}`);
} catch (e) {
    console.error('Failed to parse JSON:', e);
}
