import React from 'react';


export default function SubFooter() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-8 px-6 rounded-t-2xl">
      <div className="max-w-4xl mx-auto">

        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-8 border-t border-outline-variant/20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface">WORLD OF COMMUNITY_</p>
            <p className="text-[9px] font-medium tracking-widest uppercase text-on-surface-variant/60">Digital Editorial Archive © 2024</p>
          </div>
          <div className="flex gap-6 uppercase text-[9px] font-bold tracking-[0.15em] text-on-surface-variant">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Archive</a>
            <a href="#" className="hover:text-primary">Editorial</a>
            <a href="#" className="hover:text-primary">Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
