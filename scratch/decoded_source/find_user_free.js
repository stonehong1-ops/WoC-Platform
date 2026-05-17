const fs = require('fs');
const free_file = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\198c5f21-be48-41c4-850c-c04866c93693\\.system_generated\\steps\\4705\\output.txt';
const data = JSON.parse(fs.readFileSync(free_file, 'utf8'));
const user = data.documents.find(d => d.name.includes('01049956915'));
console.log(JSON.stringify(user, null, 2));
