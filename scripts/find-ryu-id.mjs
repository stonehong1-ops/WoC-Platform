import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));
console.log('=== FINDING RYU PRACTICA ID ===');
dump.socials.forEach(s => {
  const title = (s.title || '').toLowerCase();
  const native = (s.titleNative || '').toLowerCase();
  if (title.includes('ryu') || native.includes('류')) {
    console.log(`- ID: ${s.id} | Title: ${s.title} (${s.titleNative})`);
  }
});
