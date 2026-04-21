import React from 'react';
import GroupFooter from './GroupFooter';


const GroupBoard = ({ group }: any) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12 group-y-12">
        {/* Board Header & Categories */}
        <section className="group-y-6 text-left">
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight text-left">Group Board</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1 text-left">Connect, share, and learn with fellow dancers.</p>
          </div>

          {/* Horizontal Scrollable Categories */}
          <div className="flex overflow-x-auto pb-4 -mx-6 px-6 group-x-3 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button className="snap-start flex-shrink-0 bg-primary text-on-primary font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 active:translate-y-0">
              Notice
            </button>
            <button className="snap-start flex-shrink-0 bg-white text-on-surface font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm outline outline-1 outline-outline-variant/10 hover:bg-slate-50 transition-colors">
              Information
            </button>
            <button className="snap-start flex-shrink-0 bg-white text-on-surface font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm outline outline-1 outline-outline-variant/10 hover:bg-slate-50 transition-colors">
              Q&amp;A
            </button>
            <button className="snap-start flex-shrink-0 bg-white text-on-surface font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm outline outline-1 outline-outline-variant/10 hover:bg-slate-50 transition-colors">
              Free Talk
            </button>
            <button className="snap-start flex-shrink-0 bg-white text-on-surface font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm outline outline-1 outline-outline-variant/10 hover:bg-slate-50 transition-colors">
              Events
            </button>
          </div>
        </section>

        {/* Post List (Bento Grid Style) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {/* Featured Post (Spans 2 columns on large screens) */}
          <article className="bg-white rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 overflow-hidden lg:col-span-2 group hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row">
            <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden bg-slate-100">
              <img
                alt="Tango Workshop"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://images.unsplash.com/photo-1545638195-463f69512658?auto=format&fit=crop&q=80&w=1200"
              />
              <div className="absolute top-3 left-3 bg-purple-100 text-purple-700 font-label font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">Featured</div>
            </div>
            <div className="p-6 flex flex-col justify-between w-full sm:w-3/5 text-left">
              <div>
                <div className="flex items-center group-x-2 mb-3 text-left">
                  <span className="text-xs font-medium text-primary tracking-wide">NOTICE</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-xs font-medium text-slate-500">Oct 24, 2023</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors text-left">Winter Workshop Series: Mastering the Ocho</h3>
                <p className="font-body text-sm text-slate-500 line-clamp-3 mb-4 text-left">Join our intensive 4-week workshop focusing entirely on the precision and fluidity of the Ocho. Limited spots available for intermediate dancers.</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center group-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">MA</div>
                  <span className="font-body text-xs font-medium text-on-surface">Maria Alvarez</span>
                </div>
                <div className="flex items-center group-x-3 text-slate-400">
                  <div className="flex items-center group-x-1">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span className="text-xs">1.2k</span>
                  </div>
                  <div className="flex items-center group-x-1">
                    <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                    <span className="text-xs">34</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Standard Post Card */}
          <article className="bg-white rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 p-6 flex flex-col justify-between group hover:shadow-md transition-all duration-300 text-left">
            <div>
              <div className="flex items-center group-x-2 mb-3 text-left">
                <span className="text-xs font-medium text-primary tracking-wide">Q&amp;A</span>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span className="text-xs font-medium text-slate-500">2 hours ago</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors text-left">Choosing the Right Shoes for Milongas</h3>
              <p className="font-body text-sm text-slate-500 line-clamp-3 mb-4 text-left">I&apos;m attending my first major milonga next month. What are the pros and cons of suede vs. leather soles for crowded floors?</p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center group-x-2">
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-[10px]">JD</div>
                <span className="font-body text-xs font-medium text-on-surface">John D.</span>
              </div>
              <div className="flex items-center group-x-3 text-slate-400">
                <div className="flex items-center group-x-1">
                  <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                  <span className="text-xs">12</span>
                </div>
              </div>
            </div>
          </article>

          {/* Standard Post Card with Image */}
          <article className="bg-white rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="w-full h-40 relative overflow-hidden bg-slate-50">
              <img
                alt="Tango Shoes"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://images.unsplash.com/photo-1542152342-6e792e92c286?auto=format&fit=crop&q=80&w=600"
              />
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow text-left">
              <div>
                <div className="flex items-center group-x-2 mb-3 text-left">
                  <span className="text-xs font-medium text-primary tracking-wide">INFO</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-xs font-medium text-slate-500">Yesterday</span>
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors text-left">The Etiquette of the Cabeceo</h3>
                <p className="font-body text-sm text-slate-500 line-clamp-2 mb-4 text-left">A breakdown of the subtle art of eye contact and invitation in traditional milongas.</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center group-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">EL</div>
                  <span className="font-body text-xs font-medium text-on-surface">Elena L.</span>
                </div>
                <div className="flex items-center group-x-3 text-slate-400">
                  <div className="flex items-center group-x-1 text-blue-600">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span className="text-xs font-medium">89</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Standard Post Card */}
          <article className="bg-white rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 p-6 flex flex-col justify-between group hover:shadow-md transition-all duration-300 text-left">
            <div>
              <div className="flex items-center group-x-2 mb-3 text-left">
                <span className="text-xs font-medium text-primary tracking-wide">FREE TALK</span>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span className="text-xs font-medium text-slate-500">Oct 20, 2023</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors text-left">Favorite Piazzolla Tracks?</h3>
              <p className="font-body text-sm text-slate-500 line-clamp-3 mb-4 text-left">Building a new playlist for my practice sessions. What are your absolute must-have Astor Piazzolla compositions?</p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center group-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">TR</div>
                <span className="font-body text-xs font-medium text-on-surface">TangoRider</span>
              </div>
              <div className="flex items-center group-x-3 text-slate-400">
                <div className="flex items-center group-x-1">
                  <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                  <span className="text-xs">45</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* Floating Action Button for New Post */}
        <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
        </button>
      </main>
      <GroupFooter communityName={group.name} />
    </div>
  );
};

export default GroupBoard;
