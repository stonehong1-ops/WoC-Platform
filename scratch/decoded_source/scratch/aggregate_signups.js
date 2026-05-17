
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide the path to the output.txt file.');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const documents = data.documents || [];

const signupsByDate = {};

documents.forEach(doc => {
    const createdAt = doc.fields.createdAt?.timestampValue;
    if (createdAt) {
        const date = createdAt.split('T')[0];
        signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    }
});

const sortedDates = Object.keys(signupsByDate).sort();

console.log('Date | Signups');
console.log('--- | ---');
sortedDates.forEach(date => {
    console.log(`${date} | ${signupsByDate[date]}`);
});
