const fs = require('fs');

const files = [
  'src/components/social/EditSocialEvent.tsx',
  'src/components/class/ClassAddEditor.tsx',
  'src/components/events/EditEvent.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/placeholder:text-\[#acb3b4\](?! placeholder:font-normal)/g, 'placeholder:text-[#acb3b4] placeholder:font-normal');
  content = content.replace(/focus-within:ring-primary\/20/g, 'focus-within:ring-[#007AFF]/20');
  content = content.replace(/text-\[16px\] font-bold text-\[#2d3435\]/g, 'text-sm font-bold text-[#2d3435]');
  content = content.replace(/text-\[16px\] font-medium text-\[#2d3435\]/g, 'text-sm font-bold text-[#2d3435]');
  // for text-sm font-medium text-[#2d3435] if any
  content = content.replace(/text-sm font-medium text-\[#2d3435\]/g, 'text-sm font-bold text-[#2d3435]');
  
  fs.writeFileSync(file, content);
});

console.log('Replacement complete.');
