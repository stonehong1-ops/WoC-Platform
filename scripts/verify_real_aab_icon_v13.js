const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const child_process = require('child_process');

const aabPath = path.resolve('android/app/build/outputs/bundle/release/app-release.aab');
console.log('📌 AAB File Exists:', fs.existsSync(aabPath), 'Size:', fs.statSync(aabPath).size, 'bytes');

const inspectDir = path.resolve('android/build/tmp/aab_inspect');
if (fs.existsSync(inspectDir)) fs.rmSync(inspectDir, { recursive: true, force: true });
fs.mkdirSync(inspectDir, { recursive: true });

// Extract AAB using powershell Expand-Archive
const psCommand = `powershell -Command "Expand-Archive -Path '${aabPath}' -DestinationPath '${inspectDir}' -Force"`;
console.log("Unzipping AAB via PowerShell...");
child_process.execSync(psCommand, { stdio: 'ignore' });

const resFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.includes('ic_launcher') && f.endsWith('.png')) resFiles.push(p);
  }
}
walk(inspectDir);

console.log(`🔍 Found ${resFiles.length} extracted icon files inside AAB:`);

async function verify() {
  for (const file of resFiles) {
    const meta = await sharp(file).metadata();
    const relativePath = path.relative(inspectDir, file);
    
    const trimInfo = await sharp(file).trim().toBuffer({ resolveWithObject: true });
    const logoWidth = trimInfo.info.width;
    const logoHeight = trimInfo.info.height;
    const ratio = ((logoWidth / meta.width) * 100).toFixed(1);

    console.log(` ✅ [AAB Verified] ${relativePath}`);
    console.log(`    Canvas: ${meta.width}x${meta.height}px | Inner Logo Width: ${logoWidth}px (${ratio}% of canvas)\n`);
  }
}

verify().catch(console.error);
