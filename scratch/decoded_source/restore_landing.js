const { execSync } = require('child_process');
const fs = require('fs');

try {
    // 1. Get original content from git
    const originalContent = execSync('git show eb63f0db7334aaf34e938b585ca372ba0b645d42:src/app/page.tsx', { encoding: 'utf8' });
    
    // 2. Apply branding updates
    let updatedContent = originalContent
        .replace('WoC / World Of Community', 'WOC / WORLD OF GROUP')
        .replace('WORLD OF COMMUNITY_', 'WORLD OF GROUP_')
        .replace('Life goes ON_', 'Life goes ON_<span className="inline-block w-2.5 h-2.5 bg-[#4ade80] rounded-full ml-3 mb-1"></span>')
        .replace('World of Community © 2026', 'World of Group © 2026');

    // 3. Write to the file
    fs.writeFileSync('src/app/page.tsx', updatedContent, 'utf8');
    console.log('Successfully restored and updated branding in src/app/page.tsx');
} catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
