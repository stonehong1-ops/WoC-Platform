import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
const v = dump.socials.find(s => s.id === 'daegu_dia_wednesday_ddd');
console.log('=== WED DDD DOCUMENT ===');
console.log(JSON.stringify(v, null, 2));
