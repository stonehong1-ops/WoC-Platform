const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\7b1c323c-14d1-4562-ac36-6bb777b5c286\\.tempmediaStorage';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

async function check() {
  for (const f of files) {
    const meta = await sharp(path.join(dir, f)).metadata();
    console.log(`${f}: ${meta.width}x${meta.height} (${Math.round(fs.statSync(path.join(dir, f)).size / 1024)} KB)`);
  }
}
check();
