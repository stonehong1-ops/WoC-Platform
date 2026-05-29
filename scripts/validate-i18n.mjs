import fs from "fs";
import path from "path";

const krPath = path.resolve("src/i18n/kr.ts");
const enPath = path.resolve("src/i18n/en.ts");

console.log("🔍 [다국어 정적 무결성 검증] 전수 스캔 및 정밀 검증을 개시합니다.");

// 1. 사전 파일에서 정의된 다국어 키 추출 헬퍼
function extractDictionaryKeys(filePath) {
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

// 2. 재귀적으로 디렉토리 내 검사 파일 스캔
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const absolutePath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), absolutePath);

    // 검사 제외 목록
    if (
      file === "node_modules" ||
      file === ".next" ||
      file === "i18n" || // i18n 폴더 아래 (kr.ts, en.ts 등)
      relativePath.startsWith("src/app/admin/i18n") // i18n 진단 페이지
    ) {
      continue;
    }

    if (fs.statSync(absolutePath).isDirectory()) {
      getFiles(absolutePath, fileList);
    } else {
      const ext = path.extname(file);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        fileList.push(absolutePath);
      }
    }
  }
  return fileList;
}

try {
  const krKeys = extractDictionaryKeys(krPath);
  const enKeys = extractDictionaryKeys(enPath);

  console.log(`📊 사전 등록 현황 - KR: ${krKeys.size}개, EN: ${enKeys.size}개.`);

  const sourceFiles = getFiles(path.resolve("src"));
  console.log(`📁 스캔 대상 소스파일 개수: ${sourceFiles.length}개.`);

  const missingKeysInKr = new Set();
  const missingKeysInEn = new Set();
  const rawTranslationKeys = [];

  // 정적 t() 번역 추출 정규식 (첫 번째 파라미터가 정확하게 순수 문자열 상수이고 그 뒤에 , 가 오거나 ) 로 닫히는 정합한 호출만 수집)
  const tRegex = /\bt\(\s*(['"`])([a-zA-Z0-9_.-]+)\1\s*(?:,\s*|\))/g;
  
  // raw 번역키 검출 정규식 (감사 대상 도메인 접두사 - 소문자 한정하여 오탐 최소화)
  const rawKeyPattern = /\b(chat|class|market|notification)\.[a-z0-9_.-]+/g;

  for (const file of sourceFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const ext = path.extname(file);
    const content = fs.readFileSync(file, "utf-8");

    // 1) 소스코드 내 t('key') 사용 추출 및 사전 등록 여부 검사
    let match;
    while ((match = tRegex.exec(content)) !== null) {
      const key = match[2];
      
      // 동적 템플릿 보간 등은 검사 생략 (정적인 키 포맷만 검사)
      if (key.includes("${")) {
        continue;
      }

      if (!krKeys.has(key)) {
        missingKeysInKr.add(`${key} (in ${relativePath})`);
      }
      if (!enKeys.has(key)) {
        missingKeysInEn.add(`${key} (in ${relativePath})`);
      }
    }

    // 2) 하드코딩 문자열 검사 (Raw Translation Key)
    // 오직 UI 템플릿인 JSX/TSX 파일에 대해서만 화면 노출을 차단하기 위해 엄격히 실시
    if (ext === ".tsx" || ext === ".jsx") {
      let maskedContent = content;
      // 블록 주석 제거
      maskedContent = maskedContent.replace(/\/\*[\s\S]*?\*\//g, "");
      // 한 줄 주석 제거
      maskedContent = maskedContent.replace(/\/\/.*$/gm, "");
      // t() 호출부 통째로 마스킹하여 오탐 완벽 격리 (가장 확실한 묘수)
      maskedContent = maskedContent.replace(/\bt\(\s*([\s\S]*?)\)/g, "");

      const maskedLines = maskedContent.split("\n");
      for (let idx = 0; idx < maskedLines.length; idx++) {
        const lineText = maskedLines[idx];
        const lineTrimmed = lineText.trim();
        
        // import 문은 번역키 사용이 아니므로 생략
        if (lineTrimmed.startsWith("import ")) {
          continue;
        }

        let rawMatch;
        while ((rawMatch = rawKeyPattern.exec(lineText)) !== null) {
          const detectedKey = rawMatch[0];
          
          // JS / TS 기본 내장 API 및 Array 메소드 호출에 대한 완치 필터링
          if (
            detectedKey.endsWith(".push") ||
            detectedKey.endsWith(".map") ||
            detectedKey.endsWith(".filter") ||
            detectedKey.endsWith(".length") ||
            detectedKey.endsWith(".name") ||
            detectedKey.endsWith(".id") ||
            detectedKey.endsWith(".trim") ||
            detectedKey.endsWith(".split")
          ) {
            continue;
          }

          // 비즈니스 로직 (분기 처리, 변수 할당, 문자열 처리 등) 내의 식별자성 매칭 필터링
          if (
            lineTrimmed.includes("startsWith(") ||
            lineTrimmed.includes("split(") ||
            lineTrimmed.includes("===") ||
            lineTrimmed.includes("!==") ||
            lineTrimmed.startsWith("const ") ||
            lineTrimmed.startsWith("let ") ||
            lineTrimmed.startsWith("case ") ||
            lineTrimmed.includes("::") || // 시스템 메시지 프로토콜 식별자 (예: chat.system_join_params::)
            lineTrimmed.includes("lastMessage:") ||
            lineTrimmed.includes("text = `") ||
            lineTrimmed.includes("text = '") ||
            lineTrimmed.includes("text = \"")
          ) {
            continue;
          }

          // HTML 요소 태그 이름이나 CSS 클래스명에 포함된 경우 예외 필터링
          if (lineText.includes(`"${detectedKey}"`) || lineText.includes(`'${detectedKey}'`)) {
            const normalized = lineText.toLowerCase();
            if (
              normalized.includes("classname=") ||
              normalized.includes("style=") ||
              normalized.includes("id=") ||
              normalized.includes("key=")
            ) {
              continue;
            }
          }

          rawTranslationKeys.push({
            file: relativePath,
            line: idx + 1,
            key: detectedKey,
            text: lineTrimmed
          });
        }
      }
    }
  }

  let hasError = false;

  // 사전 간 키 대조
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

  if (missingInEn.length > 0) {
    console.error(`🚨 [사전 불일치] 영어 사전(en.ts)에 한국어 사전(kr.ts)의 키가 누락되었습니다.`);
    missingInEn.forEach(key => console.error(`   - 누락 키: ${key}`));
    hasError = true;
  }
  if (missingInKr.length > 0) {
    console.error(`🚨 [사전 불일치] 한국어 사전(kr.ts)에 영어 사전(en.ts)의 키가 누락되었습니다.`);
    missingInKr.forEach(key => console.error(`   - 누락 키: ${key}`));
    hasError = true;
  }

  // 소스코드 미등록 번역 키 에러 리포트
  if (missingKeysInKr.size > 0) {
    console.error(`🚨 [소스 누락] 한국어 사전(kr.ts)에 등록되지 않은 t() 호출이 감지되었습니다.`);
    missingKeysInKr.forEach(item => console.error(`   - 누락: ${item}`));
    hasError = true;
  }
  if (missingKeysInEn.size > 0) {
    console.error(`🚨 [소스 누락] 영어 사전(en.ts)에 등록되지 않은 t() 호출이 감지되었습니다.`);
    missingKeysInEn.forEach(item => console.error(`   - 누락: ${item}`));
    hasError = true;
  }

  // 하드코딩 생 번역 키 에러 리포트
  if (rawTranslationKeys.length > 0) {
    console.error(`🚨 [하드코딩 감지] t()로 감싸지 않은 생 번역키가 JSX/소스코드에 직접 사용되었습니다.`);
    rawTranslationKeys.forEach(err => {
      console.error(`   - 위치: ${err.file}:${err.line} -> 검출된 키: [${err.key}]`);
      console.error(`     코드 내용: ${err.text}`);
    });
    hasError = true;
  }

  if (hasError) {
    console.error("❌ [검증 실패] 영한 다국어 정적 검증에 실패했습니다. 빌드를 강제 탈락시킵니다.");
    process.exit(1);
  }

  console.log("✅ [검증 완료] 모든 정적 다국어 및 소스코드 하드코딩 무결성 검증을 통과했습니다.");
  process.exit(0);
} catch (err) {
  console.error("❌ [오류 발생] 다국어 정밀 정적 검증 중 치명적인 예외가 발생했습니다.", err);
  process.exit(1);
}
