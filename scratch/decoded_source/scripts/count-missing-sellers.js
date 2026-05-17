const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\10e5860f-480b-4c32-91d6-b8d9b9c372fe\\.system_generated\\steps\\1153\\output.txt', 'utf8'));
const missing = data.documents.filter(doc => !doc.fields.sellerId);
console.log('Total products:', data.documents.length);
console.log('Missing sellerId:', missing.length);
console.log('IDs of missing:', missing.map(doc => doc.name.split('/').pop()).join(','));
