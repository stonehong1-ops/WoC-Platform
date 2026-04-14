import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-surface-container flex items-center justify-between px-6 z-50">
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-headline font-black text-primary tracking-tighter uppercase">SALON</span>
        <span className="text-xs font-headline font-bold text-on-surface-variant/70 tracking-tight">Tango</span>
      </div>
      
      <div className="flex items-center gap-5 text-on-surface-variant">
        <button className="material-symbols-outlined text-[22px] hover:text-primary transition-colors">search</button>
        <button className="material-symbols-outlined text-[22px] hover:text-primary transition-colors">notifications</button>
        <button className="material-symbols-outlined text-[22px] hover:text-primary transition-colors">chat</button>
        <button className="material-symbols-outlined text-[24px] text-surface-tint hover:opacity-80 transition-opacity">account_circle</button>
      </div>
    </header>
  );
}
