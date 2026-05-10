const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\cfc0d5eb-63f3-4be0-a81e-bf412b9df4d7\\.system_generated\\steps\\2968\\output.txt', 'utf8'));

const total = data.documents.length;
const today = data.documents.filter(doc => doc.fields.createdAt.timestampValue.startsWith('2026-05-09')).length;
const yesterday = data.documents.filter(doc => doc.fields.createdAt.timestampValue.startsWith('2026-05-08')).length;

console.log(`Total Users: ${total}`);
console.log(`Today's Signups (2026-05-09): ${today}`);
console.log(`Yesterday's Signups (2026-05-08): ${yesterday}`);
