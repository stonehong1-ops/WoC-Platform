const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      if (name.endsWith('.ts') || name.endsWith('.tsx')) {
        files.push(name);
      }
    }
  }
  return files;
}

const files = getFiles('src');
let found = 0;

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    traverse(ast, {
      StringLiteral(path) {
        if (/[가-힣]/.test(path.node.value)) {
          console.log(`${file}:${path.node.loc.start.line} - String: "${path.node.value}"`);
          found++;
        }
      },
      JSXText(path) {
        if (/[가-힣]/.test(path.node.value)) {
          console.log(`${file}:${path.node.loc.start.line} - JSX: "${path.node.value.trim()}"`);
          found++;
        }
      },
      TemplateElement(path) {
        if (/[가-힣]/.test(path.node.value.raw)) {
          console.log(`${file}:${path.node.loc.start.line} - Template: "${path.node.value.raw.trim()}"`);
          found++;
        }
      }
    });
  } catch(e) {
    // ignore parse errors
  }
});

console.log(`Total found: ${found}`);
