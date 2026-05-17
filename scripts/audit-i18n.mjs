import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LANG_FILE = path.join(SRC, 'contexts', 'LanguageContext.tsx');

// 1. 모든 .tsx/.ts 파일 수집 (LanguageContext 제외)
function getAllFiles(dir, exts = ['.tsx', '.ts'], results = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      getAllFiles(full, exts, results);
    } else if (exts.includes(path.extname(f)) && full !== LANG_FILE) {
      results.push(full);
    }
  }
  return results;
}

// 2. t('key') / t("key") 패턴 추출
function extractUsedKeys(files) {
  const used = new Map(); // key -> Set<filename>
  const RE = /\bt\(\s*['"`]([^'"`\n]+)['"`]\s*\)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let m;
    while ((m = RE.exec(content)) !== null) {
      const key = m[1];
      if (!used.has(key)) used.set(key, new Set());
      used.get(key).add(path.relative(ROOT, file));
    }
  }
  return used;
}

// 3. LanguageContext.tsx에서 정의된 키 추출
function extractDefinedKeys(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const defined = new Set();
  // 'key.name': 'value' 또는 "key.name": 'value' 패턴
  const RE = /['"]([a-zA-Z0-9_.]+)['"]:\s*['"`]/g;
  let m;
  while ((m = RE.exec(content)) !== null) {
    defined.add(m[1]);
  }
  return defined;
}

// 4. 실행
const files = getAllFiles(SRC);
console.log(`📁 스캔 파일: ${files.length}개`);

const usedKeys = extractUsedKeys(files);
console.log(`🔑 사용된 t() 키: ${usedKeys.size}개`);

const definedKeys = extractDefinedKeys(LANG_FILE);
console.log(`📖 사전 등록 키: ${definedKeys.size}개`);

// 5. 누락 키 계산
const missing = [];
for (const [key, usedIn] of usedKeys.entries()) {
  if (!definedKeys.has(key)) {
    missing.push({ key, files: [...usedIn] });
  }
}

missing.sort((a, b) => a.key.localeCompare(b.key));

console.log(`\n❌ 누락 키: ${missing.length}개\n`);

// 6. 결과 출력
missing.forEach(({ key, files }) => {
  console.log(`  "${key}"  →  ${files[0]}`);
});

// 7. JSON 파일로 저장
const outPath = path.join(ROOT, 'scripts', 'missing-i18n-keys.json');
fs.writeFileSync(outPath, JSON.stringify(missing, null, 2), 'utf-8');
console.log(`\n✅ 저장 완료: ${outPath}`);
