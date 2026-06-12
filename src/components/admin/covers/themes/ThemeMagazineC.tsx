import React from 'react';
import { CoverEvent } from '../CoverEditor';

interface ThemeCProps {
  date: Date;
  allMilongas: CoverEvent[];
  allClasses: CoverEvent[];
  allPracticas: CoverEvent[];
  region: { ko: string; en: string };
  banner?: any;
}

const GANGNAM_KEYWORDS = [
  '강남', '서초', '압구정', 'gangnam', '신사', '양재', '역삼',
  '엘불', 'elbul', '보니따', '비다미아', '엔빠스', 'en paz',
  '낮쁘락', '엘땅고', 'eltango', '로지', 'rosy', '탱고오앤',
  'tango o&', '오앤', '라플라타', 'laplata', '끌라로', 'claro',
  '피스타', 'pista'
];

function classifyRegion(ev: CoverEvent): 'hongdae' | 'gangnam' {
  const s = `${ev.city || ''} ${ev.location || ''} ${ev.groupName || ''} ${ev.title || ''} ${ev.titleNative || ''}`.toLowerCase();
  if (GANGNAM_KEYWORDS.some(k => s.includes(k))) return 'gangnam';
  return 'hongdae';
}

/* ─── Image card (milonga or class) ─── */
function ImageCard({ ev, aspect = '3/4' }: { ev: CoverEvent; aspect?: string }) {
  const isMilonga = ev.type === 'milonga' || ev.type === 'social';
  const hasImage = !!ev.imageUrl;

  return (
    <div className="relative overflow-hidden rounded-[3px]" style={{ aspectRatio: aspect }}>
      {hasImage ? (
        <img src={ev.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

      {/* Time badge */}
      <div className="absolute top-[3px] left-[3px]">
        <span className="bg-black/60 backdrop-blur-sm text-white text-[5px] font-black px-[4px] py-[1.5px] rounded-full leading-none">
          {ev.startTime || '—'}
        </span>
      </div>

      {/* Venue badge */}
      {ev.location && (
        <span className="absolute top-[3px] right-[3px] bg-black/50 text-white text-[4px] font-bold px-[3px] py-[1px] rounded-full leading-none truncate max-w-[42px]">
          {ev.location}
        </span>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-[3px]">
        <p className="text-white font-black text-[5.5px] leading-[1.15]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {ev.titleNative || ev.title}
        </p>
        {isMilonga && ev.organizer && (
          <p className="text-[4px] font-semibold text-white/60 truncate mt-[1px]">org {ev.organizer}</p>
        )}
        {isMilonga && ev.dj && (
          <p className="text-[4px] font-semibold text-white/60 truncate">dj {ev.dj}</p>
        )}
        {!isMilonga && ev.instructor && (
          <p className="text-[4px] font-semibold text-white/60 truncate mt-[1px]">{ev.instructor}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Labeled grid cell: tiny label above the card ─── */
function LabeledCell({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-end">
      {label && (
        <div className="flex items-center gap-[2px] mb-[1.5px]">
          <span className="text-[4.5px] font-black text-slate-500 tracking-wide whitespace-nowrap">{label}</span>
          <div className="flex-1 h-px bg-slate-300 min-w-[4px]" />
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Practica text cell (one line per item, max + more) ─── */
function PracticaCell({ label, items, maxShow = 5 }: { label: string; items: CoverEvent[]; maxShow?: number }) {
  const shown = items.slice(0, maxShow);
  const remaining = items.length - maxShow;

  return (
    <div className="col-span-2 rounded-[3px] bg-gradient-to-br from-slate-800 to-slate-900 px-[5px] py-[4px]">
      <p className="text-[4.5px] font-black text-orange-400 tracking-wider uppercase mb-[3px]">{label}</p>
      {shown.length > 0 ? (
        <div className="flex flex-col gap-[2px]">
          {shown.map(p => (
            <div key={p.id} className="flex items-center gap-[3px] min-w-0">
              <span className="w-[1.5px] h-[6px] bg-orange-400 flex-shrink-0 rounded-full" />
              <span className="text-[5px] font-bold text-white truncate">{p.titleNative || p.title}</span>
              <span className="text-[4px] text-white/40 flex-shrink-0">{p.startTime || ''}</span>
              {p.location && <span className="text-[4px] text-white/30 truncate">· {p.location}</span>}
            </div>
          ))}
          {remaining > 0 && (
            <p className="text-[4px] text-white/30 italic pl-[4px]">more +{remaining}</p>
          )}
        </div>
      ) : (
        <p className="text-[4.5px] text-white/25">—</p>
      )}
    </div>
  );
}

export default function ThemeMagazineC({
  date, allMilongas, allClasses, allPracticas, region, banner
}: ThemeCProps) {

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNameKo = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  const dayNameEn = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  // Classify & sort
  const hongdaeM = allMilongas.filter(m => classifyRegion(m) === 'hongdae').sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const gangnamM = allMilongas.filter(m => classifyRegion(m) === 'gangnam').sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const hongdaeP = allPracticas.filter(p => classifyRegion(p) === 'hongdae').sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const gangnamP = allPracticas.filter(p => classifyRegion(p) === 'gangnam').sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const hongdaeC = allClasses.filter(c => classifyRegion(c) === 'hongdae').sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const gangnamC = allClasses.filter(c => classifyRegion(c) === 'gangnam').sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Build milonga items array (one continuous flow)
  type CardItem = { ev: CoverEvent; label?: string };
  const milongaItems: CardItem[] = [];
  hongdaeM.forEach((m, i) => milongaItems.push({ ev: m, label: i === 0 ? '🔥 밀롱가 · 홍대' : undefined }));
  gangnamM.forEach((m, i) => milongaItems.push({ ev: m, label: i === 0 ? '🔥 밀롱가 · 강남' : undefined }));

  // Build class items array (one continuous flow)
  const classItems: CardItem[] = [];
  hongdaeC.forEach((c, i) => classItems.push({ ev: c, label: i === 0 ? '🎓 클래스 · 홍대' : undefined }));
  gangnamC.forEach((c, i) => classItems.push({ ev: c, label: i === 0 ? '🎓 클래스 · 강남' : undefined }));

  const hasMilongas = milongaItems.length > 0;
  const hasPracticas = hongdaeP.length > 0 || gangnamP.length > 0;
  const hasClasses = classItems.length > 0;

  return (
    <div className="w-[1080px] bg-[#f5f5f7] flex flex-col" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif", minHeight: '1080px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800&family=Noto+Sans+KR:wght@300;400;700&display=swap');
      `}} />

      {/* Scale wrapper: 360 * 3 = 1080 */}
      <div className="w-[360px] absolute top-0 left-0 origin-top-left scale-[3] flex flex-col text-gray-900 bg-[#f5f5f7]">

        {/* ── Compact Header ── */}
        <header className="flex items-center justify-between px-[6px] py-[5px] bg-black">
          <div className="flex items-center gap-[6px]">
            <p style={{ fontFamily: "'Bebas Neue', cursive" }} className="text-[14px] text-white leading-none tracking-tight">
              TODAY IN TANGO
            </p>
            <span className="text-[5px] text-white/40 font-bold">오늘, {region.ko}의 탱고씬</span>
          </div>
          <div className="flex items-center gap-[4px]">
            <p style={{ fontFamily: "'Bebas Neue', cursive" }} className="text-[14px] text-[#FF5E3A] leading-none tracking-tight">
              {month}/{day}
            </p>
            <span className="text-[5px] text-white/50 font-bold">{dayNameEn} {dayNameKo}</span>
            <span className="text-[4.5px] font-bold text-white/40 border border-white/20 rounded-full px-[4px] py-[1px]">woc.today</span>
          </div>
        </header>

        <div className="px-[4px] pb-[4px]">

          {/* ── 밀롱가: One continuous 4-col grid ── */}
          {hasMilongas && (
            <div className="grid grid-cols-4 gap-[3px] items-end mt-[3px]">
              {milongaItems.map((item, idx) => (
                <LabeledCell key={`m-${item.ev.id}-${idx}`} label={item.label}>
                  <ImageCard ev={item.ev} />
                </LabeledCell>
              ))}
            </div>
          )}

          {/* ── 쁘락띠까: 2 text cells (col-span-2 each) ── */}
          {hasPracticas && (
            <div className="grid grid-cols-4 gap-[3px] mt-[4px]">
              <PracticaCell label="🏃 쁘락띠까 · 홍대" items={hongdaeP} />
              <PracticaCell label="🏃 쁘락띠까 · 강남" items={gangnamP} />
            </div>
          )}

          {/* ── 클래스: One continuous 4-col grid ── */}
          {hasClasses && (
            <div className="grid grid-cols-4 gap-[3px] items-end mt-[4px]">
              {classItems.map((item, idx) => (
                <LabeledCell key={`c-${item.ev.id}-${idx}`} label={item.label}>
                  <ImageCard ev={item.ev} aspect="1/1" />
                </LabeledCell>
              ))}
            </div>
          )}

          {/* ── Event Banner (full-width row) ── */}
          {banner && (
            <div className="mt-[4px] relative overflow-hidden rounded-[3px] bg-black" style={{ minHeight: '28px' }}>
              {(banner.imageUrl || banner.posterUrl) && (
                <img src={banner.imageUrl || banner.posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              )}
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 p-[6px] flex items-center gap-[6px] text-white">
                <span className="bg-rose-600 text-white text-[5px] font-black px-[4px] py-[2px] rounded-[2px] leading-none flex-shrink-0">D-Day</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[7px] font-black truncate leading-tight">{banner.titleNative || banner.title}</p>
                  {banner.startDate && (
                    <p className="text-[4.5px] opacity-70 truncate">
                      {new Date(banner.startDate.seconds * 1000).toLocaleDateString('ko-KR')}
                      {banner.endDate && ` — ${new Date(banner.endDate.seconds * 1000).toLocaleDateString('ko-KR')}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-[3px] bg-white/80 mt-auto">
          <p className="text-[5px] text-gray-400 font-bold">
            상세 내용은 <span className="text-[#0E1428]">www.WOC.today</span>에서 제공됨
          </p>
        </div>
      </div>
    </div>
  );
}
