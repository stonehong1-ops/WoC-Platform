import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs } from 'firebase/firestore';
import { groupService } from '@/lib/firebase/groupService';
import { socialService } from '@/lib/firebase/socialService';
import { venueService } from '@/lib/firebase/venueService';
import html2canvas from 'html2canvas-pro';
import ThemeMagazineA from './themes/ThemeMagazineA';
import ThemeMagazineB from './themes/ThemeMagazineB';
import ThemeMagazineC from './themes/ThemeMagazineC';
import ThemeMagazineD from './themes/ThemeMagazineD';
import { formatInstructorNames, formatCommunityName } from "@/app/social/constants/seoulRegions";
import { getDjDisplay } from "@/lib/utils/socialUtils";
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export interface CoverEvent {
  id: string;
  type: string;
  title: string;
  titleNative?: string;
  subtitle?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  imageUrl?: string;
  instructor?: string;
  originalStartDate?: Date;
  organizer?: string;
  dj?: string;
  groupName?: string;
  city?: string;
  seoulArea?: string;
}

const REGIONS = [
  { ko: '서울', en: 'SEOUL' },
  { ko: '부산', en: 'BUSAN' },
  { ko: '대구', en: 'DAEGU' },
  { ko: '인천', en: 'INCHEON' },
  { ko: '광주', en: 'GWANGJU' },
  { ko: '대전', en: 'DAEJEON' },
  { ko: '울산', en: 'ULSAN' },
  { ko: '경기', en: 'GYEONGGI' },
  { ko: '강원', en: 'GANGWON' },
  { ko: '제주', en: 'JEJU' },
];

export default function CoverEditor() {
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CoverEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // SNS Text Modal states
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [snsTextContent, setSnsTextContent] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const [selectedMilongaId, setSelectedMilongaId] = useState<string>('');
  const [selectedMilongaId2, setSelectedMilongaId2] = useState<string>('');
  const [selectedMilongaId3, setSelectedMilongaId3] = useState<string>('');
  const [selectedMilongaId4, setSelectedMilongaId4] = useState<string>('');
  const [selectedMilongaId5, setSelectedMilongaId5] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedPracticaId, setSelectedPracticaId] = useState<string>('');
  const [selectedBannerId, setSelectedBannerId] = useState<string>('');
  const [allBanners, setAllBanners] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]); // Default SEOUL

  const [previewScale, setPreviewScale] = useState(0.3);
  const [modalScale, setModalScale] = useState(0.35);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      // Fit inline preview with some padding
      if (w < 450) {
        setPreviewScale((w - 64) / 1080);
      } else {
        setPreviewScale(0.35);
      }
      // Fit modal preview to screen width
      setModalScale(w / 1080);
    }
  }, []);

  // Measure the height of the theme container for Theme C and Theme D
  useEffect(() => {
    if (!isPreviewModalOpen) return;
    
    // Delay slightly to allow rendering
    const timer = setTimeout(() => {
      const node = modalCaptureRef.current;
      if (node) {
        const innerScaled = node.querySelector('.scale-\\[3\\]') as HTMLElement | null;
        if (innerScaled) {
          // The visual height is offsetHeight * 3
          const actualHeight = innerScaled.offsetHeight * 3;
          setContentHeight(actualHeight);
        } else {
          setContentHeight('auto');
        }
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [isPreviewModalOpen, selectedTheme, targetDate, selectedMilongaId, selectedMilongaId2, selectedMilongaId3, selectedClassId, selectedPracticaId]);

  const captureRef = useRef<HTMLDivElement>(null);
  const modalCaptureRef = useRef<HTMLDivElement>(null);

  // Date parsers from TodayPageContent
  const parseDateStr = (date: any): string => {
    if (!date) return "";
    if (typeof date === "string") return date;
    if (date && typeof date.toDate === "function") {
      const d = date.toDate();
      return `${d.getFullYear().toString().slice(-2)}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return "";
  };

  const normalizeDateStr = (dStr: string): Date | null => {
    if (!dStr) return null;
    const normalized = dStr.replace(/[.\/]/g, "-").replace(/\s+/g, "");
    const parts = normalized.split("-");
    let y: string, m: string, d: string;
    if (parts.length >= 3) {
      y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
      m = parts[1].padStart(2, "0");
      d = parts[2].padStart(2, "0");
    } else if (parts.length === 2) {
      y = new Date().getFullYear().toString();
      m = parts[0].padStart(2, "0");
      d = parts[1].padStart(2, "0");
    } else {
      return null;
    }
    return new Date(`${y}-${m}-${d}T00:00:00`);
  };

  // Fetch events based on targetDate
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
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
          console.error("Failed to fetch classes", e);
        }

        setEvents(newEvents);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBanners = async () => {
      try {
        const q = collection(db, "events");
        const snap = await getDocs(q);
        const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const activeBanners = banners.filter((e: any) => {
          const t = Date.now();
          const end = e.endDate ? (typeof e.endDate.toDate === 'function' ? e.endDate.toDate().getTime() : new Date(e.endDate).getTime()) : t + 86400000;
          const isTango = !e.societyId || e.societyId === 'tango';
          return isTango && end >= t;
        }).sort((a: any, b: any) => {
          const aStart = a.startDate ? (typeof a.startDate.toDate === 'function' ? a.startDate.toDate().getTime() : new Date(a.startDate).getTime()) : 0;
          const bStart = b.startDate ? (typeof b.startDate.toDate === 'function' ? b.startDate.toDate().getTime() : new Date(b.startDate).getTime()) : 0;
          return aStart - bStart;
        });
        setAllBanners(activeBanners);
        if (activeBanners.length > 0 && !selectedBannerId) {
          setSelectedBannerId(activeBanners[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch banners", e);
      }
    };

    fetchEvents();
    fetchBanners();
  }, [targetDate]);

  const todaysEvents = events;
  
  const allMilongas = useMemo(() => {
    return todaysEvents.filter(e => e.type === 'milonga' || e.type === 'social');
  }, [todaysEvents]);
  const allClasses = useMemo(() => todaysEvents.filter(e => e.type === 'class'), [todaysEvents]);
  const allPracticas = useMemo(() => todaysEvents.filter(e => e.type === 'practice'), [todaysEvents]);

  // Randomize selection when target date changes
  useEffect(() => {
    if (allMilongas.length > 0) {
      const randomIds = [...allMilongas].sort(() => 0.5 - Math.random()).map(m => m.id);
      setSelectedMilongaId(randomIds[0] || '');
      setSelectedMilongaId2(randomIds[1] || '');
      setSelectedMilongaId3(randomIds[2] || '');
      setSelectedMilongaId4(randomIds[3] || '');
      setSelectedMilongaId5(randomIds[4] || '');
    } else {
      setSelectedMilongaId('');
      setSelectedMilongaId2('');
      setSelectedMilongaId3('');
      setSelectedMilongaId4('');
      setSelectedMilongaId5('');
    }

    if (allClasses.length > 0) {
      const randomId = allClasses[Math.floor(Math.random() * allClasses.length)].id;
      setSelectedClassId(randomId);
    } else {
      setSelectedClassId('');
    }

    if (allPracticas.length > 0) {
      const randomId = allPracticas[Math.floor(Math.random() * allPracticas.length)].id;
      setSelectedPracticaId(randomId);
    } else {
      setSelectedPracticaId('');
    }
  }, [targetDate, events]); // events is needed here to trigger on initial load

  const generateSnsText = () => {
    const daysKo = ['일', '월', '화', '수', '목', '금', '토'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // 1. Grouping logic
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
      
      // Default fallback to Hongdae for all other locations (기타 지역 없음)
      return { ko: '(서울 홍대)', en: '(Seoul Hongdae)', city: '서울', order: 1 };
    };

    const sortedEvents = [...events].sort((a, b) => {
      const aGroup = getRegionGroup(a);
      const bGroup = getRegionGroup(b);
      if (aGroup.order !== bGroup.order) return aGroup.order - bGroup.order;
      
      const typeOrder = { 'social': 1, 'milonga': 1, 'practice': 2, 'class': 3 };
      const aT = typeOrder[a.type as keyof typeof typeOrder] || 99;
      const bT = typeOrder[b.type as keyof typeof typeOrder] || 99;
      if (aT !== bT) return aT - bT;
      
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    let koText = `[오늘의 탱고 일정 - ${targetDate.getMonth() + 1}/${targetDate.getDate()} ${daysKo[targetDate.getDay()]}]\n\n`;
    let enText = `[Today's Tango Events - ${targetDate.getMonth() + 1}/${targetDate.getDate()} ${daysEn[targetDate.getDay()]}]\n\n`;

    let currentRegionKo = '';
    let currentMainCity = '';
    let currentType = '';

    sortedEvents.forEach((ev, idx) => {
      const regionGroup = getRegionGroup(ev);

      // 지역이 바뀌면 지역 헤더 출력
      if (regionGroup.ko !== currentRegionKo) {
        if (currentMainCity) {
          koText += `\n--------\n\n`;
          enText += `\n--------\n\n`;
        }
        koText += `📍${regionGroup.ko.replace(/[()]/g, '')}\n\n`;
        enText += `📍${regionGroup.en.replace(/[()]/g, '')}\n\n`;
        currentRegionKo = regionGroup.ko;
        currentMainCity = regionGroup.city;
        currentType = '';
      }

      let evTypeKo = '';
      let evTypeEn = '';
      if (ev.type === 'class') {
        evTypeKo = '- 클래스 -';
        evTypeEn = '- Class -';
      } else if (ev.type === 'practice') {
        evTypeKo = '- 쁘락띠까 -';
        evTypeEn = '- Practica -';
      } else if (ev.type === 'milonga' || ev.type === 'social') {
        evTypeKo = '- 밀롱가 -';
        evTypeEn = '- Milonga -';
      }

      if (evTypeKo !== currentType) {
        // 이전 타입 그룹이 있었으면 빈 줄로 구분
        if (currentType) {
          koText += `\n`;
          enText += `\n`;
        }
        koText += `${evTypeKo}\n`;
        enText += `${evTypeEn}\n`;
        currentType = evTypeKo;
      }

      const time = ev.startTime || '';
      const titleKo = ev.titleNative || ev.title;
      const titleEn = ev.title;
      
      if (ev.type === 'milonga' || ev.type === 'social') {
        const extraKo = [ev.organizer ? `org. ${ev.organizer}` : '', ev.dj ? `dj. ${ev.dj}` : ''].filter(Boolean).join(' / ');
        const extraEn = [ev.organizer ? `org. ${formatCommunityName(ev.organizer, 'EN')}` : '', ev.dj ? `dj. ${formatInstructorNames(ev.dj, 'EN')}` : ''].filter(Boolean).join(' / ');
        
        koText += `. ${titleKo} | ${time} | ${ev.location || '미정'}${extraKo ? ` (${extraKo})` : ''}\n`;
        enText += `. ${titleEn} | ${time} | ${formatCommunityName(ev.location || '', 'EN')}${extraEn ? ` (${extraEn})` : ''}\n`;
      } else if (ev.type === 'practice') {
        const extraKo = ev.organizer ? ` (${ev.organizer})` : '';
        const extraEn = ev.organizer ? ` (${formatCommunityName(ev.organizer, 'EN')})` : '';

        koText += `. ${titleKo} | ${time} | ${ev.location || '미정'}${extraKo}\n`;
        enText += `. ${titleEn} | ${time} | ${formatCommunityName(ev.location || '', 'EN')}${extraEn}\n`;
      } else if (ev.type === 'class') {
        const extraKo = ev.instructor ? ` | ${ev.instructor}` : '';
        const extraEn = ev.instructor ? ` | ${formatInstructorNames(ev.instructor, 'EN')}` : '';

        koText += `. ${titleKo} | ${time} | ${ev.location || '미정'}${extraKo}\n`;
        enText += `. ${titleEn} | ${time} | ${formatCommunityName(ev.location || '', 'EN')}${extraEn}\n`;
      }
    });

    const fullText = `${koText.trim()}\n\n---\n\n${enText.trim()}\n\n🔎 Find more info at woc.today!`;
    setSnsTextContent(fullText);
    setIsTextModalOpen(true);
  };

  const handleServerDownload = async () => {
    try {
      if (!modalCaptureRef.current) return;
      toast.loading("초고화질 이미지를 생성 중입니다...", { id: 'capture' });
      
      await new Promise(r => setTimeout(r, 300));
      
      const node = modalCaptureRef.current;

      // 1. Replace all img src with proxied URLs to bypass CORS for ALL external domains
      const images = Array.from(node.querySelectorAll('img'));
      const originalSrcs: { img: HTMLImageElement; src: string }[] = [];
      images.forEach(img => {
        const src = img.src;
        if (src && src.startsWith('http') && !src.startsWith(window.location.origin)) {
          originalSrcs.push({ img, src });
          img.src = `/api/proxy/image?url=${encodeURIComponent(src)}`;
        }
      });

      // 2. Wait for all images to fully load
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      // 3. Wait for fonts and rendering
      await document.fonts.ready;
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 500));

      // 4. Determine target node and scale option
      let targetNode: HTMLElement = node;
      let scaleOption = 2; // High quality for Theme A/B
      
      if (selectedTheme === 'C' || selectedTheme === 'D') {
        const innerScaled = node.querySelector('.scale-\\[3\\]') as HTMLElement | null;
        if (innerScaled) {
          targetNode = innerScaled;
          scaleOption = 3; // Capture 360px layout at 3x scale to produce 1080px width natively
        }
      }

      // 5. Capture using html2canvas-pro
      const canvas = await html2canvas(targetNode, {
        useCORS: true,
        allowTaint: false,
        scale: scaleOption,
        backgroundColor: '#f5f5f7',
        logging: false,
        onclone: (clonedDoc) => {
          if (selectedTheme === 'C' || selectedTheme === 'D') {
            // In the cloned doc, find the 360px container and remove its transform and absolute positioning
            // so it flows and renders natively at 360px, then scaled by html2canvas's scale option
            const clonedInner = clonedDoc.querySelector('.scale-\\[3\\]') as HTMLElement | null;
            if (clonedInner) {
              clonedInner.style.transform = 'none';
              clonedInner.style.position = 'relative';
              clonedInner.style.width = '360px';
              clonedInner.style.top = '0';
              clonedInner.style.left = '0';
            }
          } else {
            const clonedNode = clonedDoc.getElementById('woc-capture-container');
            if (clonedNode && clonedNode.parentElement) {
              // Reset parent modal scale transform
              clonedNode.parentElement.style.transform = 'none';
              clonedNode.parentElement.style.width = '1080px';
            }
          }
        }
      });

      // 6. Restore original image sources
      originalSrcs.forEach(({ img, src }) => {
        img.src = src;
      });

      // 7. Convert canvas to Blob using native toBlob (most reliable method)
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95)
      );

      if (!blob) {
        toast.error("이미지 생성에 실패했습니다 (Blob 변환 실패).", { id: 'capture' });
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = targetDate.toISOString().split('T')[0];
      link.download = `WOC_COVER_${dateStr}.jpg`;
      link.href = blobUrl;
      link.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success("이미지가 성공적으로 저장되었습니다.", { id: 'capture' });
    } catch (error: any) {
      console.error("Capture failed", error);
      toast.error(`이미지 생성에 실패했습니다: ${error?.message || error || '알 수 없는 오류'}`, { id: 'capture' });
    }
  };

  const selectedMilonga = allMilongas.find(e => e.id === selectedMilongaId) || null;
  const selectedMilonga2 = allMilongas.find(e => e.id === selectedMilongaId2) || null;
  const selectedMilonga3 = allMilongas.find(e => e.id === selectedMilongaId3) || null;
  const selectedMilonga4 = allMilongas.find(e => e.id === selectedMilongaId4) || null;
  const selectedMilonga5 = allMilongas.find(e => e.id === selectedMilongaId5) || null;
  const selectedClass = allClasses.find(e => e.id === selectedClassId) || null;
  const selectedPractica = allPracticas.find(e => e.id === selectedPracticaId) || null;
  const selectedBanner = allBanners.find(e => e.id === selectedBannerId) || null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Editor Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">설정</h2>
            <button
              onClick={generateSnsText}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">list_alt</span>
              모든 일정보기
            </button>
          </div>
          
          {/* Theme Selector */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">테마 스타일</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedTheme('A')}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                  selectedTheme === 'A' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Style A
              </button>
              <button 
                onClick={() => setSelectedTheme('B')}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                  selectedTheme === 'B' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Style B
              </button>
              <button 
                onClick={() => setSelectedTheme('C')}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                  selectedTheme === 'C' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Style C
              </button>
              <button 
                onClick={() => setSelectedTheme('D')}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                  selectedTheme === 'D' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Style D
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">기준 날짜</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]}
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split('-');
                  if (y && m && d) {
                    setTargetDate(new Date(parseInt(y), parseInt(m)-1, parseInt(d)));
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">지역</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                value={selectedRegion.ko}
                onChange={(e) => {
                  const reg = REGIONS.find(r => r.ko === e.target.value) || REGIONS[0];
                  setSelectedRegion(reg);
                }}
              >
                {REGIONS.map(reg => (
                  <option key={reg.ko} value={reg.ko}>{reg.ko}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">오늘의 밀롱가 1 (히어로)</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedMilongaId}
                onChange={(e) => setSelectedMilongaId(e.target.value)}
              >
                <option value="">밀롱가 선택 안함</option>
                {allMilongas.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">오늘의 밀롱가 2</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedMilongaId2}
                onChange={(e) => setSelectedMilongaId2(e.target.value)}
              >
                <option value="">밀롱가 선택 안함</option>
                {allMilongas.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">오늘의 밀롱가 3</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedMilongaId3}
                onChange={(e) => setSelectedMilongaId3(e.target.value)}
              >
                <option value="">밀롱가 선택 안함</option>
                {allMilongas.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">오늘의 밀롱가 4</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedMilongaId4}
                onChange={(e) => setSelectedMilongaId4(e.target.value)}
              >
                <option value="">밀롱가 선택 안함</option>
                {allMilongas.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">오늘의 밀롱가 5</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedMilongaId5}
                onChange={(e) => setSelectedMilongaId5(e.target.value)}
              >
                <option value="">밀롱가 선택 안함</option>
                {allMilongas.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">클래스 (랜덤 자동선택)</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">선택 안함</option>
                {allClasses.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">쁘락띠까 (랜덤 자동선택)</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedPracticaId}
                onChange={(e) => setSelectedPracticaId(e.target.value)}
              >
                <option value="">선택 안함</option>
                {allPracticas.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">하단 배너 이벤트</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={selectedBannerId}
                onChange={(e) => setSelectedBannerId(e.target.value)}
              >
                <option value="">배너 선택 안함</option>
                {allBanners.map(e => (
                  <option key={e.id} value={e.id}>{e.titleNative || e.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsPreviewModalOpen(true)}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">fullscreen</span>
          풀스크린 열기 (스크린샷용)
        </button>
      </div>

      {/* Preview Area (Hidden on Mobile as it takes too much space and is unreadable) */}
      <div 
        className="hidden lg:flex flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden justify-center py-10 shadow-inner relative cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => setIsPreviewModalOpen(true)}
      >
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-sm">zoom_in</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-[800px]">
            <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">autorenew</span>
          </div>
        ) : (
          <div 
            className="origin-top flex-shrink-0" 
            style={{ 
              transform: `scale(${previewScale})`, 
              height: (selectedTheme === 'C' || selectedTheme === 'D') ? 'auto' : 1920 * previewScale, 
              width: 1080 * previewScale 
            }}
          >
            {/* The actual capturing DOM */}
            <div 
              ref={captureRef} 
              className={`w-[1080px] shadow-2xl relative bg-white ${(selectedTheme === 'C' || selectedTheme === 'D') ? '' : 'h-[1920px]'}`}
            >
              {selectedTheme === 'A' ? (
                <ThemeMagazineA 
                  date={targetDate}
                  milonga={selectedMilonga}
                  milonga2={selectedMilonga2}
                  milonga3={selectedMilonga3}
                  milonga4={selectedMilonga4}
                  milonga5={selectedMilonga5}
                  tangoClass={selectedClass}
                  practica={selectedPractica}
                  allMilongas={allMilongas}
                  allClasses={allClasses}
                  allPracticas={allPracticas}
                  region={selectedRegion}
                  banner={selectedBanner}
                />
              ) : selectedTheme === 'B' ? (
                <ThemeMagazineB 
                  date={targetDate}
                  milonga={selectedMilonga}
                  milonga2={selectedMilonga2}
                  milonga3={selectedMilonga3}
                  milonga4={selectedMilonga4}
                  milonga5={selectedMilonga5}
                  tangoClass={selectedClass}
                  practica={selectedPractica}
                  allMilongas={allMilongas}
                  allClasses={allClasses}
                  allPracticas={allPracticas}
                  region={selectedRegion}
                  banner={selectedBanner}
                />
              ) : selectedTheme === 'C' ? (
                <ThemeMagazineC
                  date={targetDate}
                  allMilongas={allMilongas}
                  allClasses={allClasses}
                  allPracticas={allPracticas}
                  region={selectedRegion}
                  banner={selectedBanner}
                />
              ) : (
                <ThemeMagazineD
                  date={targetDate}
                  allMilongas={allMilongas}
                  allClasses={allClasses}
                  allPracticas={allPracticas}
                  region={selectedRegion}
                  banner={selectedBanner}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* SNS Text Modal */}
      {isTextModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col overflow-y-auto"
          onClick={() => setIsTextModalOpen(false)}
        >
          <div className="sticky top-0 right-0 w-full flex justify-end items-center gap-3 p-4 z-10 pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-5 py-2 pointer-events-auto transition-colors flex items-center gap-2 shadow-lg"
              onClick={(e) => { 
                e.stopPropagation(); 
                navigator.clipboard.writeText(snsTextContent);
                toast.success('텍스트가 복사되었습니다.');
              }}
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              텍스트 복사하기
            </button>
            <button 
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full w-10 h-10 flex items-center justify-center pointer-events-auto transition-colors shadow-lg"
              onClick={(e) => { e.stopPropagation(); setIsTextModalOpen(false); }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 flex justify-center pb-20 pt-2 px-4">
            <div 
              className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">list_alt</span>
                모든 일정보기
              </h3>
              <textarea 
                className="w-full h-[60vh] p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={snsTextContent}
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {isPreviewModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col overflow-y-auto"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div className="sticky top-0 right-0 w-full flex justify-end items-center gap-3 p-4 z-10 pointer-events-none">
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full px-5 py-2 pointer-events-auto transition-colors flex items-center gap-2 shadow-lg"
              onClick={(e) => { e.stopPropagation(); handleServerDownload(); }}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              서버 초고화질 저장
            </button>
            <button 
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full w-10 h-10 flex items-center justify-center pointer-events-auto transition-colors shadow-lg"
              onClick={(e) => { e.stopPropagation(); setIsPreviewModalOpen(false); }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 flex justify-center pb-20 pt-2">
            <div 
              className="origin-top flex-shrink-0"
              style={{ 
                transform: `scale(${modalScale})`, 
                height: (selectedTheme === 'C' || selectedTheme === 'D')
                  ? (contentHeight === 'auto' ? 'auto' : `${contentHeight * modalScale}px`)
                  : 1920 * modalScale, 
                width: 1080 * modalScale 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                id="woc-capture-container" 
                ref={modalCaptureRef} 
                className={`w-[1080px] shadow-2xl relative bg-white`}
                style={{
                  height: (selectedTheme === 'C' || selectedTheme === 'D')
                    ? (contentHeight === 'auto' ? 'auto' : `${contentHeight}px`)
                    : '1920px'
                }}
              >
                {selectedTheme === 'A' ? (
                  <ThemeMagazineA 
                    date={targetDate}
                    milonga={selectedMilonga}
                    milonga2={selectedMilonga2}
                    milonga3={selectedMilonga3}
                    milonga4={selectedMilonga4}
                    milonga5={selectedMilonga5}
                    tangoClass={selectedClass}
                    practica={selectedPractica}
                    allMilongas={allMilongas}
                    allClasses={allClasses}
                    allPracticas={allPracticas}
                    region={selectedRegion}
                    banner={selectedBanner}
                  />
                ) : selectedTheme === 'B' ? (
                  <ThemeMagazineB 
                    date={targetDate}
                    milonga={selectedMilonga}
                    milonga2={selectedMilonga2}
                    milonga3={selectedMilonga3}
                    milonga4={selectedMilonga4}
                    milonga5={selectedMilonga5}
                    tangoClass={selectedClass}
                    practica={selectedPractica}
                    allMilongas={allMilongas}
                    allClasses={allClasses}
                    allPracticas={allPracticas}
                    region={selectedRegion}
                    banner={selectedBanner}
                  />
                ) : selectedTheme === 'C' ? (
                  <ThemeMagazineC
                    date={targetDate}
                    allMilongas={allMilongas}
                    allClasses={allClasses}
                    allPracticas={allPracticas}
                    region={selectedRegion}
                    banner={selectedBanner}
                  />
                ) : (
                  <ThemeMagazineD
                    date={targetDate}
                    allMilongas={allMilongas}
                    allClasses={allClasses}
                    allPracticas={allPracticas}
                    region={selectedRegion}
                    banner={selectedBanner}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
