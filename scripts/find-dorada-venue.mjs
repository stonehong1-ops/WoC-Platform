import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
const v = dump.socials.find(s => s.id === 'dorada_milonga_tuesday');
console.log('=== DORADA VENUE INFO ===');
if (v) {
  console.log(`venueId: ${v.venueId} | venueName: ${v.venueName} | venueNameNative: ${v.venueNameNative}`);
} else {
  console.log('Dorada Milonga not found.');
}
