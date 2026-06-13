import React from 'react';
import { CoverEvent } from '../CoverEditor';
import { useBase64Image } from '../useBase64Image';

interface ThemeDProps {
  date: Date;
  allMilongas: CoverEvent[];
  allClasses: CoverEvent[];
  allPracticas: CoverEvent[];
  region: { ko: string; en: string };
  banner?: any;
}

/* ─── 오늘 페이지 detectSeoulDistrict와 동일한 강북(홍대) 키워드 ─── */
const GANGBUK_KEYWORDS = [
  '홍대', '마포', '신촌', '합정', '망원', '종로', '중구', '성동', '서대문', '이대', '상수', '광진', '용산', '한남', '이태원', '을지로', '광화문',
  'hongdae', 'mapo', 'sinchon', 'hapjeong', 'jongno', 'yongsan', 'hannam', 'itaewon',
  '바르샤', 'barsha', '엘빠소', 'elpaso', '아반', 'aban', '보헤미안', 'bohemian', '아르헨티나', 'argentina',
  '오쵸', 'ocho', '땅고마니아', 'tangomania', '라비다', 'lavida', '마구아', 'magua', '밀롱가헤이', 'milongahei',
  '라벤타나', '라 벤타나', 'ventana', 'la ventana', '알마', 'alma', '오나다', 'onada', 'atta', '아똬',
  '안단테', 'andante', '오초', '라벤따나'
];

function classifyDistrict(ev: CoverEvent): 'hongdae' | 'gangnam' {
  // 1. venue seoulArea 우선 사용
  if (ev.seoulArea === 'gangbuk') return 'hongdae';
  if (ev.seoulArea === 'gangnam') return 'gangnam';

  // 2. 키워드 폴백
  const s = `${ev.location || ''} ${ev.groupName || ''} ${ev.title || ''} ${ev.titleNative || ''} ${ev.city || ''}`.toLowerCase();
  for (const key of GANGBUK_KEYWORDS) {
    if (s.includes(key)) return 'hongdae';
  }
  return 'gangnam';
}

function isDaySocial(ev: CoverEvent): boolean {
  const hour = parseInt((ev.startTime || '19:00').split(':')[0]);
  return !isNaN(hour) && hour < 18;
}

/* ─── 오늘 페이지와 동일한 4대 권역 그룹화 ─── */
type DistrictGroup = { label: string; items: CoverEvent[] };

function groupByDistrict(events: CoverEvent[], type: 'milonga' | 'class'): DistrictGroup[] {
  const groups: Record<string, CoverEvent[]> = {};

  events.forEach(ev => {
    const district = classifyDistrict(ev);
    let groupKey: string;

    if (type === 'milonga') {
      const isDay = isDaySocial(ev);
      if (district === 'hongdae') {
        groupKey = isDay ? '홍대인근 낮밀' : '홍대인근';
      } else {
        groupKey = isDay ? '강남 낮밀' : '강남';
      }
    } else {
      groupKey = district === 'hongdae' ? '클래스 · 홍대인근' : '클래스 · 강남';
    }

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(ev);
  });

  // 각 그룹 시간순 정렬
  Object.values(groups).forEach(arr => {
    arr.sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
  });

  // 오늘 페이지와 동일한 순서
  const milongaOrder = ['홍대인근 낮밀', '홍대인근', '강남 낮밀', '강남'];
  const classOrder = ['클래스 · 홍대인근', '클래스 · 강남'];
  const order = type === 'milonga' ? milongaOrder : classOrder;

  return order
    .filter(key => groups[key] && groups[key].length > 0)
    .map(key => ({ label: key, items: groups[key] }));
}

/* ─── Card: Today 소셜 카드와 동일 스타일 ─── */
function ImageCard({ ev, aspect = '3/4' }: { ev: CoverEvent; aspect?: string }) {
  const isMilonga = ev.type === 'milonga' || ev.type === 'social';
  const base64Url = useBase64Image(ev.imageUrl || undefined);
  const hasImage = !!base64Url;
  const venue = ev.location || '';
  const shortVenue = venue.length > 8 ? venue.slice(0, 8) + '…' : venue;
  const isDay = isDaySocial(ev);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: aspect }}>
      {hasImage ? (
        <img src={base64Url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Time badge + day badge */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
        <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
          {ev.startTime || '—'}
        </span>
        {isMilonga && isDay && (
          <span className="bg-amber-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">낮밀</span>
        )}
      </div>

      {/* Venue badge with location icon */}
      {shortVenue && (
        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm max-w-[90px] truncate flex items-center gap-0.5">
          <span className="material-symbols-outlined !text-[8px]">location_on</span>{shortVenue}
        </span>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
        <p className="text-white font-black text-[13px] leading-tight line-clamp-2">
          {ev.titleNative || ev.title}
        </p>
        {isMilonga && ev.organizer && (
          <p className="text-[10px] font-semibold text-white/70 truncate">org {ev.organizer}</p>
        )}
        {isMilonga && ev.dj && (
          <p className="text-[10px] font-semibold text-white/70 truncate">dj {ev.dj}</p>
        )}
        {!isMilonga && ev.instructor && (
          <p className="text-[10px] font-semibold text-white/70 truncate">{ev.instructor}</p>
        )}
      </div>
    </div>
  );
}

/* ─── District label ─── */
function DistrictLabel({ label }: { label: string }) {
  return (
    <div className="col-span-3 flex items-center gap-2 mt-1 mb-0.5">
      <span className="material-symbols-outlined !text-[13px] text-blue-500">location_searching</span>
      <span className="text-[14px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

/* ─── Practica text cell ─── */
function PracticaCell({ label, items, maxShow = 5, colSpan = 'col-span-2' }: { label: string; items: CoverEvent[]; maxShow?: number; colSpan?: string }) {
  const shown = items.slice(0, maxShow);
  const remaining = items.length - maxShow;

  return (
    <div className={`${colSpan} rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 px-3 py-2.5`}>
      <p className="text-[11px] font-black text-orange-400 tracking-wider uppercase mb-2">{label}</p>
      {shown.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {shown.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="text-[12px] font-bold text-white truncate">{p.titleNative || p.title}</span>
              <span className="text-[10px] text-white/40 flex-shrink-0">{p.startTime || ''}</span>
              {p.location && <span className="text-[10px] text-white/30 truncate">· {p.location}</span>}
            </div>
          ))}
          {remaining > 0 && (
            <p className="text-[10px] text-white/30 italic pl-3">more +{remaining}</p>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-white/25">—</p>
      )}
    </div>
  );
}

export default function ThemeMagazineD({
  date, allMilongas, allClasses, allPracticas, region, banner
}: ThemeDProps) {

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNameKo = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  const dayNameEn = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  // 오늘 페이지와 동일한 4대 권역 그룹화
  const milongaGroups = groupByDistrict(allMilongas, 'milonga');
  const classGroups = groupByDistrict(allClasses, 'class');

  // 쁘락띠까: 지역 구분 없이 시간순 통합
  const allPracticasSorted = [...allPracticas].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const hasMilongas = milongaGroups.length > 0;
  const hasPracticas = allPracticasSorted.length > 0;
  const hasClasses = classGroups.length > 0;

  // 밀롱가: 모든 그룹의 카드를 하나의 연속 그리드 아이템 배열로 평탄화
  type GridItem = { type: 'label'; text: string } | { type: 'card'; ev: CoverEvent };
  const milongaGridItems: GridItem[] = [];
  milongaGroups.forEach(group => {
    milongaGridItems.push({ type: 'label', text: group.label });
    group.items.forEach(ev => milongaGridItems.push({ type: 'card', ev }));
  });

  const classGridItems: GridItem[] = [];
  classGroups.forEach(group => {
    classGridItems.push({ type: 'label', text: group.label });
    group.items.forEach(ev => classGridItems.push({ type: 'card', ev }));
  });

  return (
    <div className="w-[1080px] bg-[#f5f5f7] flex flex-col" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800&family=Noto+Sans+KR:wght@300;400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
      `}} />

      <div className="w-[360px] absolute top-0 left-0 origin-top-left scale-[3] flex flex-col text-gray-900 bg-[#f5f5f7]">

        {/* ── Compact Header ── */}
        <header className="flex items-center justify-between px-[12px] py-[14px] bg-black">
          <div className="flex items-center gap-[10px]">
            <p style={{ fontFamily: "'Bebas Neue', cursive" }} className="text-[26px] text-white leading-none tracking-tight">
              TODAY IN TANGO
            </p>
            <span className="text-[10px] text-white/40 font-bold">오늘, {region.ko}의 탱고씬</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <p style={{ fontFamily: "'Bebas Neue', cursive" }} className="text-[26px] text-[#FF5E3A] leading-none tracking-tight">
              {month}/{day}
            </p>
            <span className="text-[9px] text-white/50 font-bold">{dayNameEn} {dayNameKo}</span>
            <span className="text-[8px] font-bold text-white/40 border border-white/20 rounded-full px-[6px] py-[2px]">woc.today</span>
          </div>
        </header>

        <div className="px-2 pb-2">

          {/* ── 밀롱가: 3-col grid, 빈칸 없이 연속 ── */}
          {hasMilongas && (
            <div className="grid grid-cols-3 gap-2 items-end mt-2">
              {milongaGridItems.map((item, idx) => 
                item.type === 'label' ? (
                  <DistrictLabel key={`ml-${idx}`} label={item.text} />
                ) : (
                  <ImageCard key={`mc-${item.ev.id}-${idx}`} ev={item.ev} />
                )
              )}
            </div>
          )}

          {/* ── 쁘락띠까 ── */}
          {hasPracticas && (
            <div className="mt-3">
              <PracticaCell label="🏃 쁘락띠까" items={allPracticasSorted} colSpan="col-span-3" />
            </div>
          )}

          {/* ── 클래스: 3-col grid ── */}
          {hasClasses && (
            <div className="grid grid-cols-3 gap-2 items-end mt-3">
              {classGridItems.map((item, idx) =>
                item.type === 'label' ? (
                  <DistrictLabel key={`cl-${idx}`} label={item.text} />
                ) : (
                  <ImageCard key={`cc-${item.ev.id}-${idx}`} ev={item.ev} aspect="1/1" />
                )
              )}
            </div>
          )}

          {/* ── Event Banner ── */}
          {banner && (
            <div className="mt-3 relative overflow-hidden rounded-xl bg-black" style={{ minHeight: '36px' }}>
              {(banner.imageUrl || banner.posterUrl) && (
                <img src={banner.imageUrl || banner.posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              )}
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 p-3 flex items-center gap-3 text-white">
                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-lg leading-none flex-shrink-0">D-Day</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black truncate leading-tight">{banner.titleNative || banner.title}</p>
                  {banner.startDate && (
                    <p className="text-[10px] opacity-70 truncate">
                      {new Date(banner.startDate.seconds * 1000).toLocaleDateString('ko-KR')}
                      {banner.endDate && ` — ${new Date(banner.endDate.seconds * 1000).toLocaleDateString('ko-KR')}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-1 bg-white/80 mt-auto">
          <p className="text-[9px] text-gray-400 font-bold">
            상세 내용은 <span className="text-[#0E1428]">www.WOC.today</span>에서 제공됨
          </p>
        </div>
      </div>
    </div>
  );
}
