const fs = require('fs');
const path = 'C:/Users/stone/WoC/src/contexts/LanguageContext.tsx';

let content = fs.readFileSync(path, 'utf8');

// Find the spot to insert the provider
const target = "'country.etc': '기타',";
const replacement = "'country.etc': '기타',\n  }\n};\n\nexport function LanguageProvider({ children }: { children: ReactNode }) {\n  const [language, setLangState] = useState<Language>('EN');\n\n  useEffect(() => {";

// We need to be careful with potential encoding issues in the string '기타'
// Let's search for the key 'country.etc' instead
const searchKey = "'country.etc':";
const lines = content.split('\n');
let targetIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchKey)) {
        targetIndex = i;
        break;
    }
}

if (targetIndex !== -1) {
    // Check if the next non-empty line is 'const saved'
    let nextLineIndex = targetIndex + 1;
    while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
        nextLineIndex++;
    }
    
    if (nextLineIndex < lines.length && lines[nextLineIndex].includes('const saved')) {
        console.log(`Found target at line ${targetIndex + 1}, fixing...`);
        
        // Replace from targetIndex to nextLineIndex-1 with the closed braces and provider start
        const part1 = lines.slice(0, targetIndex + 1).join('\n');
        const part2 = "\n  }\n};\n\nexport function LanguageProvider({ children }: { children: ReactNode }) {\n  const [language, setLangState] = useState<Language>('EN');\n\n  useEffect(() => {";
        const part3 = lines.slice(nextLineIndex).join('\n');
        
        const newContent = part1 + part2 + '\n' + part3;
        fs.writeFileSync(path, newContent, 'utf8');
        console.log('File updated successfully.');
    } else {
        console.log('Could not find "const saved" after "country.etc"');
    }
} else {
    console.log('Could not find "country.etc"');
}
