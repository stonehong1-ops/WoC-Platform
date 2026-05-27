const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  content = content.replace(/@\/components\/group\//g, '@/components/groups/');
  content = content.replace(/from '\.\.\/group\//g, "from '../groups/");
  content = content.replace(/from "\.\.\/group\//g, 'from "../groups/');
  content = content.replace(/from '\.\.\/\.\.\/components\/group\//g, "from '../../components/groups/");
  content = content.replace(/from "\.\.\/\.\.\/components\/group\//g, 'from "../../components/groups/');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
    changedCount++;
  }
});

console.log('Total files updated: ' + changedCount);
