const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  const sessionDir = __dirname;
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  const sessionPath = path.join(sessionDir, 'fb_session.json');
  
  console.log('페이스북 세션 생성을 시작합니다.');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://www.facebook.com');
  
  console.log('\n==================================================');
  console.log('1. 브라우저에서 페이스북 로그인을 수동으로 완료해 주세요.');
  console.log('2. 로그인이 끝나면 터미널로 돌아와 [Enter] 키를 입력해 주세요.');
  console.log('==================================================\n');
  
  await new Promise((resolve) => rl.question('로그인을 완료했으면 Enter 키를 누르세요...', resolve));
  
  const cookies = await context.cookies();
  fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));
  console.log(`\n✅ 세션 쿠키 정보가 안전하게 저장되었습니다: ${sessionPath}`);
  
  await browser.close();
  rl.close();
})();
