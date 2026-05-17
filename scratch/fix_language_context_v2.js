const fs = require('fs');
const path = 'C:/Users/stone/WoC/src/contexts/LanguageContext.tsx';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const searchKey = "'country.etc':";
const nextMarker = "const saved = localStorage.getItem";

let keyIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchKey)) {
        keyIndex = i;
        break;
    }
}

if (keyIndex === -1) {
    console.log('Key not found');
    process.exit(1);
}

let markerIndex = -1;
for (let i = keyIndex; i < lines.length; i++) {
    if (lines[i].includes(nextMarker)) {
        markerIndex = i;
        break;
    }
}

if (markerIndex === -1) {
    console.log('Marker not found');
    process.exit(1);
}

console.log(`Found key at ${keyIndex + 1} and marker at ${markerIndex + 1}`);

const part1 = lines.slice(0, keyIndex + 1).join('\n');
const part2 = "\n  }\n};\n\nexport function LanguageProvider({ children }: { children: ReactNode }) {\n  const [language, setLangState] = useState<Language>('EN');\n\n  useEffect(() => {";
const part3 = lines.slice(markerIndex).join('\n');

const newContent = part1 + part2 + '\n' + part3;
fs.writeFileSync(path, newContent, 'utf8');
console.log('Successfully fixed LanguageContext.tsx');
