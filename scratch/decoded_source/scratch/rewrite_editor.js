const fs = require('fs');

const originalFilePath = 'src/components/groups/GroupClassAddEditor.tsx';
let content = fs.readFileSync(originalFilePath, 'utf8');

// 1. Import FullScreenRegistration
content = content.replace(
  'import { useLanguage } from "@/contexts/LanguageContext";',
  'import { useLanguage } from "@/contexts/LanguageContext";\nimport FullScreenRegistration from "@/components/common/FullScreenRegistration";'
);

// 2. Remove the react-dom portal logic and the custom header
const returnBlockStart = content.indexOf('  return createPortal(');
if (returnBlockStart !== -1) {
  const mainStart = content.indexOf('      <main className="max-w-3xl mx-auto p-6 space-y-8 mt-4 w-full">');
  const returnBlockToMain = content.substring(returnBlockStart, mainStart + '      <main className="max-w-3xl mx-auto p-6 space-y-8 mt-4 w-full">'.length);
  
  content = content.replace(
    returnBlockToMain,
    `  const isValid = !!(formData.title && formData.amount >= 0 && formData.instructors.length > 0 && formData.schedule.length > 0);

  return (
    <FullScreenRegistration
      id="class-add"
      title={isEditMode ? t('class.edit_class') : t('class.add_class')}
      submitLabel={t('common.save') || 'SAVE'}
      submittingLabel={\`\${t('common.saving')}...\`}
      onSubmit={handleSave}
      isSubmitting={isSaving}
      isValid={isValid}
      onClose={onClose}
    >
      <div className="space-y-10 pt-4">`
  );
}

// Remove the closing portal tags at the bottom
const closingTags = `        </main>
    </div>,
    document.body
  );
};`;
if (content.includes(closingTags)) {
  content = content.replace(
    closingTags,
    `      </div>
    </FullScreenRegistration>
  );
};`
  );
}

// 3. Update styling
const replacements = [
  {
    from: `className="bg-[#ffffff] rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-[#a3abd7]/10"`,
    to: `className="space-y-6"`
  },
  {
    from: `className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2"`,
    to: `className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1"`
  },
  {
    from: `className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]"`,
    to: `className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0 bg-transparent"`
  },
  {
    from: `className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7] resize-y"`,
    to: `className="w-full min-h-[160px] bg-gray-50 border-none rounded-[28px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none leading-relaxed"`
  },
  {
    from: `className="w-full bg-[#F1F5F9] border-0 rounded-lg pl-12 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]"`,
    to: `className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"`
  },
  {
    from: `className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all"`,
    to: `className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"`
  },
  {
    from: `className="flex-1 bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all"`,
    to: `className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"`
  },
  {
    from: `className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all appearance-none pr-10"`,
    to: `className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10 appearance-none pr-10"`
  },
  {
    from: `className="w-full bg-[#F1F5F9] border-0 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]"`,
    to: `className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-lg font-black focus:ring-2 focus:ring-primary/10 text-right"`
  },
  {
    from: `className="w-full bg-[#F1F5F9] border border-outline/30 rounded-lg px-4 py-3 text-[#242c51] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"`,
    to: `className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10 text-right"`
  },
  {
    from: `border-2 border-dashed border-outline/30 rounded-xl`,
    to: `border-2 border-dashed border-gray-200 rounded-2xl`
  },
  {
    from: `<h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[14px] uppercase tracking-wide text-[#242c51]">`,
    to: `<h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">`
  }
];

replacements.forEach(({from, to}) => {
  content = content.split(from).join(to);
});

fs.writeFileSync(originalFilePath, content, 'utf8');
console.log('Update complete.');
