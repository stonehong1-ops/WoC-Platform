import Link from "next/link";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-t border-surface-container flex items-center px-4 z-50 overflow-hidden">
      <div className="flex items-center w-full max-w-2xl mx-auto">
        {/* Leftmost HUB Icon */}
        <Link href="/" className="flex-none p-2 mr-4 text-primary hover:bg-primary/5 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[24px]">hub</span>
        </Link>

        {/* Partitioned Scrollable Area */}
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-8 items-center h-full whitespace-nowrap px-2">
            
            {/* Partition: WORLD */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest">WORLD</span>
              <div className="flex gap-4 items-center">
                <Link href="/home" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">HOME</Link>
                <Link href="/social" className="text-sm font-headline font-bold text-primary">SOCIAL</Link>
                <Link href="/events" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">EVENTS</Link>
                <Link href="/plaza" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">PLAZA</Link>
                <Link href="/shop" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">SHOP</Link>
                <Link href="/map" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">MAP</Link>
              </div>
            </div>

            {/* Partition: NATION */}
            <div className="flex flex-col gap-0.5 border-l border-surface-container pl-6">
              <span className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest">NATION</span>
              <div className="flex gap-4 items-center">
                <Link href="/community" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">COMMUNITY</Link>
                <Link href="/stay" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">STAY</Link>
              </div>
            </div>

            {/* Partition: TOWN */}
            <div className="flex flex-col gap-0.5 border-l border-surface-container pl-6">
              <span className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest">TOWN</span>
              <div className="flex gap-4 items-center">
                <Link href="/lost" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">LOST</Link>
                <Link href="/resale" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">RESALE</Link>
                <Link href="/arcade" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">ARCADE</Link>
              </div>
            </div>

            {/* Partition: MY */}
            <div className="flex flex-col gap-0.5 border-l border-surface-container pl-6">
              <span className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest">MY</span>
              <div className="flex gap-4 items-center">
                <Link href="/wallet" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">WALLET</Link>
                <Link href="/history" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">HISTORY</Link>
                <Link href="/my-info" className="text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">INFO</Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
