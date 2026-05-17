import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/missing-i18n-keys.json', 'utf-8'));
const staticKeys = data.filter(k => !k.key.includes('${'));

// 키 → EN 기본값 생성 (키 마지막 세그먼트를 사람이 읽기 좋은 형태로 변환)
function keyToEnLabel(key) {
  const last = key.split('.').pop();
  return last
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// 카테고리별로 그룹화
const grouped = {};
for (const { key } of staticKeys) {
  const prefix = key.split('.')[0];
  if (!grouped[prefix]) grouped[prefix] = [];
  grouped[prefix].push(key);
}

console.log('카테고리별 누락 키:');
for (const [cat, keys] of Object.entries(grouped).sort()) {
  console.log(`  ${cat}: ${keys.length}개`);
}

// EN/KR 페어 생성
const enEntries = [];
const krEntries = [];

for (const { key } of staticKeys) {
  const enVal = keyToEnLabel(key);
  enEntries.push(`  '${key}': '${enVal}',`);
  krEntries.push(`  '${key}': '${enVal}',`); // KR도 일단 EN값으로 채움 (이후 번역)
}

fs.writeFileSync('scripts/missing-en.txt', enEntries.join('\n'), 'utf-8');
fs.writeFileSync('scripts/missing-kr.txt', krEntries.join('\n'), 'utf-8');

console.log('\n✅ 생성 완료: missing-en.txt / missing-kr.txt');
console.log('총 정적 누락 키:', staticKeys.length, '개');
