import React from 'react';
import { CoverEvent } from '../CoverEditor';
import { useBase64Image } from '../useBase64Image';
import { getCityGroup, getCityCategoryLabel } from '@/app/social/constants/regionMapping';

interface ThemeDProps {
  date: Date;
  allMilongas: CoverEvent[];
  allClasses: CoverEvent[];
  allPracticas: CoverEvent[];
  region: { ko: string; en: string };
  banner?: any;
}

function getSortedEvents(events: CoverEvent[]) {
  const REGION_ORDER = [
    '서울 홍대',
    '서울 강남',
    '부산',
    '대구',
    '대전',
    '광주',
    '인천',
    '울산'
  ];
  
  const mapped = events.map(ev => {
    const label = getDistrictLabel(ev);
    let weight = REGION_ORDER.indexOf(label);
    if (weight === -1) {
      weight = 999;
    }
    return { ...ev, label, weight };
  });
  
  mapped.sort((a, b) => {
    if (a.weight !== b.weight) {
      return a.weight - b.weight;
    }
    if (a.label !== b.label) {
      return a.label.localeCompare(b.label);
    }
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
  
  return mapped;
}

/* ─── Card: Today 소셜 카드와 동일 스타일 ─── */
function ImageCard({ ev, aspect = '3/4' }: { ev: CoverEvent; aspect?: string }) {
  const isMilonga = ev.type === 'milonga' || ev.type === 'social';
  const base64Url = useBase64Image(ev.imageUrl || undefined);
  const hasImage = !!base64Url;
  const venue = ev.location || '';
  const shortVenue = venue.length > 8 ? venue.slice(0, 8) + '…' : venue;

  return (
    <div className="relative overflow-hidden rounded-[24px]" style={{ aspectRatio: aspect }}>
      {hasImage ? (
        <img src={base64Url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      {/* Time badge */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 items-start">
        <span className="bg-black/75 backdrop-blur-sm text-white text-[24px] font-black px-4 py-1.5 rounded-full leading-none">
          {ev.startTime || '—'}
        </span>
      </div>

      {/* Venue badge with location icon */}
      {shortVenue && (
        <span className="absolute top-4 right-4 bg-black/75 backdrop-blur-sm text-white text-[22px] font-black px-4 py-1.5 rounded-full leading-none shadow-sm max-w-[270px] truncate flex items-center gap-1.5">
          <svg className="w-[22px] h-[22px] text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {shortVenue}
        </span>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-1.5">
        <p className="text-white font-black text-[36px] leading-tight line-clamp-2">
          {ev.titleNative || ev.title}
        </p>
        {isMilonga && ev.organizer && (
          <p className="text-[28px] font-semibold text-white/80 truncate">org {ev.organizer}</p>
        )}
        {isMilonga && ev.dj && (
          <p className="text-[28px] font-semibold text-white/80 truncate">dj {ev.dj}</p>
        )}
        {!isMilonga && ev.instructor && (
          <p className="text-[28px] font-semibold text-white/80 truncate">{ev.instructor}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Practica text cell ─── */
function PracticaCell({ label, items, maxShow = 5, colSpan = 'col-span-2' }: { label: string; items: CoverEvent[]; maxShow?: number; colSpan?: string }) {
  const shown = items.slice(0, maxShow);
  const remaining = items.length - maxShow;

  return (
    <div className={`${colSpan} rounded-[24px] bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-7`}>
      <p className="text-[30px] font-black text-orange-400 tracking-wider uppercase mb-5">{label}</p>
      {shown.length > 0 ? (
        <div className="flex flex-col gap-4">
          {shown.map(p => (
            <div key={p.id} className="flex items-center gap-4 min-w-0">
              <span className="w-4 h-4 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="text-[32px] font-bold text-white truncate">{p.titleNative || p.title}</span>
              <span className="text-[26px] text-white/50 flex-shrink-0">{p.startTime || ''}</span>
              {p.location && <span className="text-[26px] text-white/40 truncate">· {p.location}</span>}
            </div>
          ))}
          {remaining > 0 && (
            <p className="text-[26px] text-white/40 italic pl-8">more +{remaining}</p>
          )}
        </div>
      ) : (
        <p className="text-[28px] text-white/30">—</p>
      )}
    </div>
  );
}

function getDistrictLabel(ev: CoverEvent) {
  if (ev.seoulArea === 'gangnam') return '서울 강남';
  if (ev.seoulArea === 'gangbuk') return '서울 홍대';

  const dbCity = (ev.city || "").trim();
  const dbLoc = (ev.location || "").trim();
  const searchStr = `${dbCity} ${dbLoc} ${ev.groupName || ''} ${ev.title || ''} ${ev.titleNative || ''}`.toLowerCase();
  
  // 1. 부산/대구 등 영남권 판별
  if (['부산', '대구', '울산', '경상', '영남', '경북', '경남', '창원', '진주', 'busan', 'daegu', 'ulsan'].some(k => searchStr.includes(k))) {
    return '부산/영남';
  }
  
  // 2. 대전/충청권 판별
  if (['대전', '세종', '충북', '충남', '충청', '청주', '천안', 'daejeon', 'sejong'].some(k => searchStr.includes(k))) {
    return '대전/충청';
  }
  
  // 3. 광주/호남/제주권 판별
  if (['광주', '전북', '전남', '호남', '제주', '순천', '군산', 'gwangju', 'jeju'].some(k => searchStr.includes(k))) {
    return '광주/호남/제주';
  }

  // 4. 강남 키워드가 포함되면 서울 강남
  const gangnamKeywords = ['강남', '서초', '압구정', 'gangnam', '신사', '양재', '역삼', '엘불', 'elbul', '보니따', '비다미아', '엔빠스', 'en paz', '낮쁘락', '엘땅고', 'eltango', '로지', 'rosy', '탱고오앤', 'tango o&', '오앤', '라플라타', 'laplata', '끌라로', 'claro'];
  if (gangnamKeywords.some(k => searchStr.includes(k))) {
    return '서울 강남';
  }

  // 5. 그 외에는 기본값 서울 홍대로 처리 (서울 마포, 홍대, 신촌 등)
  return '서울 홍대';
}

export default function ThemeMagazineD({
  date, allMilongas, allClasses, allPracticas, region, banner
}: ThemeDProps) {

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNameKo = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  const dayNameEn = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  // 전국 단위 정렬 적용
  const sortedMilongas = getSortedEvents(allMilongas);
  const sortedClasses = getSortedEvents(allClasses);
  const sortedPracticas = getSortedEvents(allPracticas);

  const hasMilongas = sortedMilongas.length > 0;
  const hasPracticas = sortedPracticas.length > 0;
  const hasClasses = sortedClasses.length > 0;

  // 각 도시명별 카운트 세기
  const milongaCounts: Record<string, number> = {};
  sortedMilongas.forEach(ev => {
    const label = getDistrictLabel(ev);
    milongaCounts[label] = (milongaCounts[label] || 0) + 1;
  });

  const classCounts: Record<string, number> = {};
  sortedClasses.forEach(ev => {
    const label = getDistrictLabel(ev);
    classCounts[label] = (classCounts[label] || 0) + 1;
  });

  return (
    <div className="w-[1080px] bg-[#f5f5f7] flex flex-col text-gray-900" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800&family=Noto+Sans+KR:wght@300;400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
      `}} />

      {/* ── Compact Header ── */}
      <header className="flex items-center justify-between px-[36px] py-[32px] bg-black">
        <p style={{ fontFamily: "'Bebas Neue', cursive" }} className="text-[64px] text-white leading-none tracking-wider">
          TODAY IN TANGO
        </p>
        <div className="flex items-center gap-[20px]">
          <p style={{ fontFamily: "'Bebas Neue', cursive" }} className="text-[60px] text-[#FF5E3A] leading-none tracking-tight">
            {month}/{day}
          </p>
          <span className="text-[24px] text-white/50 font-bold leading-none">{dayNameEn} {dayNameKo}</span>
        </div>
      </header>

      <div className="px-6 pb-6">

        {/* ── 밀롱가: 3-col grid, 오늘 서비스 카드 헤더 스타일 ── */}
        {hasMilongas && (
          <div className="grid grid-cols-3 gap-x-6 gap-y-8 items-end mt-6">
            {sortedMilongas.map((ev, index) => {
              const districtLabel = getDistrictLabel(ev);
              const showHeader = index === 0 || getDistrictLabel(sortedMilongas[index - 1]) !== districtLabel;
              const count = milongaCounts[districtLabel] || 0;
              const displayLabel = count > 1 ? `${districtLabel}(${count})` : districtLabel;
              
              return (
                <div key={ev.id} className="flex flex-col gap-3 w-full">
                  <div className="h-12 flex items-center gap-2 text-slate-500 whitespace-nowrap overflow-hidden">
                    {showHeader ? (
                      <>
                        <svg className="w-[32px] h-[32px] text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="text-[24px] font-black uppercase tracking-widest truncate">{displayLabel}</span>
                      </>
                    ) : (
                      <span className="text-[24px] opacity-0 pointer-events-none">—</span>
                    )}
                  </div>
                  <ImageCard ev={ev} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── 쁘락띠까 ── */}
        {hasPracticas && (
          <div className="mt-8">
            <PracticaCell label="🏃 쁘락띠까" items={sortedPracticas} colSpan="col-span-3" />
          </div>
        )}

        {/* ── 클래스: 3-col grid, 오늘 서비스 카드 헤더 스타일 ── */}
        {hasClasses && (
          <div className="grid grid-cols-3 gap-x-6 gap-y-8 items-end mt-8">
            {sortedClasses.map((ev, index) => {
              const districtLabel = getDistrictLabel(ev);
              const showHeader = index === 0 || getDistrictLabel(sortedClasses[index - 1]) !== districtLabel;
              const count = classCounts[districtLabel] || 0;
              const displayLabel = count > 1 ? `${districtLabel}(${count})` : districtLabel;
              
              return (
                <div key={ev.id} className="flex flex-col gap-3 w-full">
                  <div className="h-12 flex items-center gap-2 text-slate-500 whitespace-nowrap overflow-hidden">
                    {showHeader ? (
                      <>
                        <svg className="w-[32px] h-[32px] text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="text-[24px] font-black uppercase tracking-widest truncate">{displayLabel}</span>
                      </>
                    ) : (
                      <span className="text-[24px] opacity-0 pointer-events-none">—</span>
                    )}
                  </div>
                  <ImageCard ev={ev} aspect="1/1" />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Event Banner ── */}
        {banner && (
          <div className="mt-8 relative overflow-hidden rounded-[24px] bg-black" style={{ minHeight: '108px' }}>
            {(banner.imageUrl || banner.posterUrl) && (
              <img src={banner.imageUrl || banner.posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 p-8 flex items-center gap-8 text-white">
              <span className="bg-rose-600 text-white text-[26px] font-black px-5 py-2.5 rounded-[12px] leading-none flex-shrink-0">D-Day</span>
              <div className="flex-1 min-w-0">
                <p className="text-[36px] font-black truncate leading-tight">{banner.titleNative || banner.title}</p>
                {banner.startDate && (
                  <p className="text-[28px] opacity-70 truncate">
                    {new Date(banner.startDate.seconds * 1000).toLocaleDateString('ko-KR')}
                    {banner.endDate && ` — ${new Date(banner.endDate.seconds * 1000).toLocaleDateString('ko-KR')}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-4 bg-white/80 mt-auto">
        <p className="text-[24px] text-gray-400 font-bold">
          상세 내용은 <span className="text-[#0E1428] font-black">www.WOC.today</span>에서 제공됨
        </p>
      </div>
    </div>
  );
}
