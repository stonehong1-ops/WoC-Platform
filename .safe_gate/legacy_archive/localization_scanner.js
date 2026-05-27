const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const koreanRegex = /[가-힣]/;

function scanDir(dir, results) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // Ignore node_modules, .next, etc.
            if (!['node_modules', '.next', 'dist', '.git'].includes(file)) {
                scanDir(fullPath, results);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            let inCommentBlock = false;
            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                
                // Handle block comments (simple approximation)
                if (trimmedLine.startsWith('/*')) inCommentBlock = true;
                if (trimmedLine.includes('*/')) {
                    inCommentBlock = false;
                    return;
                }
                if (inCommentBlock) return;
                
                // Ignore line comments
                if (trimmedLine.startsWith('//')) return;
                
                // Exclude import statements and console logs
                if (trimmedLine.startsWith('import ')) return;
                if (trimmedLine.includes('console.log') || trimmedLine.includes('console.error')) return;
                
                // Find Korean characters
                if (koreanRegex.test(line)) {
                    // Exclude LanguageContext itself as it's the dictionary
                    if (!fullPath.includes('LanguageContext.tsx') && !fullPath.includes('ko.json')) {
                        results.push({
                            file: fullPath.replace(__dirname, ''),
                            line: index + 1,
                            text: trimmedLine
                        });
                    }
                }
            });
        }
    }
}

const results = [];
scanDir(srcDir, results);

const reportPath = path.join(__dirname, 'localization_report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`Found ${results.length} lines with potential hardcoded Korean.`);
