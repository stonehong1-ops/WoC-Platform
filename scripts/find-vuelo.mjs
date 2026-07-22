import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
const v = dump.socials.find(s => s.id === 'nZksoQfo12TQJo2e4FvL');
console.log('=== VUELO MILONGA DOCUMENT ===');
console.log(JSON.stringify(v, null, 2));
