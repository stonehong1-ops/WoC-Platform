const fs = require('fs');
const text = fs.readFileSync('C:/Users/stone/.gemini/antigravity/brain/5aef59ee-8019-48a7-9bcb-aa09283fa701/.system_generated/logs/overview.txt', 'utf8');
const regex = /<!DOCTYPE html>[\s\S]*?<\/html>/g;
const matches = text.match(regex);
if (matches) {
    matches.forEach((m, i) => {
        fs.writeFileSync('C:/Users/stone/.gemini/antigravity/brain/5aef59ee-8019-48a7-9bcb-aa09283fa701/scratch/html_' + i + '.html', m);
    });
    console.log('Found ' + matches.length + ' matches');
} else {
    console.log('Not found!');
}
