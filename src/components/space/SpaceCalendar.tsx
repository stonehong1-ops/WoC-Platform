import React from 'react';
import CommunityFooter from './CommunityFooter';


const SpaceCalendar = ({ community }: any) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
      {/* Main Content Canvas - Clearing Header */}
      <main className="pt-16 md:pt-20 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Calendar Section */}
          <section className="flex-1 w-full bg-white rounded-xl shadow-sm p-6 relative z-10 border border-slate-200/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline font-extrabold text-2xl tracking-tight text-slate-900">October 2023</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <span key={day} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-label">{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Previous Month Days */}
              {[24, 25, 26, 27, 28, 29, 30].map(day => (
                <div key={`prev-${day}`} className="aspect-square flex items-center justify-center text-slate-300 text-sm font-medium">{day}</div>
              ))}

              {/* Current Month Days - Dummy Logic matching HTML exactly */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const isSelected = day === 14;
                const hasPrimaryDot = [3, 5, 9, 16, 21].includes(day);
                const hasTertiaryDot = [1, 5, 13, 21].includes(day);

                return (
                  <div
                    key={day}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer text-sm font-medium relative ${isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-[0.99] font-bold'
                        : 'text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    {day}
                    {isSelected ? (
                      <div className="w-1.5 h-1.5 bg-white rounded-full absolute bottom-2"></div>
                    ) : (
                      <div className="flex gap-0.5 absolute bottom-2">
                        {hasPrimaryDot && <div className="w-1 h-1 bg-blue-600 rounded-full"></div>}
                        {hasTertiaryDot && <div className="w-1 h-1 bg-purple-600 rounded-full"></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Selected Date Events */}
          <section className="w-full md:w-[400px] flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/50">
              <h3 className="font-headline font-bold text-xl text-slate-900 mb-2">Saturday, Oct 14</h3>
              <p className="text-[13px] font-medium text-slate-500 mb-6">2 events scheduled</p>

              <div className="space-y-4">
                {/* Event Item 1 */}
                <div className="group relative bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/20">
                  <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-label">
                    Class
                  </div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">18:00 - 19:30</p>
                  <h4 className="font-headline font-bold text-lg text-slate-900 mb-1">Foundations of Connection</h4>
                  <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    Lucia & Marcos
                  </p>
                </div>

                {/* Event Item 2 */}
                <div className="group relative bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/20">
                  <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-label">
                    Milonga
                  </div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">21:00 - 02:00</p>
                  <h4 className="font-headline font-bold text-lg text-slate-900 mb-1">Milonga del Corazón</h4>
                  <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    Main Hall, Studio A
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Event Detail Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200/50 mt-auto">
              <div className="h-32 w-full bg-slate-100 relative">
                <img
                  alt="Tango event"
                  className="w-full h-full object-cover opacity-80 mix-blend-multiply"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSE5jK4FAQkuTFvQ6Q-7yYSYQf-_tWRe6YfOBtpTsWHaLLX9Oe10aKvd3zsNgdGsl6A0nJSy4xF8jw7RR0ajpsCWCEwGgGkfCMjavggEiD2KddQTcQcCjiSf5Ba3xl2tZZUIJfD2KcNj_6d_K0H1cxC-AEddEJu00xBpb9ZIQWOgJiNN-Rg0qL0MLAqEe4OLaM0vJT8qTg65FaWVjtFMnigGhhIwtMUCohme_3NJKTuC_vvd5Z8j2vse5KtjPC7rL1JGA4gf3FeXg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
              </div>
              <div className="p-6 pt-2 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-headline font-bold text-xl text-slate-900">Milonga del Corazón</h4>
                    <p className="text-sm font-medium text-blue-600">Today, 21:00 - 02:00</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-slate-400">location_on</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Main Hall, Studio A</p>
                      <p className="text-[13px] text-slate-500">123 Rhythm Street, Dance District</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-slate-400">music_note</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">DJ Carlos</p>
                      <p className="text-[13px] text-slate-500">Traditional Golden Age</p>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white font-bold text-sm uppercase tracking-wider py-3 rounded-lg shadow-md shadow-blue-200 scale-100 active:scale-[0.98] transition-transform font-label">
                  Reserve Ticket ($15)
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <button className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center hover:bg-blue-700 transition-colors scale-100 active:scale-95 z-40">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
      <CommunityFooter communityName={community.name} />
    </div>
  );
};

export default SpaceCalendar;

