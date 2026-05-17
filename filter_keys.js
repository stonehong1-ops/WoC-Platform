const fs = require('fs');
const lines = fs.readFileSync('i18n_missing.txt','utf-8').split('\n').filter(l => l.trim() && !l.includes('$'));
console.log('Static missing keys:', lines.length);
fs.writeFileSync('i18n_static_missing.txt', lines.join('\n'), 'utf-8');
lines.forEach(l => console.log(l));
