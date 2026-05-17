import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/missing-i18n-keys.json', 'utf-8'));
const dynamic = data.filter(k => k.key.includes('${'));
const staticKeys = data.filter(k => !k.key.includes('${'));

console.log('총 누락 키:', data.length, '개');
console.log('동적 키 (템플릿 - 제외):', dynamic.length, '개');
console.log('실제 수정 대상 (정적 키):', staticKeys.length, '개');
