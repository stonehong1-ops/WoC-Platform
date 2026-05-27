const fs = require('fs');
const path = require('path');

function getAllFiles(dir, ext = '.tsx', fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const srcDir = path.join(__dirname, 'src');
const componentsDir = path.join(srcDir, 'components');
const appDir = path.join(srcDir, 'app');

const allTsx = getAllFiles(srcDir, '.tsx').concat(getAllFiles(srcDir, '.ts'));
const components = getAllFiles(componentsDir, '.tsx');

console.log('--- Unused Components ---');
const fileContents = allTsx.map(f => fs.readFileSync(f, 'utf8'));

for (const comp of components) {
  const baseName = path.basename(comp, '.tsx');
  if (baseName === 'index' || baseName.includes('.test') || baseName.includes('Provider')) continue;
  
  let isUsed = false;
  for (let i = 0; i < allTsx.length; i++) {
    if (allTsx[i] === comp) continue; // skip self
    if (fileContents[i].includes(baseName)) {
      isUsed = true;
      break;
    }
  }
  if (!isUsed) {
    console.log(comp.replace(__dirname, ''));
  }
}

console.log('\n--- Naming Convention Check (Create / Post / Edit) ---');
const suspectNames = components.filter(c => {
  const name = path.basename(c, '.tsx');
  // Look for Create, Edit, Post, Feed keywords but maybe violating conventions
  return /create|edit|post|feed/i.test(name);
});
for (const c of suspectNames) {
  console.log(path.basename(c));
}

console.log('\n--- App Routes (Pages) ---');
const pages = getAllFiles(appDir, 'page.tsx');
pages.forEach(p => console.log(p.replace(appDir, '')));

