const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'contexts', 'LanguageContext.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Match the dictionaries
const enMatch = content.match(/const en = \{([\s\S]+?)\};/);
const krMatch = content.match(/const kr = \{([\s\S]+?)\};/);

function findDuplicates(dictContent, dictName) {
    const lines = dictContent.split('\n');
    const keys = {};
    const duplicates = [];
    lines.forEach((line, index) => {
        const match = line.match(/'([^']+)'\s*:/);
        if (match) {
            const key = match[1];
            if (keys[key]) {
                duplicates.push({ key, line: index + 1, originalLine: keys[key] });
            } else {
                keys[key] = index + 1;
            }
        }
    });
    return duplicates;
}

if (enMatch) {
    const enDuplicates = findDuplicates(enMatch[1], 'en');
    console.log('EN Duplicates:', enDuplicates);
}

if (krMatch) {
    const krDuplicates = findDuplicates(krMatch[1], 'kr');
    console.log('KR Duplicates:', krDuplicates);
}
