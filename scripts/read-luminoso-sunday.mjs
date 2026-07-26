import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));

console.log('=== LUMINOSO SUNDAY INFO ===');
const s = dump.socials.find(d => d.id === 'C0xF4VaGDIRIyt8a2hta');
if (s) {
  console.log(JSON.stringify(s, null, 2));
}

console.log('\n=== SEARCHING OCHO VENUE ===');
const dumpVenues = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-venues-result.json', 'utf8'));
dumpVenues.venues.forEach(v => {
  const name = (v.name || '').toLowerCase();
  const nameKo = (v.nameKo || '').toLowerCase();
  if (name.includes('ocho') || nameKo.includes('오초')) {
    console.log(`- ID: ${v.id} | Name: ${v.name} (${v.nameKo}) | Address: ${v.address}`);
  }
});
