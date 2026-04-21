import React from 'react';

const CommunityFooter = ({ communityName }: { communityName: string }) => (
  <footer className="w-full bg-white border-t border-outline-variant/10 py-24 px-8 md:px-16 mt-20 rounded-t-[48px]">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:gap-24">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[20px] bg-on-surface text-white flex items-center justify-center shadow-2xl">
            <span className="material-symbols-outlined text-2xl fill-1">hub</span>
          </div>
          <div>
            <span className="font-headline font-black text-2xl italic tracking-tighter text-on-surface block leading-none">{communityName}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary mt-2 block">Premium Space</span>
          </div>
        </div>
        <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.2em] leading-loose max-w-[300px]">
          A high-performance digital ecosystem designed for the next generation of social movement and elite connection.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-16 md:gap-32">
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Connectivity</h4>
          <ul className="space-y-5 text-[11px] font-black text-on-surface-variant/70 uppercase tracking-[0.15em]">
            <li className="hover:text-primary cursor-pointer transition-all hover:translate-x-1">Member Network</li>
            <li className="hover:text-primary cursor-pointer transition-all hover:translate-x-1">Live Events</li>
            <li className="hover:text-primary cursor-pointer transition-all hover:translate-x-1">Protocol News</li>
          </ul>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Governance</h4>
          <ul className="space-y-5 text-[11px] font-black text-on-surface-variant/70 uppercase tracking-[0.15em]">
            <li className="hover:text-primary cursor-pointer transition-all hover:translate-x-1">Guidelines</li>
            <li className="hover:text-primary cursor-pointer transition-all hover:translate-x-1">Security Core</li>
            <li className="hover:text-primary cursor-pointer transition-all hover:translate-x-1">Support Hub</li>
          </ul>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <p className="text-[9px] font-black text-on-surface-variant/30 uppercase tracking-[0.25em]">© 2026 WORLD OF CONNECTION. VERIFIED COMMUNITY SPACE.</p>
      </div>
      <div className="flex gap-10">
        <span className="material-symbols-outlined text-on-surface-variant/20 hover:text-primary cursor-pointer transition-all hover:scale-125">language</span>
        <span className="material-symbols-outlined text-on-surface-variant/20 hover:text-primary cursor-pointer transition-all hover:scale-125">verified_user</span>
        <span className="material-symbols-outlined text-on-surface-variant/20 hover:text-primary cursor-pointer transition-all hover:scale-125">monitoring</span>
      </div>
    </div>
  </footer>
);

export default CommunityFooter;
