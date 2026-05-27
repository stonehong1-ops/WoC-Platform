const fs = require('fs');
const woc_file = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\198c5f21-be48-41c4-850c-c04866c93693\\.system_generated\\steps\\4696\\output.txt';
const data = JSON.parse(fs.readFileSync(woc_file, 'utf8'));
const user = data.documents.find(d => d.name.includes('+821049956915'));
console.log(JSON.stringify(user, null, 2));
