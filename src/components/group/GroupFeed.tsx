import React from 'react';
import GroupFooter from './GroupFooter';


const GroupFeed = ({ group }: any) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Main Content Canvas - Clearing Header */}
      <main className="max-w-3xl mx-auto pt-16 md:pt-24 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 flex-1 w-full">

        {/* Feed Header/Composer (Bento Style) */}
        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex gap-4 items-start border border-slate-200/50 mt-4">
          <img
            alt="Current User"
            className="w-12 h-12 rounded-full object-cover shrink-0"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
          />
          <div className="flex-1 flex flex-col gap-3 text-left">
            <textarea
              className="w-full bg-slate-50 resize-none rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 border-none placeholder-slate-400"
              placeholder="Share your latest moves or thoughts..."
              rows={2}
            ></textarea>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 text-left">
                <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined">image</span>
                </button>
                <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined">location_on</span>
                </button>
              </div>
              <button className="bg-blue-600 text-white font-label text-[11px] font-bold uppercase tracking-widest px-6 py-2 rounded-full shadow-md shadow-blue-200 hover:scale-95 transition-transform">
                Post
              </button>
            </div>
          </div>
        </section>

        {/* Feed Posts List */}
        <div className="flex flex-col gap-6 mb-24">
          {/* Post 1 (Image Post) */}
          <article className="bg-white rounded-xl shadow-sm border border-slate-200/50 overflow-hidden transform transition-transform hover:scale-[0.995]">
            <div className="p-4 sm:p-6 pb-3 text-left">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <img
                    alt="Marco Rossi"
                    className="w-10 h-10 rounded-full object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
                  />
                  <div>
                    <h3 className="font-headline font-bold text-slate-900 text-sm leading-tight text-left">Marco Rossi</h3>
                    <p className="text-slate-500 text-xs font-medium text-left">2 hours ago</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:bg-slate-50 p-1 rounded-full transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
              <p className="text-slate-900 text-sm mb-4 leading-relaxed text-left">
                Incredible workshop this morning! The energy in the room was unmatched. Focused heavily on connection and subtle weight shifts. Can't wait for next week's session.
              </p>
            </div>
            {/* Image Post Image */}
            <div className="w-full aspect-video bg-slate-100 relative">
              <img
                alt="Tango Workshop"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1542152340-9b37c02c6328?auto=format&fit=crop&q=80&w=1200"
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-slate-200/20">
                <span className="material-symbols-outlined text-[14px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <span className="font-label text-[10px] font-bold text-blue-600 uppercase tracking-wider">Trending</span>
              </div>
            </div>
            <div className="p-4 sm:px-6 border-t border-slate-100 flex justify-between items-center text-slate-500">
              <div className="flex gap-6">
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">favorite</span>
                  <span className="text-xs font-medium">24</span>
                </button>
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
                  <span className="text-xs font-medium">5</span>
                </button>
              </div>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
              </button>
            </div>
          </article>

          {/* Post 2 (Text only with highlight) */}
          <article className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-4 sm:p-6 transform transition-transform hover:scale-[0.995]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3 items-center">
                <img
                  alt="Elena Rodriguez"
                  className="w-10 h-10 rounded-full object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                />
                <div>
                  <h3 className="font-headline font-bold text-slate-900 text-sm leading-tight text-left">Elena Rodriguez</h3>
                  <p className="text-slate-500 text-xs font-medium text-left">5 hours ago</p>
                </div>
              </div>
              <button className="text-slate-400 hover:bg-slate-50 p-1 rounded-full transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="bg-blue-50/30 rounded-lg p-6 mb-4 border border-blue-100/50">
              <p className="text-slate-900 text-lg font-headline font-semibold leading-tight text-center italic">
                &quot;The embrace is not just a posture; it&apos;s a conversation.&quot;
              </p>
            </div>
            <div className="flex justify-between items-center text-slate-500 pt-2">
              <div className="flex gap-6">
                <button className="flex items-center gap-2 text-blue-600 group">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  <span className="text-xs font-medium">89</span>
                </button>
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
                  <span className="text-xs font-medium">12</span>
                </button>
              </div>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
              </button>
            </div>
          </article>

          {/* Post 3 (Event/Announcement style) */}
          <article className="bg-white rounded-xl shadow-sm border border-slate-200/50 overflow-hidden transform transition-transform hover:scale-[0.995]">
            <div className="p-4 sm:p-6 pb-3 text-left">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-headline">
                    FT
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-slate-900 text-sm leading-tight text-left">Freestyle Tango Official</h3>
                    <p className="text-slate-500 text-xs font-medium text-left">Yesterday at 2:00 PM</p>
                  </div>
                </div>
                <span className="bg-purple-100 text-purple-700 font-label text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                  Announcement
                </span>
              </div>
              <h4 className="font-headline font-bold text-lg mb-2 text-blue-600 text-left">Milonga Under the Stars ✨</h4>
              <p className="text-slate-900 text-sm mb-4 leading-relaxed text-left">
                Join us this Saturday for our monthly open-air Milonga. Live music, great company, and the beautiful night sky. Open to all levels!
              </p>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-4 mb-4 border border-slate-200/50">
                <div className="bg-white w-12 h-12 rounded flex flex-col items-center justify-center border border-slate-200/20 shadow-sm">
                  <span className="text-[10px] font-bold text-red-600 uppercase">Oct</span>
                  <span className="text-lg font-headline font-extrabold leading-none text-slate-900">24</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-slate-900 text-left">Plaza Mayor</p>
                  <p className="text-xs text-slate-500 text-left">8:00 PM - 12:00 AM</p>
                </div>
                <div className="ml-auto">
                  <button className="bg-blue-50 text-blue-700 font-label text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full hover:bg-blue-100 transition-colors border border-blue-200/50">
                    RSVP
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 sm:px-6 border-t border-slate-100 flex justify-between items-center text-slate-500 bg-slate-50/50">
              <div className="flex gap-6">
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">favorite</span>
                  <span className="text-xs font-medium">156</span>
                </button>
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
                  <span className="text-xs font-medium">23</span>
                </button>
              </div>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
              </button>
            </div>
          </article>
        </div>
      </main>

      <button className="fixed bottom-24 right-4 md:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>
      <GroupFooter communityName={group.name} />
    </div>
  );
};

export default GroupFeed;

