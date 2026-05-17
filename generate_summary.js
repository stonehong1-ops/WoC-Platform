const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, 'localization_report.json');
if (!fs.existsSync(reportPath)) {
    console.log('Report not found');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const fileMap = {};
let totalCount = 0;

data.forEach(item => {
    if (!fileMap[item.file]) {
        fileMap[item.file] = [];
    }
    fileMap[item.file].push(item);
    totalCount++;
});

const sortedFiles = Object.keys(fileMap).sort((a, b) => fileMap[b].length - fileMap[a].length);

let md = `# WoC Localization Audit Report\n\n`;
md += `**Total Hardcoded Korean Instances:** ${totalCount}\n\n`;
md += `## Summary by File\n`;

sortedFiles.forEach(file => {
    md += `- **${file}**: ${fileMap[file].length} instances\n`;
});

md += `\n## Detailed Findings (Top 10 Files)\n`;

const topFiles = sortedFiles.slice(0, 10);
topFiles.forEach(file => {
    md += `\n### ${file}\n`;
    md += `\`\`\`typescript\n`;
    fileMap[file].slice(0, 10).forEach(item => { // Show up to 10 examples per file
        md += `Line ${item.line}: ${item.text}\n`;
    });
    if (fileMap[file].length > 10) {
        md += `... and ${fileMap[file].length - 10} more\n`;
    }
    md += `\`\`\`\n`;
});

const mdPath = path.join(__dirname, 'localization_summary.md');
fs.writeFileSync(mdPath, md);
console.log('Markdown report generated at localization_summary.md');
