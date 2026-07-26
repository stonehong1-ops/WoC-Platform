const fs = require('fs');
const path = require('path');

function getFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getFiles(filePath, arrayOfFiles);
    } else {
      const stats = fs.statSync(filePath);
      arrayOfFiles.push({
        path: filePath.replace(/\\/g, '/'),
        size: stats.size
      });
    }
  });

  return arrayOfFiles;
}

const assetsPath = path.resolve('android/app/src/main/assets');
console.log("==========================================");
console.log("📊 Analyzing android/app/src/main/assets size...");
console.log("==========================================");

if (fs.existsSync(assetsPath)) {
  const allFiles = getFiles(assetsPath);
  allFiles.sort((a, b) => b.size - a.size);

  let totalSize = allFiles.reduce((acc, f) => acc + f.size, 0);
  console.log(`📦 Total Assets Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB (${allFiles.length} files)\n`);
  
  console.log("🏆 TOP 20 Largest Files in Assets:");
  allFiles.slice(0, 20).forEach((f, idx) => {
    const sizeMb = (f.size / 1024 / 1024).toFixed(2);
    const sizeKb = (f.size / 1024).toFixed(1);
    const displaySize = f.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;
    console.log(`${(idx + 1).toString().padStart(2)}. [${displaySize}] ${f.path.replace(assetsPath.replace(/\\/g, '/'), '')}`);
  });
} else {
  console.log("Assets directory not found.");
}
