const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\5f8a0a1f-7364-4fb4-817c-3872396b4283\\.system_generated\\logs\\overview.txt';
const outputPath = 'C:\\Users\\stone\\WoC\\scratch\\user_html_final.txt';

try {
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    let found = false;

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (line.includes('"source":"USER"') && line.includes('Calendar View')) {
            try {
                const data = JSON.parse(line);
                const text = data.text;
                if (text.includes('<!DOCTYPE html>')) {
                    const htmlStart = text.indexOf('<!DOCTYPE html>');
                    const htmlEnd = text.indexOf('</html>') + 7;
                    const finalHtml = text.substring(htmlStart, htmlEnd);
                    fs.writeFileSync(outputPath, finalHtml);
                    console.log(`Success: Found and saved to ${outputPath}`);
                    found = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
    }

    if (!found) {
        console.log("Failed to find the HTML in the logs.");
    }
} catch (e) {
    console.error(`Error: ${e.message}`);
}
