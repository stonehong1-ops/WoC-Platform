import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));

console.log('=== FINDING MUSEMIL IN DUMP ===');
dump.socials.forEach(s => {
  if (s.id === 'v0zd2tN2sQpDRW0lSwAi' || s.id === 'pista_musemil_4th_friday') {
    console.log(`\nDocument [${s.id}]:`);
    console.log(JSON.stringify(s, null, 2));
  }
});
