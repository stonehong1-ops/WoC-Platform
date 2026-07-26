import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
console.log('=== SEARCHING LUMINOSO SOCIALS ===');
dump.socials.forEach(s => {
  const t = (s.title || '').toLowerCase();
  const tn = (s.titleNative || '').toLowerCase();
  if (t.includes('luminoso') || tn.includes('루미노소')) {
    console.log(`- ID: ${s.id} | Title: ${s.title} (${s.titleNative}) | Day: ${s.dayOfWeek} | Rec: ${s.recurrence}`);
  }
});
