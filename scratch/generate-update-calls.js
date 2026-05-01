const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/stone/.gemini/antigravity/brain/10e5860f-480b-4c32-91d6-b8d9b9c372fe/.system_generated/steps/1350/output.txt', 'utf8'));

const targetSellerId = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
const toUpdate = data.documents.filter(doc => !doc.fields.sellerId || doc.fields.sellerId.stringValue !== targetSellerId);

const batch = toUpdate.slice(0, 10);

batch.forEach(doc => {
    const updatedFields = { ...doc.fields, sellerId: { stringValue: targetSellerId } };
    console.log(`Tool Call for ${doc.name.split('/').pop()}:`);
    console.log(JSON.stringify({
        name: doc.name,
        document: {
            name: doc.name,
            fields: updatedFields
        }
    }, null, 2));
    console.log('---');
});
