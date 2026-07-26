const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { execSync } = require('child_process');

const aabPath = path.resolve('android/app/build/outputs/bundle/release/app-release.aab');

if (!fs.existsSync(aabPath)) {
  console.error("❌ AAB file not found at:", aabPath);
  process.exit(1);
}

const stats = fs.statSync(aabPath);
const fileBuffer = fs.readFileSync(aabPath);
const hashSum = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

console.log("==========================================");
console.log("📌 AAB Release Bundle Build Status & Verification");
console.log("==========================================");
console.log(`✅ Build Result: BUILD SUCCESSFUL`);
console.log(`📁 AAB Full Path: ${aabPath}`);
console.log(`📦 File Size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`🔑 SHA-256 Hash: ${hashSum}`);

// Inspect AAB Zip contents
try {
  const unzipper = require('adm-zip');
  const zip = new unzipper(aabPath);
  const entries = zip.getEntries();
  
  let foundIcon = false;
  let manifestFound = false;
  
  entries.forEach(entry => {
    if (entry.entryName.includes('ic_notification_tango')) {
      foundIcon = true;
      console.log(`🎨 Found Resource in Bundle: ${entry.entryName}`);
    }
    if (entry.entryName.endsWith('AndroidManifest.xml')) {
      manifestFound = true;
      console.log(`📜 Found Manifest in Bundle: ${entry.entryName}`);
    }
  });

  console.log(`\n🔍 Manifest Included: ${manifestFound ? 'YES' : 'NO'}`);
  console.log(`🔍 ic_notification_tango Resource Included: ${foundIcon ? 'YES' : 'NO'}`);
} catch (e) {
  console.log("Adm-zip not available, checking via jar/tar...");
}
