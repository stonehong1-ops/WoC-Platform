const fs = require('fs');
const path = 'C:/Users/stone/WoC/src/contexts/LanguageContext.tsx';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

console.log(`Total lines: ${lines.length}`);

// Find the marker 'const saved = localStorage.getItem'
let markerIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const saved = localStorage.getItem')) {
        markerIndex = i;
        break;
    }
}

if (markerIndex !== -1) {
    console.log(`Found marker at ${markerIndex + 1}: ${lines[markerIndex]}`);
    
    // The dictionary should end before this marker.
    // Let's find the last 'country.etc' before this marker.
    let keyIndex = -1;
    for (let i = markerIndex - 1; i >= 0; i--) {
        if (lines[i].includes('country.etc')) {
            keyIndex = i;
            break;
        }
    }
    
    if (keyIndex !== -1) {
        console.log(`Found key at ${keyIndex + 1}: ${lines[keyIndex]}`);
        
        const part1 = lines.slice(0, keyIndex + 1).join('\n');
        const part2 = "\n  }\n};\n\nexport function LanguageProvider({ children }: { children: ReactNode }) {\n  const [language, setLangState] = useState<Language>('EN');\n\n  useEffect(() => {";
        const part3 = lines.slice(markerIndex).join('\n');
        
        const newContent = part1 + part2 + '\n' + part3;
        fs.writeFileSync(path, newContent, 'utf8');
        console.log('Successfully fixed LanguageContext.tsx');
    } else {
        console.log('Key not found before marker');
    }
} else {
    console.log('Marker not found');
}
