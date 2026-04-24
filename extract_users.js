const fs = require('fs');
const path = require('path');

const inputPath = 'C:/Users/stone/.gemini/antigravity/brain/9160f435-8240-4da8-8237-f737bb0be6c6/.system_generated/steps/1001/output.txt';
const outputPath = 'all_users_nickname_update.csv';

try {
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(rawData);
  const csvRows = ['ID,CurrentNickname,EnglishNickname'];

  data.documents.forEach(doc => {
    const id = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const nickname = (fields.nickname && fields.nickname.stringValue) || (fields.displayName && fields.displayName.stringValue) || '';
    
    // CSV escaping: wrap in quotes and escape internal quotes
    const escapedNickname = '"' + nickname.replace(/"/g, '""') + '"';
    csvRows.push(`${id},${escapedNickname},`);
  });

  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');
  console.log(`Successfully created ${outputPath} with ${data.documents.length} users.`);
} catch (error) {
  console.error('Error processing user data:', error);
  process.exit(1);
}
