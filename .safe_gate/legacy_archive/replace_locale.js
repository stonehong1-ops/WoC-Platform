const fs = require('fs');
const path = 'c:/Users/stone/WoC/src/contexts/LanguageContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /'group\.tab\.class_user': 'CLASS',\s*'group\.tab\.class_admin': 'CLASS SETTING',/,
  `'group.tab.class_user': 'CLASS',\n    'group.tab.class_admin': 'CLASS SETTING',\n    'group.tab.settings': 'SETTINGS',`
);

content = content.replace(
  /'group\.tab\.class_user': '클래스',\s*'group\.tab\.class_admin': '클래스 설정',/,
  `'group.tab.class_user': '클래스',\n    'group.tab.class_admin': '클래스 설정',\n    'group.tab.settings': '그룹 설정',`
);

fs.writeFileSync(path, content, 'utf8');
console.log('done');
