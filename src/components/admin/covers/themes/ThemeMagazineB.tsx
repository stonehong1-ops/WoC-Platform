import React from 'react';
import { CoverEvent } from '../CoverEditor';
import { useBase64Image } from '../useBase64Image';

interface ThemeProps {
  date: Date;
  milonga: CoverEvent | null;
  milonga2?: CoverEvent | null;
  milonga3?: CoverEvent | null;
  milonga4?: CoverEvent | null;
  milonga5?: CoverEvent | null;
  tangoClass: CoverEvent | null;
  practica: CoverEvent | null;
  allMilongas: CoverEvent[];
  allClasses: CoverEvent[];
  allPracticas: CoverEvent[];
  region: { ko: string, en: string };
  banner?: any;
}

export default function ThemeMagazineB({
  date, milonga, milonga2, milonga3, milonga4, milonga5, tangoClass, practica, allMilongas, allClasses, allPracticas, region, banner
}: ThemeProps) {
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNameKo = date.toLocaleDateString('ko-KR', { weekday: 'short' });

  const defaultMilongaImg = "https://images.unsplash.com/photo-1544208453-625d7efd6f3c?auto=format&fit=crop&q=80&w=1080";
  const defaultClassImg = "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=600";
  const defaultPracticaImg = "https://images.unsplash.com/photo-1544208453-625d7efd6f3c?auto=format&fit=crop&q=80&w=1080";

  const milongaImgUrl = useBase64Image(milonga?.imageUrl || defaultMilongaImg);
  const classImgUrl = useBase64Image(tangoClass?.imageUrl || defaultClassImg);
  const practicaImgUrl = useBase64Image(practica?.imageUrl || defaultPracticaImg);

  const fallbackBannerImgUrl = useBase64Image("https://images.unsplash.com/photo-1544208453-625d7efd6f3c?auto=format&fit=crop&q=80&w=1080");
  const bannerImgUrl = useBase64Image(banner?.imageUrl || banner?.posterUrl || '');

  // Get regional highlights (sort by time)
  const selectedIds = [milonga?.id, milonga2?.id, milonga3?.id, milonga4?.id, milonga5?.id].filter(Boolean);
  const regionalMilongas = allMilongas
    .filter(s => !selectedIds.includes(s.id))
    .filter(s => {
      const sCity = (s.city || '').toLowerCase();
      const sLoc = (s.location || '').toLowerCase();
      const rEn = region.en.toLowerCase();
      const rKo = region.ko.toLowerCase();
      
      // Match against city or location strings
      const matchesCity = sCity.includes(rEn) || sCity.includes(rKo) || (rEn === 'seoul' && sCity.includes('soul'));
      const matchesLoc = sLoc.includes(rEn) || sLoc.includes(rKo) || (rEn === 'seoul' && (sLoc.includes('soul') || sLoc.includes('강남') || sLoc.includes('홍대') || sLoc.includes('마포')));
      return matchesCity || matchesLoc;
    })
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const highlights = regionalMilongas.slice(0, 3);

  const getRegionChip = (city?: string, location?: string) => {
    const str = ((city || '') + ' ' + (location || '')).toLowerCase();
    if (str.includes('강남')) return '강남';
    if (str.includes('홍대')) return '홍대';
    if (str.includes('마포')) return '마포';
    return '';
  };

  return (
    <div className="w-[1080px] h-[1920px] bg-white relative overflow-hidden font-['Inter',_sans-serif]">
       {/* Inject Google Fonts & Custom Styles */}
       <style dangerouslySetInnerHTML={{ __html: `
         @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@1,400&family=Noto+Sans+KR:wght@300;400;700&display=swap');
         .text-title-xl { font-family: 'Bebas Neue', cursive; line-height: 0.85; font-size: 3.2rem; }
         .text-script { font-family: 'Playfair Display', serif; font-style: italic; }
         .font-bebas { font-family: 'Bebas Neue', cursive; }
         .font-noto { font-family: 'Noto Sans KR', sans-serif; }
         .font-inter { font-family: 'Inter', sans-serif; }
       `}} />

      {/* SCALE WRAPPER: Original design is for ~360px mobile width. 360 * 3 = 1080 */}
      <div className="w-[360px] h-[640px] absolute top-0 left-0 origin-top-left scale-[3] flex flex-col text-gray-900 bg-white">
        
        {/* BEGIN: MainContainer */}
        <main className="w-full bg-[#f9f9f9] h-full relative overflow-hidden flex flex-col p-1.5 gap-1">
          
          {/* BEGIN: Split Top Header & Hero Section */}
          <section className="flex w-full" data-purpose="top-header-split">
            <div className="w-1/3 px-4 flex flex-col py-2 relative">
              <div className="mt-2 flex flex-col">
                <h1 className="text-title-xl text-black uppercase leading-[0.82] tracking-tight">TANGO</h1>
                <h2 className="text-2xl text-gray-400 uppercase leading-[0.9] font-inter mt-1.5 mb-1 tracking-wide font-light">IN</h2>
                <h1 className="text-title-xl text-black uppercase leading-[0.82] tracking-tight">{region.en}</h1>
              </div>
              
              <div className="mt-4 flex flex-col gap-1.5">
                <p className="text-[9px] font-noto font-bold text-gray-800 tracking-tight">
                  오늘, {region.ko}의 탱고씬 <span className="text-[#FF5E3A]">{month}/{day} {dayNameKo}</span>
                </p>
              </div>

              <div className="mt-auto mb-1">
                <div className="inline-block px-2 py-0.5 text-[9px] font-bold text-black border border-black rounded-full">woc.today</div>
              </div>
            </div>
            <div className="w-2/3 aspect-square relative overflow-hidden" data-purpose="hero-image-container">
              {milongaImgUrl && (
                <img 
                  src={milongaImgUrl} 
                  alt="Milonga" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
              {getRegionChip(milonga?.city, milonga?.location) && (
                <div className="absolute top-4 left-4 bg-red-500 text-white rounded-full px-2 py-0.5 text-[8px] font-bold z-10">
                  {getRegionChip(milonga?.city, milonga?.location)}
                </div>
              )}
              <div className="absolute top-4 right-4">
                <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="#FF5E3A"></path>
                </svg>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-[8px] font-bold tracking-widest uppercase mb-1 opacity-80">Today's Milonga</p>
                <div className="flex items-end justify-between">
                  <div className="flex-1 overflow-hidden pr-2">
                    <p className="font-noto text-lg font-bold leading-tight truncate">{milonga?.titleNative || milonga?.title || 'No Milonga'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[8px] opacity-90 truncate">
                      {milonga?.organizer && <span>org. {milonga.organizer}</span>}
                      {milonga?.dj && <span>dj. {milonga.dj}</span>}
                    </div>
                    <p className="text-3xl font-bebas tracking-wide leading-none mt-1">{milonga?.startTime || '00:00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BEGIN: Extra Socials Grid (Social 2, 3, 4, 5) */}
          <section className="grid grid-cols-4 w-full border border-gray-100 bg-white" data-purpose="extra-socials-grid">
            {[milonga2, milonga3, milonga4, milonga5].map((m, idx) => (
              <div key={idx} className="relative aspect-[3/4] overflow-hidden border-r border-gray-100 last:border-r-0">
                {m ? (
                  <>
                    <img 
                      src={m.imageUrl || defaultMilongaImg} 
                      alt="Milonga" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>
                    {getRegionChip(m.city, m.location) && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[7px] font-bold z-10">
                        {getRegionChip(m.city, m.location)}
                      </div>
                    )}
                    <div className="absolute inset-0 p-3 flex flex-col text-white">
                      <p className="text-[8px] font-bold tracking-widest uppercase text-[#FF5E3A] text-right">Milonga</p>
                      <h3 className="font-noto font-bold text-xs mt-1 leading-tight text-white">{m.titleNative || m.title}</h3>
                      <div className="mt-auto space-y-1">
                        <p className="text-[8px] flex items-center gap-1 font-bold text-white">
                          <span className="w-1 h-1 bg-[#FF5E3A] rounded-full"></span> {m.startTime || '00:00'}
                        </p>
                        <div className="flex flex-col text-[7px] opacity-90 line-clamp-2 leading-tight text-white">
                          {m.organizer && <span>org. {m.organizer}</span>}
                          {m.dj && <span>dj. {m.dj}</span>}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 flex flex-col h-full bg-gray-50 items-center justify-center text-gray-300">
                    <span className="text-[10px] font-bold">WOC</span>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* BEGIN: 3-Column Grid */}
          <section className="grid grid-cols-3 w-full border border-gray-100 bg-white" data-purpose="activity-grid">
            {/* Today's Class */}
            <div className="relative aspect-[3/4] overflow-hidden border-r border-gray-100" data-purpose="class-card">
              {classImgUrl && (
                <img 
                  src={classImgUrl} 
                  alt="Class" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="absolute inset-0 p-3 flex flex-col text-white">
                <p className="text-[8px] font-bold tracking-widest uppercase text-blue-300">Class</p>
                <h3 className="font-noto font-bold text-xs mt-1 leading-tight">{tangoClass?.titleNative || tangoClass?.title || 'No Class'}</h3>
                <div className="mt-auto space-y-1">
                  <p className="text-[8px] flex items-center gap-1 font-bold">
                    <span className="w-1 h-1 bg-blue-300 rounded-full"></span> {tangoClass?.startTime || '00:00'}
                  </p>
                  <div className="flex flex-col text-[7px] opacity-90 line-clamp-2 leading-tight">
                    {tangoClass?.groupName && <span className="font-bold text-blue-200">{tangoClass.groupName}</span>}
                    <span>{tangoClass?.instructor || ''}</span>
                  </div>
                  <div className="mt-1 bg-blue-600/80 rounded-sm px-1 py-0.5 flex items-center justify-between text-[7px] font-bold uppercase">
                    <span>+ {Math.max(0, allClasses.length - 1)} more</span>
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Practica */}
            <div className="relative aspect-[3/4] bg-[#F3F4F6] overflow-hidden border-r border-gray-100" data-purpose="practica-card">
              <div className="p-3 flex flex-col h-full">
                <p className="text-[8px] font-bold tracking-widest uppercase text-emerald-700">Practica</p>
                <h3 className="font-noto font-bold text-xs mt-1 leading-tight text-[#0E1428]">{practica?.titleNative || practica?.title || 'No Practica'}</h3>
                <div className="mt-auto space-y-1 text-gray-600">
                  <p className="text-[8px] flex items-center gap-1 font-bold text-[#0E1428]">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> {practica?.startTime || '00:00'} {practica?.endTime ? `- ${practica.endTime}` : ''}
                  </p>
                  <p className="text-[8px] font-noto truncate">{practica?.location || 'TBA'}</p>
                  <div className="mt-1 bg-emerald-700 rounded-sm px-1 py-0.5 flex items-center justify-between text-[7px] font-bold uppercase text-white">
                    <span>+ {Math.max(0, allPracticas.length - 1)} more</span>
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tonight Highlights */}
            <div className="relative aspect-[3/4] bg-indigo-950 overflow-hidden" data-purpose="highlights-card">
              <div className="p-3 flex flex-col h-full text-white">
                <p className="text-[8px] font-bold tracking-widest uppercase text-indigo-300">Highlights</p>
                <div className="mt-2 space-y-2 overflow-hidden flex-1">
                  {highlights.length > 0 ? highlights.map((h, i) => (
                    <div key={i} className="border-l border-indigo-400 pl-1.5">
                      <p className="text-[8px] font-noto leading-tight truncate">{h.titleNative || h.title}</p>
                      <p className="text-[6px] opacity-60">{h.startTime || '00:00'}</p>
                    </div>
                  )) : (
                    <div className="border-l border-indigo-400 pl-1.5 opacity-50">
                      <p className="text-[8px] font-noto leading-tight truncate">예정된 밀롱가가 없습니다</p>
                      <p className="text-[6px] opacity-60">-</p>
                    </div>
                  )}
                </div>
                <div className="mt-auto pt-1 flex items-center justify-between border-t border-white/10 text-[7px] font-bold uppercase">
                  <span>+ {Math.max(0, regionalMilongas.length - 3)} more</span>
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
              </div>
            </div>
          </section>

          {/* Event Banner */}
          {banner && bannerImgUrl ? (
            <section className="w-full mt-auto" data-purpose="banner-section">
              <div className="relative overflow-hidden flex items-center justify-between min-h-[70px] bg-black">
                <img 
                  alt="Event Banner" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  src={bannerImgUrl}
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 p-3 w-full flex justify-between items-center text-white">
                  <div className="flex-1 overflow-hidden pr-2">
                    <p className="text-[8px] font-bold tracking-widest text-[#FF5E3A] uppercase mb-0.5">Special Event</p>
                    <h3 className="font-noto font-bold text-xs truncate leading-tight">{banner.titleNative || banner.title}</h3>
                    {banner.startDate && (
                      <p className="text-[8px] opacity-90 mt-0.5 truncate">
                        {new Date(banner.startDate.seconds * 1000).toLocaleDateString('ko-KR')}
                        {banner.endDate && ` - ${new Date(banner.endDate.seconds * 1000).toLocaleDateString('ko-KR')}`}
                      </p>
                    )}
                  </div>
                  <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="w-full mt-auto" data-purpose="banner-section">
              <div className="bg-[#111] p-2 relative overflow-hidden flex items-center justify-between text-white min-h-[70px]">
                <img 
                  alt="Tango Shoes" 
                  className="absolute left-0 top-0 h-full w-1/2 object-cover opacity-30 grayscale" 
                  src={fallbackBannerImgUrl || ''}
                />
                <div className="relative z-10 w-full flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-script text-[#FF5E3A] text-xl">Explore More</span>
                      <svg className="w-4 h-4 text-[#FF5E3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                      </svg>
                    </div>
                    <p className="font-noto text-[9px] opacity-70">더 많은 일정은 WoC에서</p>
                  </div>
                  <div className="text-right pr-2">
                    <h2 className="text-2xl font-bebas tracking-tight italic">WOC</h2>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* BEGIN: Footer */}
          <footer className="mt-auto border-t border-gray-100 text-center py-2" data-purpose="main-footer">
            <p className="font-noto text-[10px] text-gray-400 font-bold">상세 내용은 <span className="text-[#0E1428]">www.WOC.today</span>에서 제공됨</p>
          </footer>
          
        </main>
      </div>
    </div>
  );
}
