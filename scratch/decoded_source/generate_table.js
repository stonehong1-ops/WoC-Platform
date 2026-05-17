const fs = require('fs');
const path = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\dc58e2cc-d9ad-4ce7-a730-2dc73b2b12b3\\.system_generated\\steps\\1670\\output.txt';

const rawData = fs.readFileSync(path, 'utf8');
const data = JSON.parse(rawData);

let markdown = '| Title | Description |\n| :--- | :--- |\n';

data.documents.forEach(doc => {
  const title = doc.fields.title ? doc.fields.title.stringValue : 'N/A';
  const description = doc.fields.description ? doc.fields.description.stringValue.replace(/\n/g, '<br>') : 'N/A';
  markdown += `| ${title} | ${description} |\n`;
});

fs.writeFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\dc58e2cc-d9ad-4ce7-a730-2dc73b2b12b3\\scratch\\socials_table.md', markdown);
console.log('Table generated successfully.');
