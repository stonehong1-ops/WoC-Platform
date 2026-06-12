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

export default function ThemeMagazineA({ 
  date, 
  milonga, 
  milonga2,
  milonga3,
  milonga4,
  milonga5,
  tangoClass, 
  practica,
  allMilongas,
  allClasses,
  allPracticas,
  region,
  banner
}: ThemeProps) {
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthName = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const dayNum = date.getDate();
  const dateStrKorean = `${date.getMonth() + 1}월 ${dayNum}일`;

  const defaultMilongaImg = "https://images.unsplash.com/photo-1544208453-625d7efd6f3c?auto=format&fit=crop&q=80&w=1080";
  const defaultClassImg = "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=600";
  const defaultPracticaImg = "https://images.unsplash.com/photo-1544208453-625d7efd6f3c?auto=format&fit=crop&q=80&w=1080";

  const milongaImgUrl = useBase64Image(milonga?.imageUrl || defaultMilongaImg);
  const classImgUrl = useBase64Image(tangoClass?.imageUrl || defaultClassImg);
  const practicaImgUrl = useBase64Image(practica?.imageUrl || defaultPracticaImg);
  const fallbackBannerImgUrl = useBase64Image("https://images.unsplash.com/photo-1544208453-625d7efd6f3c?auto=format&fit=crop&q=80&w=1080");
  const bannerImgUrl = useBase64Image(banner?.imageUrl || banner?.posterUrl || '');

  return (
    <div 
      className="w-[1080px] h-[1920px] bg-[#fdfaf6] flex flex-col relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-50 rounded-full blur-[100px] -mr-[200px] -mt-[200px] opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-indigo-50 rounded-full blur-[120px] -ml-[300px] -mb-[300px] opacity-60"></div>

      <div className="flex-1 flex flex-col p-16 z-10">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex flex-col">
            <h1 className="text-[120px] font-black leading-[0.85] tracking-tighter text-[#111]">
              TODAY IN<br/>TANGO
            </h1>
            <p className="text-[42px] mt-6 text-rose-500 font-serif italic tracking-wider">
              Life goes on
            </p>
            <p className="text-[28px] font-bold text-slate-700 mt-2 tracking-tight">
              오늘, {region.ko}의 탱고씬 ({dateStrKorean})
            </p>
          </div>
          <div className="flex flex-col items-end text-right">
            <p className="text-[32px] font-bold tracking-[0.2em] text-rose-500 mb-2">{dayName}</p>
            <h2 className="text-[72px] font-black leading-none text-[#111] tracking-tighter">
              {monthName} {dayNum}
            </h2>
            <p className="text-[32px] font-medium tracking-[0.4em] text-slate-500 mt-2">{region.en}</p>
          </div>
        </div>

        {/* Main Section: Milonga */}
        {milonga && (
          <div className="w-full h-[700px] rounded-[40px] overflow-hidden relative shadow-2xl mb-12">
            {milongaImgUrl && (
              <img 
                src={milongaImgUrl} 
                alt="Milonga" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            <div className="absolute top-10 left-10">
              <span className="text-white/90 text-[24px] font-bold tracking-[0.2em] uppercase">Today's Milonga</span>
            </div>

            <div className="absolute bottom-12 left-12 right-12">
              {milonga.subtitle && (
                <p className="text-[40px] font-black text-white/90 mb-2 drop-shadow-md">{milonga.subtitle}</p>
              )}
              <h3 className="text-[96px] font-black text-white leading-none tracking-tighter mb-6 drop-shadow-lg break-all">
                {milonga.titleNative || milonga.title}
              </h3>
              
              {(milonga.organizer || milonga.dj) && (
                <div className="flex items-center gap-6 text-white/90 text-[28px] font-medium mb-6">
                  {milonga.organizer && <span>org. {milonga.organizer}</span>}
                  {milonga.dj && <span>dj. {milonga.dj}</span>}
                </div>
              )}
              
              <div className="flex items-center gap-10 text-white/90 text-[32px] font-medium">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[36px]">schedule</span>
                  <span>{milonga.startTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[36px]">location_on</span>
                  <span>{milonga.location || region.en}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub Sections: Class & Practica in a Row */}
        <div className="flex gap-8 mb-12">
          {/* Class */}
          <div className="flex-1 bg-white rounded-[40px] p-10 shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-100 h-[450px]">
            <div className="absolute top-0 right-0 w-full h-full opacity-10">
              {classImgUrl && (
                <img 
                  src={classImgUrl} 
                  className="w-full h-full object-cover grayscale" 
                />
              )}
            </div>
            <div className="relative z-10">
              <span className="text-blue-600 text-[22px] font-bold tracking-[0.2em] uppercase">Today's Class</span>
              <h3 className="text-[60px] font-black text-slate-900 mt-6 leading-tight tracking-tight">
                {tangoClass?.titleNative || tangoClass?.title || '클래스 일정이 없습니다'}
              </h3>
            </div>
            
            {tangoClass && (
              <div className="relative z-10 flex flex-col gap-4 mt-8 text-[28px] text-slate-700 font-medium">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-slate-400 text-[32px]">schedule</span>
                  <span>{tangoClass.startTime}</span>
                </div>
                {(tangoClass.instructor || tangoClass.groupName) && (
                  <div className="flex items-center gap-4 text-[24px]">
                    <span className="material-symbols-outlined text-slate-400 text-[32px]">person</span>
                    <div className="flex flex-col truncate">
                      {tangoClass.groupName && <span className="font-bold text-blue-600">{tangoClass.groupName}</span>}
                      <span>{tangoClass.instructor}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Practica */}
          <div className="flex-1 bg-slate-900 rounded-[40px] p-10 shadow-xl relative overflow-hidden flex flex-col justify-between h-[450px]">
            <div className="absolute top-0 right-0 w-full h-full opacity-20">
              {practicaImgUrl && (
                <img 
                  src={practicaImgUrl} 
                  className="w-full h-full object-cover mix-blend-overlay" 
                />
              )}
            </div>
            <div className="relative z-10">
              <span className="text-emerald-400 text-[22px] font-bold tracking-[0.2em] uppercase">Today's Practica</span>
              <h3 className="text-[60px] font-black text-white mt-6 leading-tight tracking-tight">
                {practica?.titleNative || practica?.title || '쁘락띠까 일정이 없습니다'}
              </h3>
            </div>
            
            {practica && (
              <div className="relative z-10 flex flex-col gap-4 mt-8 text-[28px] text-white/80 font-medium">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-white/50 text-[32px]">schedule</span>
                  <span>{practica.startTime} {practica.endTime ? `- ${practica.endTime}` : ''}</span>
                </div>
                {practica.location && (
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-white/50 text-[32px]">location_on</span>
                    <span className="truncate">{practica.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Event Banner */}
      <div className="mt-auto px-16 pb-16 z-10 w-full flex flex-col items-center">
        {banner && bannerImgUrl ? (
          <div className="w-full h-[220px] rounded-[40px] relative overflow-hidden flex items-center justify-between shadow-2xl mb-8">
            <img 
              alt="Event Banner" 
              className="absolute inset-0 w-full h-full object-cover" 
              src={bannerImgUrl}
            />
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10 p-10 w-full flex justify-between items-center text-white">
              <div className="flex-1 overflow-hidden pr-8">
                <p className="text-[20px] font-bold tracking-[0.2em] text-[#FF5E3A] uppercase mb-2">Special Event</p>
                <h3 className="font-noto font-black text-[42px] truncate leading-tight drop-shadow-md">{banner.titleNative || banner.title}</h3>
                {banner.startDate && (
                  <p className="text-[24px] font-medium opacity-90 mt-2 truncate">
                    {new Date(banner.startDate.seconds * 1000).toLocaleDateString('ko-KR')}
                    {banner.endDate && ` - ${new Date(banner.endDate.seconds * 1000).toLocaleDateString('ko-KR')}`}
                  </p>
                )}
              </div>
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path></svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[220px] bg-black rounded-[40px] p-10 relative overflow-hidden flex items-center justify-between text-white shadow-2xl mb-8">
            <img 
              alt="Tango Shoes" 
              className="absolute left-0 top-0 h-full w-1/2 object-cover opacity-30 grayscale" 
              src={fallbackBannerImgUrl || ''}
            />
            <div className="relative z-10 w-full flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4">
                  <span className="font-serif italic text-[#FF5E3A] text-[48px]">Explore More</span>
                  <svg className="w-12 h-12 text-[#FF5E3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <p className="font-noto text-[24px] opacity-70 mt-2">더 많은 일정은 WoC에서</p>
              </div>
              <div className="text-right pr-4">
                <h2 className="text-[64px] font-black tracking-tighter">WOC</h2>
                <div className="mt-2 border border-white/30 rounded-full px-6 py-2 text-[20px] font-medium tracking-widest inline-block">woc.today</div>
              </div>
            </div>
          </div>
        )}
        <p className="font-noto text-[20px] text-slate-500 font-bold tracking-tight">상세 내용은 <span className="text-slate-800">www.WOC.today</span>에서 제공됨</p>
      </div>
    </div>
  );
}
