import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
const v = dump.socials.find(s => s.id === 'zkZm9gZvHdnSPzSOR5Gp');
console.log('=== THE PISTA DOCUMENT ===');
console.log(JSON.stringify(v, null, 2));
