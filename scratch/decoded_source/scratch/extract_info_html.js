const fs = require('fs');
const readline = require('readline');

async function extractStep(lineNumber) {
    const fileStream = fs.createReadStream('C:/Users/stone/.gemini/antigravity/brain/21caf8bf-08bf-458b-82ef-a2a9d5968628/.system_generated/logs/overview.txt');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentLine = 0;
    for await (const line of rl) {
        currentLine++;
        if (currentLine === lineNumber) {
            console.log(line);
            break;
        }
    }
}

extractStep(126);
