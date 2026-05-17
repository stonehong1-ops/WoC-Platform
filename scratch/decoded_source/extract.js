const fs = require('fs');
const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\5aef59ee-8019-48a7-9bcb-aa09283fa701\\.system_generated\\logs\\overview.txt';

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

for (const line of lines) {
    try {
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (data.step_index === 916) {
            let htmlContent = data.content;
            const htmlStart = htmlContent.indexOf('<!DOCTYPE html>');
            if (htmlStart !== -1) {
                htmlContent = htmlContent.substring(htmlStart);
                // JSON.parse already handled the string escapes if the whole line was JSON
                // But the content field itself might have been a string with escaped characters
                // Let's just output it.
                fs.writeFileSync('original_source.html', htmlContent, 'utf8');
                console.log('Extracted to original_source.html');
            }
            break;
        }
    } catch (e) {
        // Skip lines that are not valid JSON
    }
}
