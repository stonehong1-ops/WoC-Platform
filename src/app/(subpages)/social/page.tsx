import React from 'react';

export default function SocialPage() {
  const regions = ['Seoul', 'Tokyo', 'Buenos Aires', 'Paris', 'Berlin', 'New York'];
  
  const events = [
    { id: 1, name: 'Milonga de Mis Amores', djs: 'DJ El Gato', time: '20:00 - 01:00', location: 'Gangnam, Seoul', fee: '15,000 KRW', tags: ['Traditional', 'Popular'] },
    { id: 2, name: 'Tango Passion', djs: 'DJ Maria', time: '19:30 - 23:30', location: 'Hongdae, Seoul', fee: '12,000 KRW', tags: ['Alternative', 'Friendly'] },
    { id: 3, name: 'Afternoon Milonga', djs: 'DJ Carlos', time: '14:00 - 18:00', location: 'Itaewon, Seoul', fee: '10,000 KRW', tags: ['Traditional', 'Relaxed'] },
    { id: 4, name: 'Urban Tango Night', djs: 'DJ Jin', time: '21:00 - 02:00', location: 'Apgujeong, Seoul', fee: '20,000 KRW', tags: ['Modern', 'High-density'] },
    { id: 5, name: 'Classic Milonga', djs: 'DJ Park', time: '20:00 - 00:00', location: 'Jongno, Seoul', fee: '13,000 KRW', tags: ['Traditional', 'Elegant'] },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Editorial Header */}
      <header className="mb-12 border-b-4 border-primary pb-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-2 block">The Kinetic Gallery_</span>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none font-headline">Social Hub</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest uppercase text-tertiary">Tuesday</p>
            <p className="text-[14px] font-black tracking-tighter uppercase font-headline">April 14, 2026</p>
          </div>
        </div>
      </header>

      {/* Regional Filters */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar mb-10 pb-2 border-b border-outline-variant/20">
        {regions.map((region) => (
          <button
            key={region}
            className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 whitespace-nowrap transition-all border ${
              region === 'Seoul' 
                ? 'bg-primary text-on-primary border-primary' 
                : 'bg-surface-container-low text-on-surface-variant border-transparent hover:border-outline-variant'
            } rounded-full`}
          >
            {region}
          </button>
        ))}
      </div>

      {/* Event Listing */}
      <section className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold tracking-widest uppercase text-tertiary">Current Milongas in Seoul</h3>
          <span className="text-[10px] font-medium text-on-surface-variant/60">{events.length} Events found</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="group bg-surface-container-lowest border border-outline-variant/30 px-6 py-5 rounded-sm hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold tracking-tight text-on-surface font-headline">{event.name}</h4>
                    <span className="text-[10px] font-bold bg-secondary-fixed text-on-secondary px-2 py-0.5 rounded-sm uppercase tracking-tighter">{event.tags[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{event.time}</span>
                    <span className="mx-1">•</span>
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>{event.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Entrance</p>
                    <p className="text-sm font-bold text-on-surface tracking-tighter">{event.fee}</p>
                  </div>
                  <div className="text-right border-l border-outline-variant/30 pl-6 hidden md:block">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">DJ</p>
                    <p className="text-sm font-bold text-primary tracking-tighter">{event.djs}</p>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-outline-variant group-hover:text-primary transition-colors ml-2">chevron_right</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-16 bg-surface-container-high p-8 text-center rounded-sm border border-outline-variant/30">
        <h4 className="text-lg font-bold mb-2 font-headline uppercase tracking-tight">Host your own event?</h4>
        <p className="text-sm text-on-surface-variant mb-6">Connect with the community and share your passion on the WoC platform.</p>
        <button className="bg-on-surface text-surface-container-lowest text-[11px] font-black tracking-widest uppercase px-8 py-3 rounded-full hover:bg-primary hover:text-on-primary transition-all">Register Event</button>
      </div>
    </div>
  );
}
