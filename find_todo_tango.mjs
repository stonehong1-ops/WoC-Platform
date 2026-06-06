import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/stone/.gemini/antigravity/brain/f86a4e29-2fb5-4502-b264-3e2723a368e8/.system_generated/steps/3729/output.txt', 'utf8'));
const doc = data.documents.find(doc => doc.name.endsWith('/todo-tango'));
const f = doc.fields || {};

console.log({
  name: f.name?.stringValue,
  nativeName: f.nativeName?.stringValue,
  ownerId: f.ownerId?.stringValue,
  venueId: f.venueId?.stringValue,
  admins: f.admins?.arrayValue?.values?.map(v => v.stringValue),
  representativeName: f.representativeName?.stringValue
});
