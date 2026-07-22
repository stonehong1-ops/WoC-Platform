const fs = require('fs');

const filePath = 'c:\\Users\\stone\\WoC\\src\\app\\people\\[id]\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const colorsMap = {
    '\\bbg-surface-container-lowest\\b': 'bg-white',
    '\\bbg-surface-container-low\\b': 'bg-[#f8f9fa]',
    '\\bbg-surface-container-highest\\b': 'bg-[#f2f4f4]',
    '\\bbg-surface-container\\b': 'bg-[#f2f4f4]',
    '\\bbg-surface\\b(?!-)': 'bg-white',
    '\\btext-on-surface-variant\\b': 'text-[#596061]',
    '\\btext-on-surface\\b(?!-)': 'text-[#2d3435]',
    '\\bborder-outline-variant\\b': 'border-[#e0e4e5]',
    '\\bborder-outline\\b(?!-)': 'border-[#e0e4e5]',
    '\\bbg-primary-container\\b': 'bg-primary/10',
    '\\btext-outline\\b(?!-)': 'text-[#acb3b4]',
};

for (const [k, v] of Object.entries(colorsMap)) {
    const regex = new RegExp(k, 'g');
    content = content.replace(regex, v);
}

content = content.replace(/bg-white\/10 backdrop-blur-md text-white/g, 'bg-black/20 backdrop-blur-sm text-white');
content = content.replace(/scrolled \? 'text-\[#2d3435\] hover:bg-slate-100'/g, "scrolled ? 'bg-slate-100 text-[#2d3435]'");
content = content.replace(/'bg-white shadow-md pb-2'/g, "'bg-white/95 backdrop-blur-md shadow-sm pb-2'");

const oldMenuClass1 = 'absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-[#e0e4e5]/10 overflow-hidden min-w-[160px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200';
const oldMenuClass2 = 'absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-outline/10 overflow-hidden min-w-[160px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200';
const newMenuClass = 'absolute right-0 mt-2 z-[120] bg-white border border-slate-100 shadow-xl rounded-2xl py-1 w-28 overflow-hidden';

content = content.replace(oldMenuClass1, newMenuClass);
content = content.replace(oldMenuClass2, newMenuClass);

content = content.replace(/w-full flex items-center gap-3 px-4 py-3 text-sm text-\[#2d3435\] hover:bg-\[#f2f4f4\] transition-colors(?: border-t border-\[#e0e4e5\]\/5)?/g, 'w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2');
content = content.replace(/w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors(?: border-t border-\[#e0e4e5\]\/5)?/g, 'w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2');

content = content.replace(/bg-\[#f8f9fa\] p-6 rounded-2xl border border-\[#e0e4e5\]\/10/g, 'bg-[#f8f9fa] p-6 rounded-2xl border border-[#e0e4e5]');

content = content.replace(/text-\[10px\] font-bold uppercase tracking-widest/g, 'text-[10px] font-black text-[#acb3b4] uppercase tracking-widest');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
