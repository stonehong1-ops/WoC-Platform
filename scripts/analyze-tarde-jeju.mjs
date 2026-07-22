import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));

console.log('=== SEARCHING FOR SOCIALS AND VENUES ===');

// 베뉴 검색
console.log('\n[VENUES DUMPED]');
dump.venues.forEach(v => {
  const name = v.name || '';
  const ko = v.nameKo || '';
  if (name.includes('tango') || ko.includes('땅고') || ko.includes('안단테') || name.includes('andante') || ko.includes('라벤따나') || ko.includes('실루엣') || ko.includes('진주') || name.includes('pista') || ko.includes('피스타') || ko.includes('데스빠시오') || ko.includes('데스파시오')) {
    console.log(`  - ID: ${v.id} | Name: ${v.name} (${v.nameKo}) | Address: ${v.address} | SeoulArea: ${v.seoulArea}`);
  }
});

// 소셜 검색
const keys = [
  'tarde', '따르데', '오후', 
  '화양연화', '칙투칙', 'cheek', '꼬르띠나', 'cortina', '연합', 
  'labios', '라비오스', 
  'volver', '볼베르', 
  'lovely', '러블리', 
  'jam', '잼스', 
  'vez', '우나베스', 
  'pista', '심야', '심밀', 
  'la melodia', '멜로디아', 
  'orange', '오렌지', 
  'luminoso', '루미노소', 
  'rara', '라라밀', 
  'dulce', '둘쎄', 
  'dorada', '도라다', 
  'jinju', '진주'
];

console.log('\n[SOCIALS MATCHES]');
dump.socials.forEach(s => {
  const title = (s.title || '').toLowerCase();
  const native = (s.titleNative || '').toLowerCase();
  const desc = (s.description || '').toLowerCase();
  if (keys.some(k => title.includes(k) || native.includes(k) || desc.includes(k))) {
    console.log(`  - ID: ${s.id} | Title: ${s.title} (${s.titleNative}) | Type: ${s.type} | City: ${s.city} | Day: ${s.dayOfWeek} | Rec: ${s.recurrence} | Venue: ${s.venueNameNative || s.venueName}`);
  }
});
