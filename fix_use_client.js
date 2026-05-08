const fs = require('fs');

const files = [
  'src/components/auth/AuthModal.tsx',
  'src/components/common/TodoPage.tsx',
  'src/components/groups/GroupHome.tsx',
  'src/components/providers/AuthProvider.tsx',
  'src/components/feed/CreateFeedPopup.tsx',
  'src/components/groups/GroupMemberManager.tsx',
  'src/components/groups/GroupClassAddEditor.tsx',
  'src/components/groups/GroupMembershipEditor.tsx',
  'src/components/groups/GroupRoleEditor.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // If "use client" is not at the very top, but exists somewhere
    if ((content.includes("'use client'") || content.includes('"use client"')) && !content.trim().startsWith("'use client'") && !content.trim().startsWith('"use client"')) {
      content = content.replace(/['"]use client['"];?/g, '');
      content = "'use client';\n" + content;
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed', file);
    }
  }
});
