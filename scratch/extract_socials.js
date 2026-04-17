const fs = require('fs');
const content = fs.readFileSync('C:/Users/stone/.gemini/antigravity/brain/a63f4baa-4f73-4a1d-aef3-b75c2f952a71/.system_generated/steps/47/output.txt', 'utf8');
const data = JSON.parse(content);

const result = data.documents.map(doc => {
  const fields = doc.fields;
  const item = {};
  for (const key in fields) {
    const val = fields[key];
    if (val.stringValue !== undefined) item[key] = val.stringValue;
    else if (val.timestampValue !== undefined) item[key] = val.timestampValue;
    else if (val.integerValue !== undefined) item[key] = parseInt(val.integerValue);
  }
  return item;
});

console.log(JSON.stringify(result, null, 2));
