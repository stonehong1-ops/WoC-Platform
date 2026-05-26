const fs = require('fs');
const path = require('path');

const antigravityTxtPath = path.join(__dirname, '../public/antigravity.txt');
const liveFeedPath = path.join(__dirname, '../src/components/live/LiveFeed.tsx');

if (!fs.existsSync(antigravityTxtPath)) {
  console.error('public/antigravity.txt file not found!');
  process.exit(1);
}

if (!fs.existsSync(liveFeedPath)) {
  console.error('LiveFeed.tsx file not found!');
  process.exit(1);
}

// 1. antigravity.txt 내용을 UTF-8로 무결하게 읽어 base64로 변환
const rawHtml = fs.readFileSync(antigravityTxtPath, 'utf8');

// <style data-purpose="diamond-layout"> 시작 인덱스 찾기
const startIndex = rawHtml.indexOf('<style data-purpose="diamond-layout">');
// </footer> 끝 인덱스 찾기
const endTag = '</footer>';
const endIndex = rawHtml.indexOf(endTag) + endTag.length;

if (startIndex === -1 || endIndex === -1) {
  console.error('Core content boundary not found in public/antigravity.txt!');
  process.exit(1);
}

const bodyHtmlFragment = rawHtml.substring(startIndex, endIndex);

// 한글 유니코드가 깨지지 않도록 base64 인코딩 표준 안전 함수 구현
function utf8ToBase64(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

const base64Html = utf8ToBase64(bodyHtmlFragment);

// 2. LiveFeed.tsx 내용 읽기
let liveFeedContent = fs.readFileSync(liveFeedPath, 'utf8');

// 3. ANTIGRAVITY_HTML 상수 부분 찾아서 base64 값으로 치환하기
const constPattern = /const ANTIGRAVITY_HTML = "[\s\S]*?";/g;
const replacement = `const ANTIGRAVITY_HTML = "${base64Html}";`;

if (constPattern.test(liveFeedContent)) {
  liveFeedContent = liveFeedContent.replace(constPattern, replacement);
  console.log('Successfully updated ANTIGRAVITY_HTML constant with UTF-8 base64 string!');
} else {
  // 만약 못 찾으면 최하단에 새로 추가
  liveFeedContent += `\n\nconst ANTIGRAVITY_HTML = "${base64Html}";\n`;
  console.log('Successfully added ANTIGRAVITY_HTML constant as base64 to the end of file!');
}

// 4. dangerouslySetInnerHTML 영역에서 한글 유니코드를 무결하게 복원하는 디코딩 함수로 교체
const innerHTMLPattern = /dangerouslySetInnerHTML=\{\{\s*__html:\s*typeof window !== "undefined" \? atob\(ANTIGRAVITY_HTML\) : ""\s*\}\}/g;
const safeDecoder = 'dangerouslySetInnerHTML={{ __html: typeof window !== "undefined" ? decodeURIComponent(atob(ANTIGRAVITY_HTML).split("").map(function(c) { return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2); }).join("")) : "" }}';

if (innerHTMLPattern.test(liveFeedContent)) {
  liveFeedContent = liveFeedContent.replace(innerHTMLPattern, safeDecoder);
  console.log('Successfully updated dangerouslySetInnerHTML to safe Unicode UTF-8 base64 decoding!');
} else {
  // 혹시 이전의 다른 패턴이 있을 수 있으니 포괄적으로 매칭 및 교체
  const loosePattern = /dangerouslySetInnerHTML=\{\{\s*__html:\s*[^}]+\s*\}\}/g;
  // LiveFeed.tsx 내 390~410라인 부근의 dangerouslySetInnerHTML 만 교체되도록 1차 보장
  liveFeedContent = liveFeedContent.replace(
    'dangerouslySetInnerHTML={{ __html: ANTIGRAVITY_HTML }}',
    safeDecoder
  );
  console.log('Successfully updated dangerouslySetInnerHTML fallback!');
}

fs.writeFileSync(liveFeedPath, liveFeedContent, 'utf8');
console.log('LiveFeed.tsx Unicode-safe porting completed!');
