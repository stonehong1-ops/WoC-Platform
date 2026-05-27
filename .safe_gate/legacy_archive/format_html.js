const fs = require('fs');
const content = fs.readFileSync('original_design.html', 'utf8');
// Replace > with >\n to make it somewhat readable and split into lines
const formatted = content.replace(/>/g, '>\n');
fs.writeFileSync('formatted_design.html', formatted);
console.log('Done');
