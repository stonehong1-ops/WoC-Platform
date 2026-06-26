import { NextResponse } from 'next/server';
import { groupService } from '@/lib/firebase/groupService';
import { socialService } from '@/lib/firebase/socialService';
import { venueService } from '@/lib/firebase/venueService';
import { formatInstructorNames, formatCommunityName } from "@/app/social/constants/seoulRegions";
import { getDjDisplay } from "@/lib/utils/socialUtils";
import { CoverEvent } from '@/components/admin/covers/CoverEditor';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    
    // Parse target date (default to today in Korea Standard Time UTC+9)
    let targetDate: Date;
    if (dateStr) {
      const parsedDate = new Date(dateStr);
      targetDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
    } else {
      const now = new Date();
      // Adjust server UTC to KST
      const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      targetDate = new Date(kstTime.getUTCFullYear(), kstTime.getUTCMonth(), kstTime.getUTCDate());
    }

    const newEvents: CoverEvent[] = [];
    
    // 0. Fetch groups to map groupName for classes
    const allGroups = await groupService.getGroups();
    const groupMap = new Map(allGroups.map(g => [g.id, { name: g.nativeName || g.name || '', city: (g as any).city || g.address || '' }]));

    // 1. Fetch Socials, Practicas, and Venues
    const [socialsData, venuesData] = await Promise.all([
      socialService.getTodayActiveSocials(targetDate.getDay(), targetDate),
      venueService.getVenues()
    ]);
    const venuesMap = new Map(venuesData.map(v => [v.id, { name: v.nameKo || v.name || '', seoulArea: (v as any).seoulArea || '' }]));

    socialsData.forEach(data => {
       const orgStr = data.organizerNameNative || data.organizerNativeNames?.[0] || data.organizerName || '';
       newEvents.push({
         id: data.id,
         type: data.subCategory === 'practica' ? 'practice' : 'milonga',
         title: data.title || '',
         titleNative: data.titleNative || '',
         subtitle: formatCommunityName(orgStr, 'KR'),
         startTime: data.startTime || '',
         endTime: data.endTime || '',
         location: formatCommunityName(venuesMap.get(data.venueId || '')?.name || data.venueName || data.city || '', 'KR'),
         imageUrl: data.imageUrl || '',
         originalStartDate: targetDate,
         organizer: formatCommunityName(orgStr, 'KR'),
         dj: formatInstructorNames(getDjDisplay(data as any, targetDate, 'KR') || data.djName || data.djs?.[0]?.djName || '', 'KR'),
         city: data.city || '',
         seoulArea: venuesMap.get(data.venueId || '')?.seoulArea || ''
       });
    });

    // 2. Fetch Classes and filter by schedule
    try {
      const targetStr = targetDate.toDateString();
      const classesData = await groupService.getGlobalClassesAll();
      classesData.forEach(cls => {
        if (cls.status !== "Open") return;
        
        cls.schedule?.forEach((s: any) => {
          // Date parsers helpers
          const parseDateStr = (d: any): string => {
            if (!d) return "";
            if (typeof d === "string") return d;
            if (d && typeof d.toDate === "function") {
              const dateObj = d.toDate();
              return `${dateObj.getFullYear().toString().slice(-2)}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
            }
            return "";
          };

          const normalizeDateStr = (dStr: string): Date | null => {
            if (!dStr) return null;
            const normalized = dStr.replace(/[.\/]/g, "-").replace(/\s+/g, "");
            const parts = normalized.split("-");
            let y: string, m: string, dTime: string;
            if (parts.length >= 3) {
              y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
              m = parts[1].padStart(2, "0");
              dTime = parts[2].padStart(2, "0");
            } else if (parts.length === 2) {
              y = new Date().getFullYear().toString();
              m = parts[0].padStart(2, "0");
              dTime = parts[1].padStart(2, "0");
            } else {
              return null;
            }
            return new Date(`${y}-${m}-${dTime}T00:00:00`);
          };

          const dStr = parseDateStr(s.date);
          const clsDate = normalizeDateStr(dStr);
          if (clsDate && clsDate.toDateString() === targetStr) {
            const groupInfo = groupMap.get(cls.groupId || '') || { name: '', city: '' };
            newEvents.push({
              id: `${cls.id}_${s.timeSlot || cls.startTime || ''}`,
              type: 'class',
              title: cls.name || cls.title || '',
              titleNative: cls.nameNative || cls.titleNative || '',
              subtitle: cls.instructor || '',
              startTime: s.timeSlot || cls.startTime || '',
              location: formatCommunityName(cls.venueName || '', 'KR'),
              imageUrl: cls.imageUrl || cls.posterUrl || '',
              originalStartDate: clsDate,
              instructor: formatInstructorNames(cls.instructors?.slice(0, 2).map((i: any) => i.instructorNativeName || i.nameNative || i.name).join(', ') || cls.instructorNativeName || cls.instructor || '', 'KR'),
              groupName: groupInfo.name || cls.groupName || '',
              city: groupInfo.city || ''
            });
          }
        });
      });
    } catch (e) {
      console.error("Failed to fetch classes in cover-text API", e);
    }

    // 3. Format SNS Text exactly same as CoverEditor
    const daysKo = ['일', '월', '화', '수', '목', '금', '토'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getRegionGroup = (ev: CoverEvent) => {
      const searchStr = `${ev.city || ''} ${ev.location || ''} ${ev.groupName || ''} ${ev.title || ''} ${ev.titleNative || ''}`.toLowerCase();
      
      if (searchStr.includes('부산') || searchStr.includes('busan')) {
        return { ko: '(부산)', en: '(Busan)', city: '부산', order: 3 };
      }
      if (searchStr.includes('대전') || searchStr.includes('daejeon')) {
        return { ko: '(대전)', en: '(Daejeon)', city: '대전', order: 4 };
      }
      if (searchStr.includes('광주') || searchStr.includes('gwangju')) {
        return { ko: '(광주)', en: '(Gwangju)', city: '광주', order: 5 };
      }
      if (searchStr.includes('대구') || searchStr.includes('daegu')) {
        return { ko: '(대구)', en: '(Daegu)', city: '대구', order: 6 };
      }
      if (searchStr.includes('제주') || searchStr.includes('jeju')) {
        return { ko: '(제주)', en: '(Jeju)', city: '제주', order: 7 };
      }

      const gangnamKeywords = ['강남', '서초', '압구정', 'gangnam', '신사', '양재', '역삼', '엘불', 'elbul', '보니따', '비다미아', '엔빠스', 'en paz', '낮쁘락', '엘땅고', 'eltango', '로지', 'rosy', '탱고오앤', 'tango o&', '오앤', '라플라타', 'laplata', '끌라로', 'claro'];
      
      if (gangnamKeywords.some(k => searchStr.includes(k))) {
        return { ko: '(서울 강남)', en: '(Seoul Gangnam)', city: '서울', order: 2 };
      }
      
      return { ko: '(서울 홍대)', en: '(Seoul Hongdae)', city: '서울', order: 1 };
    };

    const sortedEvents = [...newEvents].sort((a, b) => {
      const aGroup = getRegionGroup(a);
      const bGroup = getRegionGroup(b);
      if (aGroup.order !== bGroup.order) return aGroup.order - bGroup.order;
      
      const typeOrder = { 'social': 1, 'milonga': 1, 'practice': 2, 'class': 3 };
      const aT = typeOrder[a.type as keyof typeof typeOrder] || 99;
      const bT = typeOrder[b.type as keyof typeof typeOrder] || 99;
      if (aT !== bT) return aT - bT;
      
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    let koText = `[오늘의 탱고 일정 - ${targetDate.getMonth() + 1}/${targetDate.getDate()} ${daysKo[targetDate.getDay()]}]\n'탱고월드' 앱에서 자동 등록됨 / www.woc.today\n\n`;

    let currentRegionKo = '';
    let currentMainCity = '';
    let currentType = '';

    sortedEvents.forEach((ev) => {
      const regionGroup = getRegionGroup(ev);

      if (regionGroup.ko !== currentRegionKo) {
        if (currentMainCity) {
          koText += `\n\n`;
        }
        koText += `📍${regionGroup.ko.replace(/[()]/g, '')}\n\n`;
        currentRegionKo = regionGroup.ko;
        currentMainCity = regionGroup.city;
        currentType = '';
      }

      let evTypeKo = '';
      if (ev.type === 'class') {
        evTypeKo = '- 클래스 -';
      } else if (ev.type === 'practice') {
        evTypeKo = '- 쁘락띠까 -';
      } else if (ev.type === 'milonga' || ev.type === 'social') {
        evTypeKo = '- 밀롱가 -';
      }

      if (evTypeKo !== currentType) {
        if (currentType) {
          koText += `\n`;
        }
        koText += `${evTypeKo}\n`;
        currentType = evTypeKo;
      }

      const time = ev.startTime || '';
      const titleKo = ev.titleNative || ev.title;
      
      if (ev.type === 'milonga' || ev.type === 'social') {
        const extraKo = [ev.organizer ? `org. ${ev.organizer}` : '', ev.dj ? `dj. ${ev.dj}` : ''].filter(Boolean).join(' / ');
        koText += `. ${titleKo} | ${time} | ${ev.location || '미정'}${extraKo ? ` (${extraKo})` : ''}\n`;
      } else if (ev.type === 'practice') {
        const extraKo = ev.organizer ? ` (${ev.organizer})` : '';
        koText += `. ${titleKo} | ${time} | ${ev.location || '미정'}${extraKo}\n`;
      } else if (ev.type === 'class') {
        const extraKo = ev.instructor ? ` | ${ev.instructor}` : '';
        const locKo = ev.location ? ` | ${ev.location}` : '';
        koText += `. ${titleKo} | ${time}${locKo}${extraKo}\n`;
      }
    });

    // 영문 텍스트 생성 (소셜/밀롱가만 대상)
    let enText = `[Today's Tango Events - ${targetDate.getMonth() + 1}/${targetDate.getDate()} ${daysEn[targetDate.getDay()]}]\n\n`;
    const socialEventsOnly = sortedEvents.filter(ev => ev.type === 'milonga' || ev.type === 'social');
    
    let currentRegionEn = '';
    let currentMainCityEn = '';
    let currentTypeEn = '';

    socialEventsOnly.forEach((ev) => {
      const regionGroup = getRegionGroup(ev);

      if (regionGroup.en !== currentRegionEn) {
        if (currentMainCityEn) {
          enText += `\n\n`;
        }
        enText += `📍${regionGroup.en.replace(/[()]/g, '')}\n\n`;
        currentRegionEn = regionGroup.en;
        currentMainCityEn = regionGroup.city;
        currentTypeEn = '';
      }

      const evTypeEn = '- Milonga -';
      if (evTypeEn !== currentTypeEn) {
        if (currentTypeEn) {
          enText += `\n`;
        }
        enText += `${evTypeEn}\n`;
        currentTypeEn = evTypeEn;
      }

      const time = ev.startTime || '';
      const titleEn = ev.title;
      const extraEn = [ev.organizer ? `org. ${formatCommunityName(ev.organizer, 'EN')}` : '', ev.dj ? `dj. ${formatInstructorNames(ev.dj, 'EN')}` : ''].filter(Boolean).join(' / ');
      enText += `. ${titleEn} | ${time} | ${formatCommunityName(ev.location || '', 'EN')}${extraEn ? ` (${extraEn})` : ''}\n`;
    });

    const finalKoText = koText.trim() + `\n\n페이스북에서 자동 검색 및 저장됨. 문의 : 스톤 01072092468`;
    const fullText = `${finalKoText}\n\n---\n\n${enText.trim()}\n\n🔎 Find more info at woc.today!`;

    const format = searchParams.get('format');
    if (format === 'text') {
      return new Response(fullText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'public, max-age=60, s-maxage=300'
        }
      });
    }

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      totalEvents: sortedEvents.length,
      text: fullText
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  } catch (error) {
    console.error('Error generating cover text:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
