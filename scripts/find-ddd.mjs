import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
console.log('=== SEARCHING DIA DOYA DDD SOCIALS ===');
dump.socials.forEach(s => {
  const t = (s.title || '').toLowerCase();
  const tn = (s.titleNative || '').toLowerCase();
  const d = (s.description || '').toLowerCase();
  if (t.includes('dia') || t.includes('ddd') || t.includes('doya') || tn.includes('디디디') || tn.includes('도야') || tn.includes('디아')) {
    console.log(`- ID: ${s.id} | Title: ${s.title} (${s.titleNative}) | Day: ${s.dayOfWeek} | Rec: ${s.recurrence}`);
  }
});
