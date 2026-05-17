const fs = require('fs');
const path = 'C:/Users/stone/WoC/src/contexts/LanguageContext.tsx';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Line 5627 in 1-indexed is index 5626 in 0-indexed
const targetLineIndex = 5626; 

console.log(`Line ${targetLineIndex + 1}: ${lines[targetLineIndex]}`);

if (lines[targetLineIndex].includes('country.etc')) {
    console.log('Target confirmed at line 5627');
    
    // Check if line 5629 has 'const saved'
    const markerLineIndex = 5628; // index 5628 is line 5629
    console.log(`Line ${markerLineIndex + 1}: ${lines[markerLineIndex]}`);
    
    if (lines[markerLineIndex].includes('const saved')) {
        const part1 = lines.slice(0, targetLineIndex + 1).join('\n');
        const part2 = "\n  }\n};\n\nexport function LanguageProvider({ children }: { children: ReactNode }) {\n  const [language, setLangState] = useState<Language>('EN');\n\n  useEffect(() => {";
        const part3 = lines.slice(markerLineIndex).join('\n');
        
        const newContent = part1 + part2 + '\n' + part3;
        fs.writeFileSync(path, newContent, 'utf8');
        console.log('Successfully fixed LanguageContext.tsx');
    } else {
        console.log('Marker not found at line 5629');
    }
} else {
    console.log('Target not found at line 5627');
}
