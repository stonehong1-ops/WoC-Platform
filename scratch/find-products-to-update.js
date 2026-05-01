const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/stone/.gemini/antigravity/brain/10e5860f-480b-4c32-91d6-b8d9b9c372fe/.system_generated/steps/1350/output.txt', 'utf8'));

const targetSellerId = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
const toUpdate = [];

data.documents.forEach(doc => {
    if (!doc.fields.sellerId || doc.fields.sellerId.stringValue !== targetSellerId) {
        toUpdate.push(doc.name);
    }
});

console.log(JSON.stringify(toUpdate, null, 2));
