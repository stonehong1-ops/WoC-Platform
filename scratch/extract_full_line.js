const fs = require('fs');

function extractLine(lineNumber) {
    const content = fs.readFileSync('C:/Users/stone/.gemini/antigravity/brain/21caf8bf-08bf-458b-82ef-a2a9d5968628/.system_generated/logs/overview.txt', 'utf8');
    const lines = content.split('\n');
    const line = lines[lineNumber - 1]; // line numbers are 1-indexed
    fs.writeFileSync('scratch/info_line_full.json', line);
    console.log('Line length:', line.length);
}

extractLine(126);
