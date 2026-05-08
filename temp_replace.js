const fs = require('fs');
let c = fs.readFileSync('src/app/home/page.tsx', 'utf8');

c = c.replace(/import EventDetail from '@\/components\/events\/EventDetail';\r?\n/, '');
c = c.replace(/const \[isEventDetailOpen, setIsEventDetailOpen\] = useState\(false\);\r?\n/, '');
c = c.replace(/[ \t]*\{\/\* Event Detail Full-Screen Popup \*\/\}\r?\n[ \t]*\{isEventDetailOpen && heroEvent && \(\r?\n[ \t]*<EventDetail event=\{heroEvent\} onClose=\{.*?\} \/>\r?\n[ \t]*\)\}\r?\n/, '');

c = c.replace('className="relative w-full h-[400px] md:h-[707px] flex items-end"', 'className="relative w-full aspect-[3/4] md:h-[707px] flex items-end"');

c = c.replace(/<h2 className="font-headline-lg text-headline-lg(.*?)">/g, '<h2 className="font-title-lg text-title-lg$1">');

c = c.replace('className="font-title-lg text-title-lg md:font-display-lg md:text-display-lg text-white mb-4"', 'className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-white mb-2"');
c = c.replace('className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-white mb-4"', 'className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-white mb-2"');

c = c.replace('className="font-body-lg text-body-lg text-white/90 max-w-2xl mb-8 line-clamp-3"', 'className="font-body-md text-body-md text-white/90 max-w-2xl mb-6 line-clamp-3"');

c = c.replace('className="bg-primary text-white px-3 py-1 rounded-lg font-label-md text-label-md mb-element_gap inline-block"', 'className="bg-primary text-white px-2 py-0.5 rounded font-label-sm text-label-sm mb-3 inline-block"');

c = c.replace("onClick={() => setIsEventDetailOpen(true)}", "onClick={() => window.location.href = '/events'}");

c = c.replace('className="bg-primary text-white font-label-md text-label-md py-4 px-10 rounded shadow-lg hover:opacity-90 transition-opacity"', 'className="bg-primary text-white font-label-sm text-label-sm py-3 px-8 rounded shadow-lg hover:opacity-90 transition-opacity"');

fs.writeFileSync('src/app/home/page.tsx', c);
