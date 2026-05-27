const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const command = 'npx vercel curl /landing.html --deployment https://woc-platform-ndzhybolz-stonehong1-8062s-projects.vercel.app';

console.log('Fetching landing.html via vercel curl...');

exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error executing vercel curl:', error);
    process.exit(1);
  }
  
  // stdout에 담긴 온전한 HTML 내용을 UTF-8로 저장합니다.
  const targetPath = path.join(__dirname, 'public', 'landing.html');
  
  // HTML 코드 이외의 vercel CLI 정보나 불필요한 줄바꿈 등이 들어갈 수 있으므로 정제합니다.
  // 보통 vercel curl은 순수 response body만 stdout으로 내보냅니다.
  fs.writeFileSync(targetPath, stdout, 'utf-8');
  console.log(`Successfully restored landing.html to ${targetPath}`);
  console.log(`File size: ${stdout.length} bytes`);
});
