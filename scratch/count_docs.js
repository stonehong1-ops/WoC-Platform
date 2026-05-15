const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\b7560c31-4632-4a98-b3e8-b1cd1b4e7820\\.system_generated\\steps\\18\\output.txt', 'utf8');
const data = JSON.parse(content);
console.log('Total documents:', data.documents.length);
console.log('First doc:', data.documents[0].name.split('/').pop());
console.log('Last doc:', data.documents[data.documents.length - 1].name.split('/').pop());
