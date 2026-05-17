import fs from 'fs';

const raw = fs.readFileSync(
  'C:/Users/stone/.gemini/antigravity/brain/4b3ddb43-6df7-4cf0-b25b-7c715ccd1c0b/.system_generated/steps/428/output.txt',
  'utf-8'
);

// Parse document blocks
const lines = raw.split('\n');
const docs = [];
let current = null;

for (const line of lines) {
  const pathMatch = line.match(/__path__:\s*(.+)/);
  const nameMatch = line.match(/^\s+name:\s*(.+)/);
  const venueMatch = line.match(/venueId:/);
  const ownerMatch = line.match(/ownerId:\s*(.+)/);

  if (pathMatch) {
    if (current) docs.push(current);
    current = { path: pathMatch[1].trim(), name: '', hasVenueId: false, isSystem: false };
  }
  if (current && nameMatch && !current.name) {
    current.name = nameMatch[1].trim();
  }
  if (current && venueMatch) {
    current.hasVenueId = true;
  }
  if (current && ownerMatch) {
    const owner = ownerMatch[1].trim();
    if (owner === 'system1') current.isSystem = true;
  }
}
if (current) docs.push(current);

console.log(`전체 그룹: ${docs.length}개\n`);

const noVenue = docs.filter(d => !d.hasVenueId);
const withVenue = docs.filter(d => d.hasVenueId);

console.log(`✅ venueId 있음: ${withVenue.length}개`);
console.log(`❌ venueId 없음: ${noVenue.length}개\n`);

console.log('--- venueId 없는 그룹 목록 ---');
noVenue.forEach(d => {
  console.log(`  [${d.isSystem ? 'SYSTEM' : 'USER  '}] ${d.name || '(이름없음)'} → ${d.path}`);
});

console.log('\n--- venueId 있는 그룹 목록 ---');
withVenue.forEach(d => {
  console.log(`  [${d.isSystem ? 'SYSTEM' : 'USER  '}] ${d.name || '(이름없음)'} → ${d.path}`);
});
