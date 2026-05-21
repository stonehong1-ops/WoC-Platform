const fs = require('fs');
const path = './src/components/groups/GroupModuleRenderer.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/visitedTabs\.has\('([^']+)'\) && isFullMember &&/g, "visitedTabs.has('$1') && (isFullMember || isAdminUser) &&");
fs.writeFileSync(path, content);
console.log('Replaced successfully');
