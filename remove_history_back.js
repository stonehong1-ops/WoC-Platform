const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "c:\\Users\\stone\\WoC\\src\\components\\groups\\GroupCalendar.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\groups\\GroupAbout.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\plaza\\MediaViewer.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\live\\LiveFeed.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\layout\\LocationSelector.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\layout\\NotificationTray.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\layout\\AppSettingsPopup.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\common\\FullScreenRegistration.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\auth\\AuthModal.tsx",
  "c:\\Users\\stone\\WoC\\src\\app\\groups\\page.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\chat\\GroupMembersPopup.tsx",
  "c:\\Users\\stone\\WoC\\src\\components\\chat\\ChatRoom.tsx"
];

filesToUpdate.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Remove import
  content = content.replace(/import\s+\{\s*useHistoryBack\s*\}\s+from\s+['"]@\/hooks\/useHistoryBack['"];?\n?/g, '');
  
  // Replace const { handleClose... } = useHistoryBack(isOpen, onClose, ...)
  // This regex matches `const { handleClose: alias } = useHistoryBack(arg1, arg2);`
  // or `const { handleClose } = useHistoryBack(arg1, arg2);`
  const regex = /const\s+\{\s*handleClose(?:\s*:\s*(\w+))?(?:,\s*forceClose(?:\s*:\s*\w+)?)?\s*\}\s*=\s*useHistoryBack\(([^,]+),\s*(.+?)\);/g;
  
  content = content.replace(regex, (match, alias, arg1, arg2AndRest) => {
    const fnName = alias ? alias : 'handleClose';
    
    // arg2AndRest might contain more than just onClose, e.g., `() => setX(false), "Are you sure?"`
    // We just take the onClose part (roughly). Since arrow functions might have commas, 
    // it's tricky to parse. Let's assume arg2 is the onClose function and use it directly.
    // If it's complex, we can just define a basic wrapper.
    // Actually, we can just replace the whole thing with a function definition that calls onClose.
    // To be safe, we extract the onClose part up to the first top-level comma, but regex isn't a full parser.
    // Most uses are `useHistoryBack(isOpen, () => setIsOpen(false))`
    // Let's just capture everything after the first argument and wrap it.
    
    // simple hack: if there's no confirmMessage, arg2AndRest is just the onClose function
    return `const ${fnName} = ${arg2AndRest.split(',')[0]}; // Replaced useHistoryBack`;
  });

  // some files might just use `useHistoryBack(...)` without destructuring
  content = content.replace(/useHistoryBack\([^)]+\);\n?/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
