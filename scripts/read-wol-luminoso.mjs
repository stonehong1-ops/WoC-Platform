import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
const s = dump.socials.find(d => d.id === 'sMIEoUSmSRS9UwlxWzvp');
console.log('=== WOL LUMINOSO INFO ===');
if (s) {
  console.log(JSON.stringify(s, null, 2));
}
