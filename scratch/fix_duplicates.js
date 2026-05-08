const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'contexts', 'LanguageContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

function fixDuplicates(dictType) {
    const startTag = dictType + ': {';
    let startIndex = content.indexOf(startTag);
    if (startIndex === -1) return;
    startIndex += startTag.length;
    
    // Find matching brace for the dictionary
    let braceCount = 1;
    let endIndex = startIndex;
    while (braceCount > 0 && endIndex < content.length) {
        if (content[endIndex] === '{') braceCount++;
        else if (content[endIndex] === '}') braceCount--;
        endIndex++;
    }
    
    let dictContent = content.substring(startIndex, endIndex - 1);
    let lines = dictContent.split('\n');
    let keys = new Set();
    let uniqueLines = [];
    
    // Process lines backwards to keep the LATEST definition if there's a duplicate
    // (This is usually what's intended in these files)
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const match = line.match(/'([^']+)'\s*:/);
        if (match) {
            const key = match[1];
            if (keys.has(key)) {
                console.log(`Removing duplicate key: ${key} from ${dictType}`);
                continue; // Skip this duplicate
            }
            keys.add(key);
        }
        uniqueLines.unshift(line);
    }
    
    const newDictContent = uniqueLines.join('\n');
    content = content.substring(0, startIndex) + newDictContent + content.substring(endIndex - 1);
}

fixDuplicates('EN');
fixDuplicates('KR');

fs.writeFileSync(filePath, content, 'utf8');
console.log('LanguageContext.tsx fixed.');
