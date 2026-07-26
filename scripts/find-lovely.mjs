import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
console.log('=== SEARCHING LOVELY MILONGA ===');
dump.socials.forEach(s => {
  const t = (s.title || '').toLowerCase();
  const tn = (s.titleNative || '').toLowerCase();
  if (t.includes('lovely') || tn.includes('러블리')) {
    console.log(`- ID: ${s.id} | Title: ${s.title} (${s.titleNative}) | Day: ${s.dayOfWeek} | Rec: ${s.recurrence}`);
  }
});
