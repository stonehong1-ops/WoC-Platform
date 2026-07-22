import sys
import re

file_path = r'c:\Users\stone\WoC\src\app\people\[id]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

colors_map = {
    r'\bbg-surface-container-lowest\b': 'bg-white',
    r'\bbg-surface-container-low\b': 'bg-[#f8f9fa]',
    r'\bbg-surface-container-highest\b': 'bg-[#f2f4f4]',
    r'\bbg-surface-container\b': 'bg-[#f2f4f4]',
    r'\bbg-surface\b(?!-)': 'bg-white',
    r'\btext-on-surface-variant\b': 'text-[#596061]',
    r'\btext-on-surface\b(?!-)': 'text-[#2d3435]',
    r'\bborder-outline-variant\b': 'border-[#e0e4e5]',
    r'\bborder-outline\b(?!-)': 'border-[#e0e4e5]',
    r'\bbg-primary-container\b': 'bg-primary/10',
    r'\btext-outline\b(?!-)': 'text-[#acb3b4]',
}

for k, v in colors_map.items():
    content = re.sub(k, v, content)

content = content.replace('bg-white/10 backdrop-blur-md text-white', 'bg-black/20 backdrop-blur-sm text-white')
content = content.replace("scrolled ? 'text-[#2d3435] hover:bg-slate-100'", "scrolled ? 'bg-slate-100 text-[#2d3435]'")
content = content.replace("'bg-white shadow-md pb-2'", "'bg-white/95 backdrop-blur-md shadow-sm pb-2'")

old_menu_class1 = 'absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-[#e0e4e5]/10 overflow-hidden min-w-[160px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200'
old_menu_class2 = 'absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-outline/10 overflow-hidden min-w-[160px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200'
new_menu_class = 'absolute right-0 mt-2 z-[120] bg-white border border-slate-100 shadow-xl rounded-2xl py-1 w-28 overflow-hidden'

content = content.replace(old_menu_class1, new_menu_class)
content = content.replace(old_menu_class2, new_menu_class)

content = re.sub(r'w-full flex items-center gap-3 px-4 py-3 text-sm text-\[#2d3435\] hover:bg-\[#f2f4f4\] transition-colors( border-t border-\[#e0e4e5\]/5)?', 'w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2', content)

content = re.sub(r'w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors( border-t border-\[#e0e4e5\]/5)?', 'w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2', content)

content = content.replace('bg-[#f8f9fa] p-6 rounded-2xl border border-[#e0e4e5]/10', 'bg-[#f8f9fa] p-6 rounded-2xl border border-[#e0e4e5]')

content = content.replace('text-[10px] font-bold uppercase tracking-widest', 'text-[10px] font-black text-[#acb3b4] uppercase tracking-widest')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
