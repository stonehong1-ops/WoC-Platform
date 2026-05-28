const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const ignoreDirs = ['node_modules', '.next', '.git', '.vercel', 'artifacts', 'temp_scenes'];

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        walk(fullPath, callback);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (['.tsx', '.ts', '.js', '.jsx', '.html', '.json', '.md'].includes(ext)) {
        callback(fullPath);
      }
    }
  }
}

console.log('Scanning entire project for "읽"...');
walk(rootDir, (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('읽')) {
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('읽')) {
          console.log(`[FOUND] ${path.relative(rootDir, filePath)}:${i + 1} -> ${line.trim()}`);
        }
      });
    }
  } catch (e) {
    // Ignore binary or permission files
  }
});
console.log('Scan completed!');
