import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('c:\\Users\\stone\\WoC\\scripts\\master-socials-result.json', 'utf8'));

// 검색하고자 하는 소셜 관련 키워드/이름
// 1. 제주 한여름 밤의 밀롱가 (olle, 올레, 한여름)
// 2. 제주 데스빠시오 꼬르띠나 (despacio, 데스빠시오, cortina, 꼬르띠나)
// 3. JB 밀롱가 (jb)
// 4. 토이프 (if, 이프)
// 5. 오초 오렌지 밀롱가 (orange, 오렌지)
// 6. 밀빠소 (milpasso, 밀빠소)
// 7. 비비밀 (vivi, 비비)
// 8. 부엘로 (vuelo, 부엘로)
// 9. 엔빠스 주간 밀롱가들 (루미노소, 화엔쁘락, 까멜리아, 금요쁘락, 비다미아, 잼스밀, 볼베르)
// 10. 화정 밀롱가 (hwajeong, 화정)
// 11. 피스타 아브라쏘 (abrazo, 아브라쏘)
// 12. 이그녹스 밀롱가 (ignox, 이그녹스)
// 13. 강남탱고판 (gtp, 탱고판, pan)

console.log('=== ANALYZING SOCIALS DUMP ===');

const targets = [
  { name: '한여름 밤의 밀롱가', keys: ['olle', '올레', '한여름'] },
  { name: '꼬르띠나', keys: ['cortina', '꼬르띠나', 'despacio', '데스빠시오'] },
  { name: 'JB 밀롱가', keys: ['jb'] },
  { name: '토이프', keys: ['if', '이프'] },
  { name: '오렌지 밀롱가', keys: ['orange', '오렌지'] },
  { name: '밀빠소', keys: ['milpasso', '밀빠소'] },
  { name: '비비밀', keys: ['vivi', '비비'] },
  { name: '부엘로', keys: ['vuelo', '부엘로'] },
  { name: '화정', keys: ['hwajeong', '화정'] },
  { name: '아브라쏘', keys: ['abrazo', '아브라쏘'] },
  { name: '이그녹스', keys: ['ignox', '이그녹스'] },
  { name: '강남탱고판', keys: ['gtp', '탱고판', 'pan'] },
  // 엔빠스 주간 소셜
  { name: '루미노소', keys: ['luminoso', '루미노소'] },
  { name: '화엔쁘락', keys: ['화엔쁘락', '화요쁘락'] },
  { name: '까멜리아', keys: ['camellia', '까멜리아'] },
  { name: '금요쁘락', keys: ['금요쁘락'] },
  { name: '비다미아', keys: ['vidamia', '비다미아'] },
  { name: '잼스밀', keys: ['jams', '잼스'] },
  { name: '볼베르', keys: ['volver', '볼베르'] }
];

targets.forEach(t => {
  const matches = dump.socials.filter(s => {
    const title = (s.title || '').toLowerCase();
    const native = (s.titleNative || '').toLowerCase();
    const desc = (s.description || '').toLowerCase();
    return t.keys.some(k => title.includes(k) || native.includes(k) || desc.includes(k));
  });

  console.log(`\n* Target: ${t.name} (matches: ${matches.length})`);
  matches.forEach(m => {
    console.log(`  - ID: ${m.id} | Title: ${m.title} (${m.titleNative}) | Type: ${m.type} | City: ${m.city} | Venue: ${m.venueNameNative || m.venueName}`);
  });
});

console.log('\n=== ANALYZING VENUES DUMP ===');
const venueKeywords = ['olle', '올레', 'despacio', '데스빠시오', 'magenta', '마젠타', 'viento', '비엔토', 'bailamos', '바일라모스', 'silhouette', '실루엣', 'paz', '엔빠스', 'pan', '판탱고'];
venueKeywords.forEach(k => {
  const matches = dump.venues.filter(v => {
    const name = (v.name || '').toLowerCase();
    const native = (v.nameNative || '').toLowerCase();
    const addr = (v.address || '').toLowerCase();
    return name.includes(k) || native.includes(k) || addr.includes(k);
  });
  if (matches.length > 0) {
    console.log(`* Venue match for "${k}":`);
    matches.forEach(m => {
      console.log(`  - ID: ${m.id} | Name: ${m.name} (${m.nameNative}) | City: ${m.city}`);
    });
  }
});
