import fs from "fs";
import path from "path";

const krPath = path.resolve("src/i18n/kr.ts");
const enPath = path.resolve("src/i18n/en.ts");

console.log("🔍 [다국어 검증기] 한국어 및 영어 사전 간의 키 정합성 전수 검사를 개시합니다.");

function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const keys = new Set();
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      continue;
    }
    const match = trimmed.match(/^\s*['"]([^'"]+)['"]\s*:/);
    if (match) {
      keys.add(match[1]);
    }
  }
  return keys;
}

try {
  const krKeys = extractKeys(krPath);
  const enKeys = extractKeys(enPath);

  console.log(`📊 한국어 사전 번역 키 개수: ${krKeys.size}개.`);
  console.log(`📊 영어 사전 번역 키 개수: ${enKeys.size}개.`);

  const missingInEn = [];
  const missingInKr = [];

  for (const key of krKeys) {
    if (!enKeys.has(key)) {
      missingInEn.push(key);
    }
  }

  for (const key of enKeys) {
    if (!krKeys.has(key)) {
      missingInKr.push(key);
    }
  }

  let hasError = false;

  if (missingInEn.length > 0) {
    console.error(`🚨 [누락 감지] 영어 사전(en.ts)에 존재하지 않는 한국어 사전(kr.ts)의 키가 ${missingInEn.length}개 있습니다.`);
    missingInEn.forEach(key => console.error(`   - 누락 키: ${key}`));
    hasError = true;
  }

  if (missingInKr.length > 0) {
    console.error(`🚨 [누락 감지] 한국어 사전(kr.ts)에 존재하지 않는 영어 사전(en.ts)의 키가 ${missingInKr.length}개 있습니다.`);
    missingInKr.forEach(key => console.error(`   - 누락 키: ${key}`));
    hasError = true;
  }

  if (hasError) {
    console.error("❌ [검증 실패] 영한 다국어 번역 키가 100% 일치하지 않습니다. 빌드를 강제 중단합니다.");
    process.exit(1);
  }

  console.log("✅ [검증 완료] 모든 다국어 키가 100% 일치하며 편차 0%를 만족합니다.");
  process.exit(0);
} catch (err) {
  console.error("❌ [오류 발생] 다국어 정밀 정적 검증 중 치명적인 예외가 발생했습니다.", err);
  process.exit(1);
}
