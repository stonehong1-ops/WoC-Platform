const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src');
const results = [];

// Files to skip
const skipFiles = [
    'LanguageContext.tsx', // Localization dictionary itself
    'wocSystemGuide.ts',
    'safeDate.ts'
];

// Directories to skip
const skipDirs = [
    'pt1', // Presentation
    'scripts'
];

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!skipDirs.includes(file)) {
                scanDir(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            if (skipFiles.some(skipFile => fullPath.endsWith(skipFile))) continue;
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            let inBlockComment = false;
            
            const fileResults = [];
            
            lines.forEach((line, index) => {
                const trimmed = line.trim();
                
                // Handle block comments
                if (trimmed.includes('/*')) inBlockComment = true;
                if (trimmed.includes('*/')) {
                    inBlockComment = false;
                    return; // Skip the line where block comment ends
                }
                if (inBlockComment) return;
                
                // Ignore line comments
                if (trimmed.startsWith('//')) return;
                
                // Ignore console.logs and similar debugging
                if (trimmed.startsWith('console.')) return;
                
                // Check for Korean characters
                if (/[가-힣]/.test(trimmed)) {
                    fileResults.push({ line: index + 1, text: trimmed });
                }
            });
            
            if (fileResults.length > 0) {
                results.push({
                    file: fullPath.replace(rootDir, '').replace(/\\/g, '/'),
                    matches: fileResults
                });
            }
        }
    }
}

scanDir(rootDir);

let markdown = '# 🌐 Missing Localization Report (Korean Text Found)\n\n';
markdown += 'This report lists all hardcoded Korean text found in the `.tsx` and `.ts` files inside `src` directory (excluding comments, `LanguageContext.tsx`, and presentation slides).\n\n';

let totalFiles = 0;
let totalMatches = 0;

results.forEach(fileObj => {
    totalFiles++;
    totalMatches += fileObj.matches.length;
    markdown += `### \`src${fileObj.file}\`\n`;
    markdown += '| Line | Content |\n|---|---|\n';
    fileObj.matches.forEach(m => {
        // truncate long lines for readability
        let text = m.text;
        if (text.length > 100) text = text.substring(0, 97) + '...';
        // escape pipes and backticks
        text = text.replace(/\|/g, '\\|').replace(/`/g, '\\`');
        markdown += `| ${m.line} | \`${text}\` |\n`;
    });
    markdown += '\n';
});

markdown = `**Summary:** Found **${totalMatches}** instances of hardcoded Korean text across **${totalFiles}** files.\n\n` + markdown;

fs.writeFileSync('localization_report.md', markdown);
console.log(`Report generated. Total files: ${totalFiles}, Total matches: ${totalMatches}`);
