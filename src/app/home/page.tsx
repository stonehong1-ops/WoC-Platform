'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import GaviCartoonPopup from '@/components/home/GaviCartoonPopup';
import EventViewer from '@/components/events/EventViewer';
import UserProfilePopup from '@/components/profile/UserProfilePopup';
import ActivitySpotlight from '@/components/home/ActivitySpotlight';
import { eventService } from '@/lib/firebase/eventService';
import { userService } from '@/lib/firebase/userService';
import { venueService } from '@/lib/firebase/venueService';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where, addDoc } from 'firebase/firestore';
import { Event as EventType } from '@/types/event';
import { PlatformUser } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import societiesData from '../../../woc_societies_data.json';

import { getSafeStorageUrl } from '@/lib/utils/storageUtils';

// 공통 UI 컴포넌트 임포트
import SectionHeader from '@/components/common/SectionHeader';
import HorizontalScroller from '@/components/common/HorizontalScroller';
import BottomSheet from '@/components/common/BottomSheet';

export default function SocietyPage() {
  const { t, language, setLanguage } = useLanguage();

  const formatDate = (date: Date, formatType: string) => {
    try {
      if (formatType === 'dateOnly') {
        return date.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      return date.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatRelativeTime = (date: Date) => {
    try {
      const rtf = new Intl.RelativeTimeFormat(language === 'KR' ? 'ko-KR' : 'en', { numeric: 'auto' });
      const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (Math.abs(daysDifference) < 1) {
        const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
        if (Math.abs(hoursDifference) < 1) {
            const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));
            return rtf.format(minutesDifference, 'minute');
        }
        return rtf.format(hoursDifference, 'hour');
      }
      return rtf.format(daysDifference, 'day');
    } catch {
      return '';
    }
  };

  const getEventDateString = (evt?: EventType | null) => {
    const target = evt || heroEvent;
    if (!target || !target.startDate) return "2025. 8. 29(금) ~ 9. 1(월)";
    const start = typeof target.startDate.toDate === 'function' ? target.startDate.toDate() : new Date(target.startDate as any);
    const startStr = `${start.getFullYear()}. ${start.getMonth() + 1}. ${start.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][start.getDay()]})`;
    if (target.endDate) {
      const end = typeof target.endDate.toDate === 'function' ? target.endDate.toDate() : new Date(target.endDate as any);
      const endStr = start.getFullYear() === end.getFullYear()
        ? `${end.getMonth() + 1}. ${end.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][end.getDay()]})`
        : `${end.getFullYear()}. ${end.getMonth() + 1}. ${end.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][end.getDay()]})`;
      return `${startStr} ~ ${endStr}`;
    }
    return startStr;
  };

  const [isCartoonsOpen, setIsCartoonsOpen] = useState(false);
  const [twReady, setTwReady] = useState(false);
  const [heroEvent, setHeroEvent] = useState<EventType | null>(null);
  const [heroEvents, setHeroEvents] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [featuredUsers, setFeaturedUsers] = useState<PlatformUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSafeFloorOpen, setIsSafeFloorOpen] = useState(false);
  const [comingSoonCard, setComingSoonCard] = useState<{title: string; icon: string; desc: string; badge?: string} | null>(null);
  
  // Focus & Etiquette States
  const [focusContents, setFocusContents] = useState<any[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  
  const [etiquetteContents, setEtiquetteContents] = useState<any[]>([]);
  const [isEtiquetteOpen, setIsEtiquetteOpen] = useState(false);
  const [currentEtiquetteIndex, setCurrentEtiquetteIndex] = useState(0);

  const [music365Contents, setMusic365Contents] = useState<any[]>([]);
  const [isMusic365Open, setIsMusic365Open] = useState(false);
  const [currentMusic365Index, setCurrentMusic365Index] = useState(0);
  const [selectedSubcategory, setSelectedSubcategory] = useState<'music365' | 'best160' | 'mapofm'>('music365');
  const [isMusicSheetOpen, setIsMusicSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isTravelSheetOpen, setIsTravelSheetOpen] = useState(false);

  const [historyContents, setHistoryContents] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  const [travelContents, setTravelContents] = useState<any[]>([]);
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [currentTravelIndex, setCurrentTravelIndex] = useState(0);

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const [societyId, setSocietyId] = useState('tango');
  const [totalMembers, setTotalMembers] = useState<number>(2184);
  const [totalCities, setTotalCities] = useState<number>(27);
  const [weeklyNewMembers, setWeeklyNewMembers] = useState<number>(0);
  const [totalGroups, setTotalGroups] = useState<number>(63);
  const [totalCountries, setTotalCountries] = useState<number>(2);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('society');
    if (sId) {
      setSocietyId(sId);
      // Persist society context for cross-page navigation
      sessionStorage.setItem('woc_society', sId);
    }
  }, []);

  const societyInfo = societiesData.find((s: any) => s.id === societyId) || societiesData[0];

  // Fetch hero event from banners setting
  useEffect(() => {
    const fetchHeroEvent = async () => {
      try {
        const bannerDocRef = doc(db, 'settings', 'banners');
        const bannerSnap = await getDoc(bannerDocRef);
        
        let targetEventId = '';
        if (bannerSnap.exists()) {
          const data = bannerSnap.data();
          const ids: Record<string, string> = data.heroEventIds || {};
          targetEventId = ids[societyId] || data.heroEventId || '';
        }

        if (!targetEventId) {
          setHeroEvents([]);
          return;
        }

        const eventDocRef = doc(db, 'events', targetEventId);
        const eventSnap = await getDoc(eventDocRef);
        
        if (eventSnap.exists()) {
          const evt = { id: eventSnap.id, ...eventSnap.data() } as unknown as EventType;
          setHeroEvents([evt]);
          setHeroEvent(evt);
        } else {
          setHeroEvents([]);
        }
      } catch (err) {
        console.error('Error fetching banner hero event:', err);
        setHeroEvents([]);
      }
    };
    fetchHeroEvent();
  }, [societyId]);

  // Slider dot track
  useEffect(() => {
    const slider = document.getElementById('hero-slider');
    if (!slider) return;
    const handleScroll = () => {
      if (slider.offsetWidth > 0) {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth);
        setActiveDotIndex(index);
      }
    };
    slider.addEventListener('scroll', handleScroll, { passive: true });
    return () => slider.removeEventListener('scroll', handleScroll);
  }, [heroEvents]);

  // Fetch Focus Contents
  useEffect(() => {
    const fetchFocusContents = async () => {
      try {
        const q = query(
          collection(db, 'culture_contents'),
          where('category', '==', 'focus')
        );
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // focus 카테고리 시드 개별 무결성 동기화 (자가 치유 시딩)
        const hasSafeFloor = list.some((item: any) => item.title?.includes('Safe Floor'));
        const hasCabeceo = list.some((item: any) => item.title?.includes('Cabeceo'));
        const hasRonda = list.some((item: any) => item.title?.includes('Ronda'));

        let seeded = false;

        if (!hasSafeFloor) {
          const seedData = {
            category: 'focus',
            title: 'Safe Floor: Zero Tolerance Policy',
            titleNative: 'Safe Floor: 상호 존중 및 성희롱 제로 톨러런스 정책',
            keyword: 'ZERO TOLERANCE',
            keywordNative: '상호존중정책',
            description: 'We believe that every embrace should be built on mutual respect and absolute safety. Our community has no room for harassment of any kind.',
            descriptionNative: '탱고의 본질은 서로에 대한 깊은 존중과 신뢰 위에 세워진 포옹에 있습니다. 우리 커뮤니티는 어떠한 형태의 괴롭힘이나 위해도 용납하지 않습니다.',
            imageUrl: '/life_on_bg.jpg',
            imageUrls: ['/life_on_bg.jpg', 'https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800'],
            content: `Safe Floor: Zero Tolerance Policy

1. Respect the Embrace
Tango is a dance of intimacy and connection. This proximity requires an even higher level of respect and boundaries. Every dancer has the right to feel safe, respected, and in control of their own space.

2. Our Commitment
- Immediate Action: We take all reports seriously and act immediately to protect our members.
- Safe Environment: We foster a culture where everyone feels empowered to speak up.
- Zero Exceptions: Rules apply to everyone, regardless of status or skill level.

3. Let's Keep the Floor Safe Together
By participating in our events, you agree to uphold these standards of conduct.`,
            contentNative: `존중이 없는 곳에, 탱고는 존재할 수 없습니다.

1. 안전한 환경
최근 탱고 씬 내에서 발생하는 성 비위 및 괴롭힘 사건들은 우리가 소중히 여기는 이 춤의 근간을 흔들고 있습니다. 누군가의 고통 위에 피어나는 예술은 없습니다.

2. 안전한 포옹을 위한 우리의 약속
- 무관용 원칙: 성폭력, 성희롱 또는 원치 않는 물리적/언어적 괴롭힘이 확인될 경우, 지위나 직책에 관계없이 커뮤니티에서 즉각적이고 영구적인 제명 조치를 취할 것입니다.
- 피해자 연대 및 보호: 우리는 피해자의 목소리에 귀를 기울이고 2차 가해를 엄격히 금지합니다. 용기 있게 목소리를 낸 분들이 고립되지 않도록 끝까지 연대하겠습니다.
- 명확한 경계 존중: 누군가 거부 의사를 표현할 때, 그것은 즉시 받아들여져야 합니다. 탱고는 합의 하에 이루어지는 교감입니다.

3. 우리는 플로어를 다시 가장 안전한 곳으로 만들어야 합니다.
모두가 두려움 없이 눈을 맞추고 다시 완전한 신뢰 속에서 서로를 안을 수 있는 날을 위해 행동해 주십시오.`,
            order: 1,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          seeded = true;
        }

        if (!hasCabeceo) {
          const seedData = {
            category: 'focus',
            title: 'How to Cabeceo: The Etiquette of Glance & Connection',
            titleNative: '카베세오 하는 법: 눈빛과 교감의 에티켓',
            keyword: 'CABECEO',
            keywordNative: '카베세오',
            description: 'Tango begins not with a step, but with a gaze. Master the traditional Cabeceo etiquette.',
            descriptionNative: '탱고는 첫 걸음이 아니라, 서로 마주하는 첫 눈빛에서 시작됩니다. 전통적인 카베세오 에티켓을 마스터해 보세요.',
            imageUrl: 'https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800',
            imageUrls: ['https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800', '/life_on_bg.jpg'],
            content: `How to Cabeceo: The Etiquette of Glance & Connection

1. Glance Exchange (Mirada)
It starts by making eye contact with the partner you want to dance with.

2. Nod (Cabeceo)
Once eye contact is established, nod slightly or send a gaze to confirm the other person's consent.

3. Consent
If the partner responds with a smile or a nod, they agree to dance.`,
            contentNative: `탱고에서 까베세오(Cabeceo)는 말없이 눈빛과 고갯짓만으로 춤을 청하고 받아들이는 전통적인 에티켓이자 소통 방식입니다.

1. 까베세오의 기본 원리
- 시선 교환(미라다, Mirada): 춤을 추고 싶은 상대와 눈을 맞추는 것으로 시작합니다.
- 고갯짓(까베세오): 눈이 마주친 후, 살짝 고개를 끄덕이거나 눈빛을 보내 상대의 승낙을 확인합니다.
- 승낙: 상대방도 미소나 고갯짓으로 화답하면 춤을 추기로 한 것입니다.

2. 밀롱가에서의 실전 팁
- 거절 대신 못 본 척: 춤을 추고 싶지 않거나 상황이 여의치 않을 때는 자연스럽게 다른 곳을 바라보며 시선을 피하면 됩니다. 직접적인 거절의 민망함을 피할 수 있는 것이 까베세오의 큰 장점입니다.
- 상대 확인: 눈빛이 교환되었다고 확신하기 전까지는 함부로 자리에서 일어나지 않는 것이 좋습니다. 남자가 여자 앞으로 다가와 직접적으로 춤을 청할 때까지 기다리는 것이 정중합니다.`,
            order: 2,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          seeded = true;
        }

        if (!hasRonda) {
          const seedData = {
            category: 'focus',
            title: 'Milonga Ronda & Floor Manners Guidelines',
            titleNative: '밀롱가 론다와 플로어 매너 가이드라인',
            keyword: 'RONDA MANNER',
            keywordNative: '론다매너',
            description: 'Keep the flow of Ronda and respect the shared space for a safe tango experience.',
            descriptionNative: '밀롱가 플로어의 론다 흐름을 지키고, 안전한 탱고 감상을 위해 공유된 공간을 상호 존중하십시오.',
            imageUrl: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200',
            imageUrls: ['https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200'],
            content: `Milonga Ronda & Floor Manners Guidelines

1. Respect the Ronda Flow
Keep a safe distance from the couple in front of you and keep the counter-clockwise flow steady. Avoid walking backwards or blocking the flow with excessive moves.

2. Floor Manners
- Observe the flow even while waiting on the side.
- Avoid teaching or giving feedback while on the dance floor.`,
            contentNative: `서로의 즐겁고 안전한 춤을 위해 밀롱가 플로어에서 반드시 지켜야 할 론다와 매너 수칙입니다.

1. 론다(Ronda) 질서 지키기
- 시선을 마주하며 앞선 커플과의 안전 거리를 확보하고 시계 반대 방향의 흐름을 일정하게 유지합니다.
- 임의로 뒤로 걷거나 흐름을 가로막는 무리한 동작은 지양합니다.

2. 플로어 매너
- 춤을 추지 않는 대기 상태에서도 플로어의 전반적인 흐름을 바라보며 파악합니다.
- 플로어 위에서는 서로 동작을 가르치거나 피드백을 주는 행위를 삼가합니다.`,
            order: 3,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          seeded = true;
        }

        if (seeded) {
          const reSnap = await getDocs(q);
          list = reSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        list.sort((a: any, b: any) => {
          const orderA = a.order !== undefined ? a.order : 9999;
          const orderB = b.order !== undefined ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setFocusContents(list);
      } catch (err) {
        console.error('Error fetching focus contents:', err);
      }
    };
    fetchFocusContents();
  }, [isSafeFloorOpen]);

  // Fetch Etiquette Contents
  useEffect(() => {
    const fetchEtiquetteContents = async () => {
      try {
        const q = query(
          collection(db, 'culture_contents'),
          where('category', '==', 'etiquette')
        );
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (list.length === 0) {
          const etiquetteItems = [
            {
              order: 1,
              title: '1. How to Cabeceo',
              titleNative: '1. 까베세오 하는 법',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'The starting point of tango connection: Gaze and nod.',
              descriptionNative: '탱고 커넥션의 출발점: 시선 맞추기와 가벼운 고갯짓.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo4.jpg'
              ],
              content: 'Learn the basics of traditional invitation.',
              contentNative: '눈빛으로 춤을 청하고 답하는 전통적인 커뮤니케이션입니다.'
            },
            {
              order: 2,
              title: '2. Decline with Ignorance',
              titleNative: '2. 거절 대신 못본척',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Politely decline without direct embarrassment.',
              descriptionNative: '직접적인 민망함 없이 시선을 돌려 자연스럽게 청함을 사양해 보세요.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection4.jpg'
              ],
              content: 'A natural way to skip a tanda.',
              contentNative: '눈을 마주치지 않고 딴 곳을 봄으로써 정중하고 깔끔하게 춤 신청을 패스할 수 있습니다.'
            },
            {
              order: 3,
              title: '3. Do Not Stand Up First',
              titleNative: '3. 먼저 일어나지 마세요',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Wait for direct confirmation before standing up.',
              descriptionNative: '시선이 완벽하게 확인되어 남자가 다가올 때까지 차분히 앉아서 기다리는 매너.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand4.jpg'
              ],
              content: 'Prevent awkward mistakes.',
              contentNative: '섣불리 먼저 일어나면 옆 사람에게 청한 시선과 꼬여서 서로 민망한 상황이 생길 수 있습니다.'
            },
            {
              order: 4,
              title: '4. How to Avoid Awkwardness',
              titleNative: '4. 민망함을 피하는 법',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Keep the distance and confirm step-by-step.',
              descriptionNative: '눈빛이 100% 매칭될 때까지 천천히 단계를 밟아가며 확인하는 습관.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward4.jpg'
              ],
              content: 'Safety measures for connection.',
              contentNative: '정확한 교감 신호를 통해 불필요한 마찰을 줄이고 모두가 기분 좋은 밀롱가를 만드는 지혜.'
            },
            {
              order: 5,
              title: '5. Next Time, Not Now',
              titleNative: '5. 지금 말고 나중에',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Let them know you want to dance later.',
              descriptionNative: '지금은 휴식이 필요하지만, 다음 탄다에는 기쁘게 함께 춤출 것을 넌지시 표시하기.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda4.jpg'
              ],
              content: 'Manage your energy and connections.',
              contentNative: '체력이 다했거나 아끼고 싶을 때는 다음 기회를 암시하며 상대를 존중하며 사양합니다.'
            },
            {
              order: 6,
              title: '6. The Perfect Angle',
              titleNative: '6. 바로 이 각도',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Perfect line of sight for Cabeceo.',
              descriptionNative: '상대방의 론다와 시야각을 배려해 시선이 가장 편안하게 닿을 수 있는 완벽한 각도 찾기.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle4.jpg'
              ],
              content: 'Angle of interaction.',
              contentNative: '시선이 마주하기 편하도록 몸의 방향이나 각도를 자연스럽게 매만지는 숨은 에티켓 스펙.'
            },
            {
              order: 7,
              title: '7. Too Much Pressure',
              titleNative: '7. 너무 부담스러워요',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Avoid staring or forcing connections.',
              descriptionNative: '부담스러운 뚫어질 듯한 응시나 춤을 강요하는 시선은 상대에게 불편을 줍니다.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada4.jpg'
              ],
              content: 'Respect personal space.',
              contentNative: '음근하고 자연스러운 시선이 아닌, 레이저를 쏘듯 쳐다보는 강압적인 미라다는 피해야 합니다.'
            },
            {
              order: 8,
              title: '8. This Moment, You',
              titleNative: '8. 이 순간, 바로 당신',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Finding the exact connection partner.',
              descriptionNative: '수많은 밀롱가의 군중 속에서 서로의 파동과 눈빛이 단 한 번에 일치되는 감동의 찰나.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person4.jpg'
              ],
              content: 'The magic connection of gaze.',
              contentNative: '서로가 원하는 춤의 주파수가 맞아떨어지는 아름다운 밀롱가의 순간을 선사합니다.'
            },
            {
              order: 9,
              title: '9. Power of Positivity',
              titleNative: '9. 긍정의 힘!',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Keep smiling and enjoy the waiting.',
              descriptionNative: '지금 당장 춤을 추지 않더라도, 플로어를 감상하며 다음 기회를 즐겁게 준비하는 여유.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting4.jpg'
              ],
              content: 'Patience and smile.',
              contentNative: '밀롱가에 앉아있는 대기 시간조차 음악을 듣고 교류를 기쁘게 여기는 긍정의 마인드.'
            },
            {
              order: 10,
              title: '10. Ronda Guardians',
              titleNative: '10. 여자는 론다 지키미',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Observe and respect Ronda from the seats.',
              descriptionNative: '춤을 직접 추지 않더라도, 플로어 론다의 흐름과 공간을 소중히 지키고 관찰하는 안목.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe4.jpg'
              ],
              content: 'Protect the flow of tango floor.',
              contentNative: '자리에 앉아 흐름을 면밀히 바라봄으로써, 플로어 위 댄서들이 완전한 신뢰 속에서 춤추게 돕습니다.'
            },
            {
              order: 11,
              title: '11. Glasses',
              titleNative: '11. 안경',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Slight helper for clear gaze connection.',
              descriptionNative: '시력이 좋지 않다면 예쁜 안경이나 렌즈로 상대의 시선과 표정을 더욱 선명히 인식하기.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses4.jpg'
              ],
              content: 'Clear vision for connection.',
              contentNative: '눈이 마주쳤을 때 오해나 착오를 줄여주며, 눈 맞춤의 교감 감각을 정교하게 돕습니다.'
            },
            {
              order: 12,
              title: '12. What Style Do You Prefer?',
              titleNative: '12. 어떤 스타일을 좋아하세요?',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Recognize preferences and dance styles.',
              descriptionNative: '밀롱가에 모인 다양한 댄서들의 취향과 개성을 폭넓게 마주하고 기쁘게 소통하는 방법.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way4.jpg'
              ],
              content: 'Enjoy diversity on the floor.',
              contentNative: '각자 지닌 춤의 선율과 깊이를 편견 없이 존중하며 서로의 아브라소를 나누어 보세요.'
            }
          ];

          for (const item of etiquetteItems) {
            await addDoc(collection(db, 'culture_contents'), {
              ...item,
              category: 'etiquette',
              imageUrl: item.imageUrls[0],
              createdAt: new Date()
            });
          }

          const reSnap = await getDocs(q);
          list = reSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        list.sort((a: any, b: any) => {
          const orderA = a.order !== undefined ? a.order : 9999;
          const orderB = b.order !== undefined ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setEtiquetteContents(list);
      } catch (err) {
        console.error('Error fetching etiquette contents:', err);
      }
    };
    fetchEtiquetteContents();
  }, [isEtiquetteOpen]);

  // Fetch Music365 Contents
  useEffect(() => {
    const fetchMusic365Contents = async () => {
      try {
        const q = query(
          collection(db, 'culture_contents'),
          where('category', '==', 'music365')
        );
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        list.sort((a: any, b: any) => {
          const idxA = a.index !== undefined ? a.index : 9999;
          const idxB = b.index !== undefined ? b.index : 9999;
          return idxA - idxB;
        });

        setMusic365Contents(list);
      } catch (err) {
        console.error('Error fetching music365 contents:', err);
      }
    };
    if (isMusic365Open) {
      fetchMusic365Contents();
    }
  }, [isMusic365Open]);

  // Fetch History Contents
  useEffect(() => {
    const fetchHistoryContents = async () => {
      try {
        const q = query(
          collection(db, 'culture_contents'),
          where('category', '==', 'history')
        );
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (list.length === 0) {
          const seedData = {
            category: 'history',
            order: 1,
            title: '1. Tango History Prologue',
            titleNative: '1. 땅고의 역사 프롤로그',
            keyword: 'HISTORY',
            keywordNative: '역사',
            description: '¡Tango! - The Dance, the Song, the Story Book Review and Translation Prologue.',
            descriptionNative: '런던 출판사 Thames and Hudson의 명저 <¡Tango! - The Dance, the Song, the Story> 요약 번역 연재를 개시합니다.',
            imageUrl: 'https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg',
            imageUrls: [
              'https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg'
            ],
            content: `¡Tango! - The Dance, the Song, the Story Book Review

We review Simon Collier, Artemis Cooper, María Susana Azzi, and Richard Martin's historical record on Argentine Tango.`,
            contentNative: `작년 말쯤, 런던의 출판사 Thames and Hudson에서 1995년에 나온 책, <¡Tango! - The Dance, the Song, the Story>를 한예종 도서관에서 빌렸습니다.

코로나로 집콕이 일상이 된 김에 이번엔 꼭 완독하리라 마음 먹고 열심히 읽었습니다.
땅고를 즐기고, 땅고에 종사하는(?) 사람으로서, 땅고의 역사에 대해 좀 권위있는 자료를 가지고 제대로 공부를 좀 해야겠다는 생각을 항상 가졌었기에, 약간은 숙제를 하는 기분이 있긴 했습니다.
그래서 처음엔 페이지가 좀 안 넘어갔는데, 읽다 보니 이게 또 예사롭지 않게 재미있더군요.

끝까지 다 읽고 나니, 이렇게 한 번 읽고 잊어버리면 아까울 것 같은 생각이 들어 다시 한 번 읽으며 찬찬히 내용을 정리해봐야겠다 싶었습니다.
그렇게 다시 읽노라니 이걸 혼자 읽기가 아깝다는 생각이 또 들었습니다.
그래서 번역을 시작했습니다. word by word로 완역을 한다는 느낌은 아니고, 최대한 촘촘하게 요약 정리한다는 느낌으로.
일단 번역이 대충 끝나서 연재를 시작하려 합니다. 조금씩 쪼개서 하루 이틀 간격으로 야금야금 올리려고 해요.

본격적인 포스팅에 앞서 미리 밝혀두고자 하는 점이 몇 가지 있습니다.
- 이제부터 <땅고의 역사>라는 제목으로 올리는 연재의 내용은 위에서 밝힌 바와 같이, Thames and Hudson 출판사에서 1995년에 발간한 <¡Tango! - The Dance, the Song, the Story>라는 책의 내용을 한글로 요약, 정리, 가공한 것입니다.
- 아래 목차를 보면 나오듯 이 책은 Simon Collier, Artemis Cooper, María Susana Azzi, Richard Martin 이렇게 4명의 공저자가 한 챕터씩을 맡아 썼습니다. 각 챕터의 주제는 순서대로 보면 땅고의 탄생 - 유럽에서의 땅고 유행 - 땅고의 황금기 - 문화로서의 땅고 이렇게 되는데, 안타깝지만 네 번째 챕터는 개인적으로 영 마음에 들지 않아서 번역/정리에서 제외했습니다.
- 일반적으로 쓰이는 '탱고'가 아닌 '땅고'로 표기하는 것을 선택한 이유는, 원래 이름이 '땅고'이기 때문이지, 다른 이유가 아닙니다. 외국어 표기는 각 언어의 원어 발음을 최대한 존중하려고 노력했습니다.
- 노래나 영화 등의 작품 제목, 중요한 인물 이름 등은 한글을 병기하고 원어에는 볼드와 이탤릭을 먹여 눈에 띄게 표시했습니다.
- 글의 맥락에 따라 이해를 돕기 위해서나 감칠맛을 더하기 위해 책에 실리지 않은 이미지나 동영상 같은 것이 추가될 수도 있겠습니다.

자 그럼 ¡Vamos!`,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          const reSnap = await getDocs(q);
          list = reSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        list.sort((a: any, b: any) => {
          const orderA = a.order !== undefined ? a.order : 9999;
          const orderB = b.order !== undefined ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setHistoryContents(list);
      } catch (err) {
        console.error('Error fetching history contents:', err);
      }
    };
    fetchHistoryContents();
  }, [isHistoryOpen]);

  // Fetch Travel Contents
  useEffect(() => {
    const fetchTravelContents = async () => {
      try {
        const q = query(
          collection(db, 'culture_contents'),
          where('category', '==', 'travel')
        );
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (list.length === 0) {
          const seedData = {
            category: 'travel',
            order: 1,
            title: '1. 2026 Beijing Select Tango Weekend',
            titleNative: '1. 2026 북경 셀렉트 땅고 위켄드',
            keyword: 'TRAVEL',
            keywordNative: '여행',
            description: "Beto Kim's travel diary and settlement on 2026 Beijing Select Tango Weekend.",
            descriptionNative: '2026 북경 셀렉트 땅고 위켄드(6.19.~6.22.) 여행 후기 및 가계부 정산 스크린샷 이미지와 함께 수기를 공유합니다.',
            imageUrl: '/travel_beijing1.png',
            imageUrls: ['/travel_beijing1.png'],
            content: `2026 Beijing Select Tango Weekend (June 19 - June 22) Travel Diary and Bill Settlement.`,
            contentNative: `2026 북경 셀렉트 땅고 위겐드 (6.19. ~ 6.22.)

1. 두번째 참여하는 행사 처음보다 훨씬 분위기가 좋아졌음
2. 개별 밀롱가 판매해서 였는지는 모르지만 저녁밀에는 북경 친구들이 많이 옴
3. 금요일 로컬 갔는데 라가 없음(행사장으로 돌아오니 다들 행사장에 있음 ㅋㅋㅋ)
4. 토요일 바넷사&파쿤도 공연이 다른 곳에 있어서 감(북경 첫 방문, 밀롱가비 겁나 비쌈)
5. 공연 보러 간거 나는 좋았는데 같이 가신분한테는 엄청 미안하게 됨(까칠한 친구들~~)
6. 토요일 행사장 돌아와서 뒷풀이 감(아침 6시까지 ~~~~남자들의 수다란)
7. 일요일 별도의 공간으로 버스를 한시간 타고 이동해서 저녁먹고 밀롱가를 함(한국인이 80%)
8. 양 한마리, 새끼돼지 통구이가 제공됨 정말 정말 맛있는데 많이 먹지 못함(사람이 많아)
그래도 양꼬치가 무한 제공 되고 음식도 많았음
9. 6월 주말 마다 행사가 있었는데 중국친구중에 난징, 청두, 북경 3곳을 다간 친구도 있고 청두 갔다가 북경 온 친구들이 꽤 있었음
10. 몇몇 새로운 라들을 만나서 춤추었고 중국 친구가 데려간 처음가본 식당과 마오타이주가 아주 좋았음`,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          const reSnap = await getDocs(q);
          list = reSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        list.sort((a: any, b: any) => {
          const orderA = a.order !== undefined ? a.order : 9999;
          const orderB = b.order !== undefined ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setTravelContents(list);
      } catch (err) {
        console.error('Error fetching travel contents:', err);
      }
    };
    fetchTravelContents();
  }, [isTravelOpen]);

  // Fetch featured users (instructors)
  useEffect(() => {
    userService.getInstructors().then((users) => {
      const instructors = users.sort((a, b) => a.nickname.localeCompare(b.nickname));
      setFeaturedUsers(instructors);
    }).catch(console.error);
  }, []);

  // Fetch statistics dynamically with single doc cache and fallback self-healing
  useEffect(() => {
    async function loadStats() {
      try {
        const statsDocRef = doc(db, 'settings', 'stats');
        const statsSnap = await getDoc(statsDocRef);
        
        const now = Date.now();
        if (statsSnap.exists()) {
          const statsData = statsSnap.data();
          const updatedAt = statsData.updatedAt || 0;
          
          // 24 hours cache validity
          if (now - updatedAt < 86400000) {
            setTotalGroups(statsData.totalGroups || 63);
            setTotalMembers(statsData.totalMembers || 2184);
            setWeeklyNewMembers(statsData.weeklyNewMembers || 0);
            setTotalCities(statsData.totalCities || 27);
            setTotalCountries(statsData.totalCountries || 2);
            return;
          }
        }
        
        // Background scan & update cache if expired or missing
        const [groupsSnap, users, venues] = await Promise.all([
          getDocs(collection(db, 'groups')),
          userService.getAllUsers(),
          venueService.getVenues()
        ]);
        
        const gCount = groupsSnap.size;
        const mCount = users.length + 50;
        
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        let newCount = 0;
        users.forEach((u) => {
          let userTime = null;
          if (u.createdAt) {
            if (u.createdAt.seconds !== undefined) {
              userTime = u.createdAt.seconds * 1000;
            } else if (typeof u.createdAt === 'number') {
              userTime = u.createdAt;
            } else if (typeof u.createdAt.toDate === 'function') {
              userTime = u.createdAt.toDate().getTime();
            } else if (typeof u.createdAt === 'string') {
              userTime = new Date(u.createdAt).getTime();
            }
          }
          if (userTime && userTime >= sevenDaysAgo) {
            newCount++;
          }
        });
        
        const citiesSet = new Set<string>();
        const countriesSet = new Set<string>();
        const activeVenues = venues.filter(v => v.status === 'active');
        
        activeVenues.forEach((venue) => {
          if (venue.city) {
            const cityNorm = venue.city.trim().toUpperCase();
            const countryNorm = (venue.country || '').trim().toUpperCase();
            const isKorea = countryNorm === 'KOREA' || countryNorm === 'SOUTH KOREA' || countryNorm === 'SOUTH_KOREA';
            const isShanghai = cityNorm === 'SHANGHAI' || venue.city.includes('상하이');
            if (isKorea || isShanghai) {
              citiesSet.add(cityNorm);
            }
          }
          if (venue.country) {
            let countryNorm = venue.country.trim().toUpperCase();
            if (countryNorm === 'KOREA' || countryNorm === 'SOUTH_KOREA') {
              countryNorm = 'SOUTH KOREA';
            }
            countriesSet.add(countryNorm);
          }
        });
        
        // 가입 회원들의 국가코드 추가 합산
        users.forEach((u) => {
          if (u.countryCode) {
            let countryNorm = u.countryCode.trim().toUpperCase();
            if (countryNorm === 'KR' || countryNorm === 'KOREA' || countryNorm === 'SOUTH_KOREA') {
              countryNorm = 'SOUTH KOREA';
            } else if (countryNorm === 'SG' || countryNorm === 'SINGAPORE') {
              countryNorm = 'SINGAPORE';
            } else if (countryNorm === 'US' || countryNorm === 'USA' || countryNorm === 'UNITED STATES') {
              countryNorm = 'UNITED STATES';
            } else if (countryNorm === 'CN' || countryNorm === 'CHINA') {
              countryNorm = 'CHINA';
            } else if (countryNorm === 'AU' || countryNorm === 'AUSTRALIA') {
              countryNorm = 'AUSTRALIA';
            }
            countriesSet.add(countryNorm);
          }
        });
        
        const cCount = citiesSet.size || 27;
        const coCount = countriesSet.size || 3;
        
        setTotalGroups(gCount);
        setTotalMembers(mCount);
        setWeeklyNewMembers(newCount);
        setTotalCities(cCount);
        setTotalCountries(coCount);
        
        // Update stats cache
        const { setDoc } = await import('firebase/firestore');
        await setDoc(statsDocRef, {
          totalGroups: gCount,
          totalMembers: mCount,
          weeklyNewMembers: newCount,
          totalCities: cCount,
          totalCountries: coCount,
          updatedAt: now
        }, { merge: true });
        
      } catch (err) {
        console.error("Error loading stats dynamically:", err);
      }
    }
    loadStats();
  }, []);

  // Force Tailwind CDN re-process on client-side navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).tailwind) {
      setTwReady(true);
      const evt = new window.Event('tailwind:refresh');
      document.dispatchEvent(evt);
      document.documentElement.classList.add('tw-refresh');
      requestAnimationFrame(() => document.documentElement.classList.remove('tw-refresh'));
    }
  }, []);

  return (
    <>
      {/* Tailwind CDN - loaded via Next.js Script for proper lifecycle management */}
      <Script
        src="https://cdn.tailwindcss.com?plugins=forms,container-queries"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as any).tailwind) {
            (window as any).tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    'surface-container': '#f2ecf4',
                    'outline': '#7a7582',
                    'on-secondary-fixed-variant': '#4b4263',
                    'on-error-container': '#93000a',
                    'on-primary-fixed': '#22005d',
                    'background': '#fdf7ff',
                    'inverse-surface': '#322f35',
                    'surface-bright': '#fdf7ff',
                    'on-secondary-container': '#645a7d',
                    'primary-container': '#6750a4',
                    'on-surface-variant': '#494551',
                    'tertiary-container': '#c9a74d',
                    'secondary': '#63597c',
                    'error-container': '#ffdad6',
                    'on-secondary-fixed': '#1f1635',
                    'on-tertiary-container': '#503d00',
                    'outline-variant': '#cbc4d2',
                    'surface': '#fdf7ff',
                    'on-tertiary': '#ffffff',
                    'on-background': '#1d1b20',
                    'tertiary-fixed': '#ffdf93',
                    'inverse-on-surface': '#f5eff7',
                    'on-primary': '#ffffff',
                    'inverse-primary': '#cfbcff',
                    'surface-container-lowest': '#ffffff',
                    'surface-container-highest': '#e6e0e9',
                    'on-surface': '#1d1b20',
                    'tertiary-fixed-dim': '#e7c365',
                    'on-tertiary-fixed-variant': '#594400',
                    'secondary-container': '#e1d4fd',
                    'primary': '#004190',
                    'surface-tint': '#6750a4',
                    'error': '#ba1a1a',
                    'secondary-fixed': '#e9ddff',
                    'on-primary-container': '#e0d2ff',
                    'surface-container-low': '#f8f2fa',
                    'on-primary-fixed-variant': '#4f378a',
                    'secondary-fixed-dim': '#cdc0e9',
                    'surface-dim': '#ded8e0',
                    'primary-fixed': '#e9ddff',
                    'on-error': '#ffffff',
                    'on-secondary': '#ffffff',
                    'tertiary': '#765b00',
                    'on-tertiary-fixed': '#241a00',
                    'surface-variant': '#e6e0e9',
                    'primary-fixed-dim': '#cfbcff',
                    'surface-container-high': '#ece6ee',
                  },
                  borderRadius: { DEFAULT: '4px', lg: '8px', xl: '12px', full: '24px' },
                  spacing: {
                    page_margin: '24px', section_gap: '40px', element_gap: '16px',
                    component_padding_x: '16px', component_padding_y: '12px',
                  },
                  fontFamily: {
                    'body-lg': ['Inter'], 'label-md': ['Inter'],
                    'headline-md': ['Plus Jakarta Sans'], 'headline-lg': ['Plus Jakarta Sans'],
                    'display-lg': ['Plus Jakarta Sans'], 'body-md': ['Inter'],
                    'label-sm': ['Inter'], 'title-lg': ['Plus Jakarta Sans'],
                  },
                  fontSize: {
                    'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '500' }],
                    'label-md': ['14px', { lineHeight: '1.2', fontWeight: '600' }],
                    'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '800' }],
                    'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '800' }],
                    'display-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
                    'body-md': ['16px', { lineHeight: '1.6', fontWeight: '500' }],
                    'label-sm': ['12px', { lineHeight: '1.2', fontWeight: '500' }],
                    'title-lg': ['20px', { lineHeight: '1.4', fontWeight: '700' }],
                  },
                },
              },
            };
            setTwReady(true);
          }
        }}
      />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className={`bg-background text-on-background antialiased font-body-md w-full relative transition-opacity duration-500 ${twReady ? 'opacity-100' : 'opacity-0'}`}>
        {!twReady && (
          <div className="fixed inset-0 z-[9999] bg-[#fdf7ff] flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-[#004190]/10 border-t-[#004190] animate-spin"></div>
            <p className="mt-4 font-label-sm text-[12px] text-slate-500 uppercase tracking-widest animate-pulse">Tango Society</p>
          </div>
        )}

        {/* Thin Event Banner (Upcoming Hero) */}
        {heroEvents.length > 0 && (() => {
          const evt = heroEvents[0];
          return (
            <div className="max-w-7xl mx-auto px-page_margin pt-6">
              <div 
                onClick={() => {
                  setSelectedEvent(evt);
                  setIsEventDetailOpen(true);
                }}
                className="relative w-full h-36 md:h-44 rounded-2xl overflow-hidden shadow-sm group block cursor-pointer"
              >
                <img 
                  alt={evt.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  src={evt.imageUrl || "/slide4_bg_cinematic.jpg"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-5 text-left">
                  <h1 className="text-white font-headline text-lg md:text-2xl font-black tracking-tight mb-2 uppercase leading-tight line-clamp-1">
                    {language === 'KR' && evt.titleNative ? evt.titleNative : evt.title}
                  </h1>
                  
                  {/* Event Meta info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-white/70">calendar_today</span>
                      <span>{getEventDateString(evt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-white/70">location_on</span>
                      <span>{evt.venueName || evt.location || "서울"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-white/70">person</span>
                      <span>{language === 'KR' && evt.hostNameNative ? evt.hostNameNative : evt.hostName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <main className="max-w-7xl mx-auto px-page_margin py-section_gap space-y-section_gap">
          {/* 오늘의 하이라이트 */}
          <ActivitySpotlight />

          {/* Culture & Canvas */}
          <section className="space-y-4">
            <SectionHeader 
              title={t('home.culture_canvas')}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Large Spotlight Card: 동적 포커스 바인딩 */}
              {(() => {
                const defaultFocus = {
                  id: 'default_safe_floor',
                  category: 'focus',
                  title: 'Safe Floor: Zero Tolerance Policy',
                  titleNative: 'Safe Floor: 상호 존중 및 성희롱 제로 톨러런스 정책',
                  keyword: 'ZERO TOLERANCE',
                  keywordNative: '상호존중정책',
                  description: 'Reaffirming our strict zero-tolerance policy against sexual harassment',
                  descriptionNative: 'WoC 커뮤니티는 어떠한 형태의 성희롱이나 괴롭힘도 용납하지 않습니다.',
                  imageUrl: '/life_on_bg.jpg',
                  content: 'Default policy content...',
                  createdAt: { seconds: Date.now() / 1000 }
                };

                const activeFocus = focusContents[0] || defaultFocus;

                // 3일 내 등록 여부 판별
                const isNewContent = (item: any) => {
                  if (!item || !item.createdAt) return false;
                  let time = 0;
                  if (typeof item.createdAt.toDate === 'function') {
                    time = item.createdAt.toDate().getTime();
                  } else if (item.createdAt.seconds) {
                    time = item.createdAt.seconds * 1000;
                  } else {
                    time = new Date(item.createdAt).getTime();
                  }
                  return Date.now() - time < 3 * 24 * 60 * 60 * 1000;
                };

                const resolvedKeyword = language === 'KR' && activeFocus.keywordNative ? activeFocus.keywordNative : activeFocus.keyword;
                const resolvedTitle = language === 'KR' && activeFocus.titleNative ? activeFocus.titleNative : activeFocus.title;
                const resolvedDesc = language === 'KR' && activeFocus.descriptionNative ? activeFocus.descriptionNative : activeFocus.description;

                return (
                  <div 
                    className="col-span-2 row-span-2 relative h-[360px] md:h-[480px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                    onClick={() => {
                      setCurrentFocusIndex(0);
                      setIsSafeFloorOpen(true);
                    }}
                  >
                    <img 
                      alt={resolvedTitle} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      src={getSafeStorageUrl(activeFocus.imageUrl || '/life_on_bg.jpg')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-left">
                      <span className="absolute top-4 left-4 z-10 bg-[#6750A4] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">FOCUS</span>
                      
                      {/* 3일 내 등록된 새 글이 리스트에 있으면 NEW 뱃지 노출 */}
                      {focusContents.some(item => isNewContent(item)) && (
                        <span className="absolute top-4 right-4 z-10 bg-[#FF2D55] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wide shadow-md animate-pulse">NEW</span>
                      )}

                      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                        {resolvedKeyword}
                      </span>
                      <h3 className="text-white font-bold text-2xl mb-2 line-clamp-2">
                        {resolvedTitle}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed max-w-md line-clamp-3">
                        {resolvedDesc}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Card 1: 가비의 탱고툰 */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => setIsCartoonsOpen(true)}
              >
                <span className="absolute top-4 left-4 z-10 bg-indigo-500/90 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">새 글</span>
                <img alt="가비의 탱고툰" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/gavi.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">가비의 탱고툰</h4>
                </div>
              </div>

              {/* Card 1.5: 밀롱가 에티켓 (신설) */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => {
                  setCurrentEtiquetteIndex(0);
                  setIsEtiquetteOpen(true);
                }}
              >
                <span className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">6월호</span>
                <img 
                  alt="밀롱가 에티켓" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src="https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">밀롱가 에티켓</h4>
                </div>
              </div>

              {/* Card 2: 탱고뮤직 365 */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => {
                  setCurrentMusic365Index(0);
                  setIsMusic365Open(true);
                }}
              >
                <span className="absolute top-4 left-4 z-10 bg-emerald-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">TODAY</span>
                <img alt="탱고뮤직 365" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/camus.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">탱고뮤직 365</h4>
                </div>
              </div>

              {/* Card 3: 베토의 탱고여행 */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => {
                  setCurrentTravelIndex(0);
                  setIsTravelOpen(true);
                }}
              >
                <span className="absolute top-4 left-4 z-10 bg-amber-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">업데이트됨</span>
                <img alt="베토의 탱고여행" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/beto.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">베토의 탱고여행</h4>
                </div>
              </div>

              {/* Card 4: 탱고의 역사 리뷰 */}
              <div 
                className="col-span-2 md:col-span-4 relative h-[120px] md:h-[160px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => {
                  setCurrentHistoryIndex(0);
                  setIsHistoryOpen(true);
                }}
              >
                <span className="absolute top-4 left-4 z-10 bg-rose-600/95 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">이번 주</span>
                <img alt="탱고의 역사 리뷰" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/ddakji.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-left">
                  <h4 className="text-white font-bold text-lg md:text-2xl">탱고의 역사 리뷰</h4>
                </div>
              </div>
            </div>
          </section>

          {/* People — Dynamic from Firestore */}
          <section className="space-y-4">
            <SectionHeader 
              title="알아야 할 사람들"
              actionLabel={t('home.view_all') || '전체 보기'}
              href="/people"
            />
            
            <HorizontalScroller>
              {featuredUsers.length > 0 ? (
                featuredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => setSelectedUserId(user.id)} 
                    className="flex-shrink-0 text-center w-28 md:w-32 group cursor-pointer"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1 bg-slate-50 mx-auto">
                      <img 
                        alt={user.nickname} 
                        className="w-full h-full object-cover rounded-full" 
                        src={getSafeStorageUrl(user.photoURL) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=6750a4&color=fff&size=128`}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=6750a4&color=fff&size=128`;
                        }}
                      />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-0.5">{user.nickname}</h4>
                    <p className="text-slate-400 text-xs">{user.isInstructor ? t('common.instructor') : t('common.member')}</p>
                  </div>
                ))
              ) : (
                [
                  { id: 'amy', nickname: 'Amy', photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', isInstructor: true, flag: '🇺🇦' },
                  { id: 'aran', nickname: 'Aran', photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', isInstructor: true },
                  { id: 'arbol', nickname: 'Arbol', photoURL: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=200', isInstructor: true },
                  { id: 'gabriel', nickname: 'Gabriel', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200', isInstructor: true },
                  { id: 'luna', nickname: 'Luna', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200', isInstructor: true },
                  { id: 'beto', nickname: 'Beto', photoURL: '/beto.jpg', isInstructor: false, customRole: '칼럼니스트' }
                ].map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => {
                      if (user.id === 'beto') {
                        setComingSoonCard({ title: 'Beto', icon: 'person', desc: 'Beto 칼럼니스트의 상세 정보가 곧 제공됩니다.', badge: t('common.coming_soon_default') });
                      } else {
                        setComingSoonCard({ title: user.nickname, icon: 'person', desc: `${user.nickname} 강사의 상세 정보가 곧 제공됩니다.`, badge: t('common.coming_soon_default') });
                      }
                    }} 
                    className="flex-shrink-0 text-center w-28 md:w-32 group cursor-pointer"
                  >
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1 bg-slate-50 mx-auto">
                      <img 
                        alt={user.nickname} 
                        className="w-full h-full object-cover rounded-full" 
                        src={getSafeStorageUrl(user.photoURL)}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=6750a4&color=fff&size=128`;
                        }}
                      />
                      {(user as any).flag && (
                        <span className="absolute bottom-1 left-1 text-base bg-white/80 rounded-full px-1 shadow-sm select-none">{(user as any).flag}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-0.5">{user.nickname}</h4>
                    <p className="text-slate-400 text-xs">{(user as any).customRole || (user.isInstructor ? t('common.instructor') : t('common.member'))}</p>
                  </div>
                ))
              )}
            </HorizontalScroller>
          </section>

          {/* 순간을 느끼다 */}
          <section className="space-y-4">
            <SectionHeader 
              title="순간을 느끼다"
              actionLabel={t('home.view_all') || '전체 보기'}
              href="/live"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Card 1: Holding hands */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.', badge: t('home.coming_soon_best_live') })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400"/>
                <div className="absolute bottom-2 right-2 flex items-center justify-center text-white pointer-events-none">
                  <span className="material-symbols-outlined text-white/95 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                </div>
              </div>

              {/* Card 2: Arch silhouette */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.', badge: t('home.coming_soon_best_live') })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?q=80&w=400"/>
                <div className="absolute bottom-2 right-2 flex items-center justify-center text-white pointer-events-none">
                  <span className="material-symbols-outlined text-white/95 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                </div>
              </div>

              {/* Card 3: Shoes */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.', badge: t('home.coming_soon_best_live') })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400"/>
              </div>

              {/* Card 4: Theater Couple */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.', badge: t('home.coming_soon_best_live') })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400"/>
                <div className="absolute bottom-2 right-2 flex items-center justify-center text-white pointer-events-none">
                  <span className="material-symbols-outlined text-white/95 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-background border-t border-outline/15 py-section_gap">
          <div className="max-w-7xl mx-auto px-page_margin flex flex-col items-center gap-10">
            {/* 로고 */}
            <div className="font-headline-md text-headline-md font-extrabold text-on-background text-center">
              {t('home.global_tango_society')}
            </div>

            {/* 회원카운트 격자 카드 (소사이어티 페이지 스타일 연장선) */}
            <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline/10 overflow-hidden shadow-sm">
              <div className="grid grid-cols-4 divide-x divide-outline/10 py-6">
                {/* 1. 그룹·모임 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1"></div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">70</span>
                  <span className="text-[12px] font-medium text-slate-500">그룹·모임</span>
                </div>
                
                {/* 2. 멤버 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1 flex items-center justify-center">
                    <span className="text-[11px] font-bold bg-[#EADDFF] text-[#6750A4] px-1.5 py-0.5 rounded-full select-none">
                      {weeklyNewMembers > 0 ? `+${weeklyNewMembers}` : '+13'}
                    </span>
                  </div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">
                    {totalMembers.toLocaleString()}
                  </span>
                  <span className="text-[12px] font-medium text-slate-500">멤버</span>
                </div>

                {/* 3. 도시 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1"></div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">11</span>
                  <span className="text-[12px] font-medium text-slate-500">도시</span>
                </div>

                {/* 4. 국가 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1"></div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">5</span>
                  <span className="text-[12px] font-medium text-slate-500">국가</span>
                </div>
              </div>
            </div>

            {/* 하단 푸터 링크 & 카피라이트 */}
            <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-outline/10">
              <nav className="flex flex-wrap justify-center gap-6">
                <button 
                  onClick={() => setIsAboutOpen(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md bg-transparent border-none cursor-pointer"
                >
                  소개
                </button>
                <button 
                  onClick={() => setIsTermsOpen(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md bg-transparent border-none cursor-pointer"
                >
                  이용약관
                </button>
                <button 
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md bg-transparent border-none cursor-pointer"
                >
                  개인정보처리방침
                </button>
              </nav>
              <div className="text-on-surface-variant font-label-sm text-label-sm text-center md:text-right">
                {t('common.footer_rights')}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Gavi's Tango Cartoons Full Popup */}
      {isCartoonsOpen && (
        <GaviCartoonPopup onClose={() => setIsCartoonsOpen(false)} />
      )}

      {/* Event Detail Full-Screen Popup */}
      {isEventDetailOpen && (selectedEvent || heroEvent) && (
        <EventViewer event={selectedEvent || heroEvent!} onClose={() => setIsEventDetailOpen(false)} />
      )}


      {/* User Profile Popup */}
      <UserProfilePopup
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        uid={selectedUserId || ''}
      />

      {/* Safe Floor Policy & FOCUS Full-Screen Popup */}
      {isSafeFloorOpen && (() => {
        const defaultFocus = {
          id: 'default_safe_floor',
          category: 'focus',
          title: 'Safe Floor: Zero Tolerance Policy',
          titleNative: 'Safe Floor: 상호 존중 및 성희롱 제로 톨러런스 정책',
          keyword: 'ZERO TOLERANCE',
          keywordNative: '상호존중정책',
          description: 'Reaffirming our strict zero-tolerance policy against sexual harassment',
          descriptionNative: 'WoC 커뮤니티는 어떠한 형태의 성희롱이나 괴롭힘도 용납하지 않습니다.',
          imageUrl: '/life_on_bg.jpg',
          content: `WoC 커뮤니티는 상호 존중과 신뢰를 바탕으로 운영됩니다.

우리는 댄스 플로어 내외의 어떠한 형태의 원치 않는 신체 접촉, 성적 언동, 위협적 태도 및 괴롭힘도 일절 용납하지 않습니다.

이 정책은 모든 회원, 강사, 오거나이저 및 관련 스태프에게 예외 없이 적용됩니다.

수칙:
1. 상대방의 동의를 항상 최우선으로 존중하십시오.
2. 거절 의사는 명확히 존중되어야 하며, 보복 조치는 금지됩니다.
3. 문제 발견 시 주저하지 말고 즉각 신고 채널로 제보해 주십시오.`,
          createdAt: { seconds: Date.now() / 1000 }
        };

        const listToRender = focusContents.length > 0 ? focusContents : [defaultFocus];
        const safeIndex = currentFocusIndex < listToRender.length ? currentFocusIndex : 0;
        const activeFocus = listToRender[safeIndex] || defaultFocus;

        const resolvedKeyword = language === 'KR' && activeFocus.keywordNative ? activeFocus.keywordNative : activeFocus.keyword;
        const resolvedTitle = language === 'KR' && activeFocus.titleNative ? activeFocus.titleNative : activeFocus.title;
        const resolvedDesc = language === 'KR' && activeFocus.descriptionNative ? activeFocus.descriptionNative : activeFocus.description;
        const resolvedContent = language === 'KR' && activeFocus.contentNative ? activeFocus.contentNative : activeFocus.content;

        const goPrev = () => {
          if (safeIndex > 0) {
            setCurrentFocusIndex(safeIndex - 1);
            setActiveImageIndex(0);
          }
        };
        const goNext = () => {
          if (safeIndex < listToRender.length - 1) {
            setCurrentFocusIndex(safeIndex + 1);
            setActiveImageIndex(0);
          }
        };

        // 다중 이미지 데이터 처리
        const imagesToSlide = activeFocus.imageUrls && activeFocus.imageUrls.length > 0
          ? activeFocus.imageUrls
          : [activeFocus.imageUrl || '/life_on_bg.jpg'];

        const prevImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex > 0) {
            setActiveImageIndex(activeImageIndex - 1);
          } else {
            setActiveImageIndex(imagesToSlide.length - 1);
          }
        };
        const nextImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex < imagesToSlide.length - 1) {
            setActiveImageIndex(activeImageIndex + 1);
          } else {
            setActiveImageIndex(0);
          }
        };

        return (
          <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            {/* High-Impact Hero Section (Image Slider Container) */}
            <div className="relative w-full h-[50vh] flex-shrink-0 bg-slate-900 group">
              <img 
                src={getSafeStorageUrl(imagesToSlide[activeImageIndex] || '/life_on_bg.jpg')} 
                alt={resolvedTitle} 
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
              
              {/* Top Navigation Row */}
              <div className="absolute top-0 left-0 w-full p-6 flex justify-end items-center z-20">
                {/* Close Button */}
                <button 
                  onClick={() => setIsSafeFloorOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[28px]">close</span>
                </button>
              </div>

              {/* Image Slider Left/Right Arrows */}
              {imagesToSlide.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-20">
                  <button 
                    onClick={prevImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button 
                    onClick={nextImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}

              {/* Image Slider Dots Indicator */}
              {imagesToSlide.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {imagesToSlide.map((_: any, i: number) => (
                    <span 
                      key={i} 
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${activeImageIndex === i ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'}`}
                    ></span>
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                <div className="max-w-4xl mx-auto w-full">
                  <span className="px-4 py-1.5 bg-red-600 text-white text-[12px] font-bold uppercase tracking-widest rounded-lg mb-6 inline-block shadow-xl">{resolvedKeyword}</span>
                  <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 font-headline leading-tight">
                    {resolvedTitle}
                  </h2>
                </div>
              </div>
            </div>

            {/* Policy Content */}
            <div className="flex-1 bg-white pb-24">
              <div className="max-w-4xl mx-auto px-8 md:px-16 py-12 space-y-12">
                <div className="prose prose-slate prose-xl max-w-none">
                  
                  {/* Navigator: 히어로 바로 아래 아코디언 툴바 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 mb-8 shadow-sm relative min-w-0">
                    <button
                      onClick={goPrev}
                      disabled={safeIndex === 0}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>

                    {/* 목록 아코디온 Dropdown */}
                    <div className="relative flex-1 min-w-0">
                      <button
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-800 font-bold border border-slate-200 text-sm hover:bg-slate-100 cursor-pointer text-left shadow-sm min-w-0"
                      >
                        <span className="truncate max-w-[140px] sm:max-w-[280px] block">{safeIndex + 1}화. {resolvedTitle}</span>
                        <span className={`material-symbols-outlined transition-transform duration-200 flex-shrink-0 ${isAccordionOpen ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                      </button>

                      {isAccordionOpen && (
                        <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1">
                          {listToRender.map((item, idx) => {
                            const itTitle = language === 'KR' && item.titleNative ? item.titleNative : item.title;
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setCurrentFocusIndex(idx);
                                  setActiveImageIndex(0);
                                  setIsAccordionOpen(false);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${safeIndex === idx ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                              >
                                {idx + 1}화. {itTitle}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={goNext}
                      disabled={safeIndex === listToRender.length - 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === listToRender.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                  
                  {/* 저자 공간 (Author Profile Section) */}
                  {(() => {
                    const isSafeFloor = activeFocus.title?.includes('Safe Floor') || activeFocus.titleNative?.includes('상호 존중');
                    const authorName = isSafeFloor ? 'Stone' : 'Leo';
                    const authorImg = isSafeFloor 
                      ? '/life_on_bg.jpg' 
                      : 'https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800';

                    return (
                      <div className="flex items-center gap-3.5 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 ring-2 ring-slate-100 shadow-sm">
                          <img 
                            src={getSafeStorageUrl(authorImg)} 
                            alt={authorName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Written by</span>
                          <span className="text-base font-black text-slate-800 leading-none">{authorName}</span>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Summary Block */}
                  <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-8 border-primary pl-8 py-4 bg-slate-50 rounded-r-3xl">
                    {resolvedDesc}
                  </p>

                  {/* Main Content Markdown Parser Fallback */}
                  <div className="mt-12 text-left whitespace-pre-wrap leading-relaxed text-lg text-slate-700 font-sans border-t border-slate-100 pt-8">
                    {resolvedContent}
                  </div>

                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => setIsSafeFloorOpen(false)}
                      className="px-12 py-4 bg-slate-900 text-white text-base font-bold rounded-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-lg border-none cursor-pointer"
                    >
                      창 닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Milonga Etiquette Full-Screen Popup */}
      {isEtiquetteOpen && (() => {
        const defaultEtiquette = {
          id: 'default_eti',
          category: 'etiquette',
          title: 'Milonga Etiquette',
          titleNative: '밀롱가 에티켓',
          keyword: 'ETIQUETTE',
          keywordNative: '에티켓',
          description: 'Explore the 12 key etiquettes of tango milonga.',
          descriptionNative: '밀롱가에서 지켜야 할 12가지 필수 에티켓을 살펴봅니다.',
          imageUrls: ['https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg'],
          content: 'Tango manners matter.',
          contentNative: '매너 있는 밀롱가는 서로를 더 깊게 포옹하게 만듭니다.',
          createdAt: { seconds: Date.now() / 1000 }
        };

        const listToRender = etiquetteContents.length > 0 ? etiquetteContents : [defaultEtiquette];
        const safeIndex = currentEtiquetteIndex < listToRender.length ? currentEtiquetteIndex : 0;
        const activeEti = listToRender[safeIndex] || defaultEtiquette;

        const resolvedKeyword = language === 'KR' && activeEti.keywordNative ? activeEti.keywordNative : activeEti.keyword;
        const resolvedTitle = language === 'KR' && activeEti.titleNative ? activeEti.titleNative : activeEti.title;
        const resolvedDesc = language === 'KR' && activeEti.descriptionNative ? activeEti.descriptionNative : activeEti.description;
        const resolvedContent = language === 'KR' && activeEti.contentNative ? activeEti.contentNative : activeEti.content;

        const goPrev = () => {
          if (safeIndex > 0) {
            setCurrentEtiquetteIndex(safeIndex - 1);
            setActiveImageIndex(0);
          }
        };
        const goNext = () => {
          if (safeIndex < listToRender.length - 1) {
            setCurrentEtiquetteIndex(safeIndex + 1);
            setActiveImageIndex(0);
          }
        };

        // 다중 만화 컷 이미지 목록화
        const imagesToSlide = activeEti.imageUrls && activeEti.imageUrls.length > 0
          ? activeEti.imageUrls
          : [activeEti.imageUrl || 'https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg'];

        const prevImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex > 0) {
            setActiveImageIndex(activeImageIndex - 1);
          } else {
            setActiveImageIndex(imagesToSlide.length - 1);
          }
        };
        const nextImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex < imagesToSlide.length - 1) {
            setActiveImageIndex(activeImageIndex + 1);
          } else {
            setActiveImageIndex(0);
          }
        };

        return (
          <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            {/* Cartoon Image Slider Container */}
            <div className="relative w-full h-[55vh] flex-shrink-0 bg-slate-950 group">
              <img 
                src={getSafeStorageUrl(imagesToSlide[activeImageIndex] || 'https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg')} 
                alt={resolvedTitle} 
                className="w-full h-full object-contain transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20"></div>
              
              {/* Top Navigation Row */}
              <div className="absolute top-0 left-0 w-full p-6 flex justify-end items-center z-20">
                <button 
                  onClick={() => setIsEtiquetteOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[28px]">close</span>
                </button>
              </div>

              {/* Slider Left/Right Arrows */}
              {imagesToSlide.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-20">
                  <button 
                    onClick={prevImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button 
                    onClick={nextImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}

              {/* Slider Dots Indicator */}
              {imagesToSlide.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {imagesToSlide.map((_: any, i: number) => (
                    <span 
                      key={i} 
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${activeImageIndex === i ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'}`}
                    ></span>
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="max-w-4xl mx-auto w-full">
                  <span className="px-3 py-1 bg-amber-500 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-md mb-4 inline-block shadow-md">{resolvedKeyword}</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 font-headline leading-tight">
                    {resolvedTitle}
                  </h2>
                </div>
              </div>
            </div>

            {/* Cartoon Content Body */}
            <div className="flex-1 bg-white pb-24">
              <div className="max-w-4xl mx-auto px-8 md:px-16 py-10 space-y-10">
                <div className="prose prose-slate prose-xl max-w-none">
                  
                  {/* Navigator: 아코디언 툴바 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 mb-8 shadow-sm relative min-w-0">
                    <button
                      onClick={goPrev}
                      disabled={safeIndex === 0}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>

                    {/* 목록 아코디온 Dropdown */}
                    <div className="relative flex-1 min-w-0">
                      <button
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-800 font-bold border border-slate-200 text-sm hover:bg-slate-100 cursor-pointer text-left shadow-sm min-w-0"
                      >
                        <span className="truncate max-w-[140px] sm:max-w-[280px] block">{safeIndex + 1}화. {resolvedTitle}</span>
                        <span className={`material-symbols-outlined transition-transform duration-200 flex-shrink-0 ${isAccordionOpen ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                      </button>

                      {isAccordionOpen && (
                        <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1">
                          {listToRender.map((item, idx) => {
                            const itTitle = language === 'KR' && item.titleNative ? item.titleNative : item.title;
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setCurrentEtiquetteIndex(idx);
                                  setActiveImageIndex(0);
                                  setIsAccordionOpen(false);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${safeIndex === idx ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                              >
                                {idx + 1}화. {itTitle}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={goNext}
                      disabled={safeIndex === listToRender.length - 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === listToRender.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                  
                  {/* 저자 공간: Leo (고정 사진 + 이름) */}
                  <div className="flex items-center gap-3.5 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 ring-2 ring-slate-100 shadow-sm">
                      <img 
                        src={getSafeStorageUrl('https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800')} 
                        alt="Leo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Author / Cartoonist</span>
                      <span className="text-base font-black text-slate-800 leading-none">Leo</span>
                    </div>
                  </div>
                  
                  {/* Summary Block */}
                  <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-8 border-amber-500 pl-8 py-4 bg-slate-50 rounded-r-3xl">
                    {resolvedDesc}
                  </p>

                  {/* Main Content Info */}
                  <div className="mt-10 text-left whitespace-pre-wrap leading-relaxed text-lg text-slate-700 font-sans border-t border-slate-100 pt-8">
                    {resolvedContent}
                  </div>

                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => setIsEtiquetteOpen(false)}
                      className="px-12 py-4 bg-slate-900 text-white text-base font-bold rounded-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-lg border-none cursor-pointer"
                    >
                      창 닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tango Music 365 Full-Screen Popup */}
      {isMusic365Open && (() => {
        const defaultMusic = {
          id: 'default_music',
          category: 'music365',
          title: 'Tango Music 365',
          titleNative: '탱고뮤직 365',
          videoId: 'VyHhP28YJgA',
          img: 'https://i.ytimg.com/vi/VyHhP28YJgA/hqdefault.jpg',
          desc: 'Tango Music 365 - 1 Uno',
          descNative: '탱고뮤직365 - 1 Uno',
          createdAt: { seconds: Date.now() / 1000 }
        };

        const listToRender = music365Contents.filter(item => {
          if (selectedSubcategory === 'music365') {
            return !item.subcategory || item.subcategory === 'music365';
          }
          return item.subcategory === selectedSubcategory;
        }).length > 0 ? music365Contents.filter(item => {
          if (selectedSubcategory === 'music365') {
            return !item.subcategory || item.subcategory === 'music365';
          }
          return item.subcategory === selectedSubcategory;
        }) : [defaultMusic];

        const safeIndex = currentMusic365Index < listToRender.length ? currentMusic365Index : 0;
        const activeMusic = listToRender[safeIndex] || defaultMusic;

        const resolvedTitle = language === 'KR' && activeMusic.titleNative ? activeMusic.titleNative : activeMusic.title;
        const resolvedDesc = language === 'KR' && activeMusic.descNative ? activeMusic.descNative : activeMusic.desc;

        const goPrev = () => {
          if (safeIndex > 0) {
            setCurrentMusic365Index(safeIndex - 1);
          }
        };
        const goNext = () => {
          if (safeIndex < listToRender.length - 1) {
            setCurrentMusic365Index(safeIndex + 1);
          }
        };

        let broadcasterName = t('home.music.tab.music365');
        let broadcasterImg = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800';
        let badgeText = 'Tango Music 365';
        let episodePrefix = 'Day';

        if (selectedSubcategory === 'best160') {
          broadcasterName = t('home.music.tab.best160');
          broadcasterImg = 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800';
          badgeText = 'BEST 160';
          episodePrefix = 'Track';
        } else if (selectedSubcategory === 'mapofm') {
          broadcasterName = t('home.music.tab.mapofm');
          broadcasterImg = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800';
          badgeText = 'Immortal Tango Music';
          episodePrefix = 'Ep.';
        }

        return (
          <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            {/* YouTube Embed Container */}
            <div className="relative w-full h-[55vh] flex-shrink-0 bg-slate-950">
              <iframe
                src={`https://www.youtube.com/embed/${activeMusic.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={resolvedTitle}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              {/* Close Button overlay */}
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={() => setIsMusic365Open(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md text-white hover:bg-black/60 transition-all shadow-lg border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[28px]">close</span>
                </button>
              </div>
            </div>

            {/* Content Details & Selector */}
            <div className="flex-1 bg-white pb-24">
              <div className="max-w-4xl mx-auto px-8 md:px-16 py-10 space-y-8">
                {/* Custom Segmented Tabs (Horizontal Scrollable with Wide Padding) */}
                <div className="flex gap-3.5 overflow-x-auto whitespace-nowrap pb-4 border-b border-slate-100 scrollbar-none -mx-6 px-6 sm:mx-0 sm:px-0">
                  {(['music365', 'best160', 'mapofm'] as const).map((sub) => {
                    const isActive = selectedSubcategory === sub;
                    let label = '';
                    if (sub === 'music365') label = t('home.music.tab.music365');
                    else if (sub === 'best160') label = t('home.music.tab.best160');
                    else if (sub === 'mapofm') label = t('home.music.tab.mapofm');

                    return (
                      <button
                        key={sub}
                        onClick={() => {
                          setSelectedSubcategory(sub);
                          setCurrentMusic365Index(0);
                        }}
                        className={`shrink-0 whitespace-nowrap px-6 py-2.5 rounded-full text-[13px] sm:text-sm font-bold border-none cursor-pointer transition-all ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-md scale-105'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="text-left">
                  <span className="px-3 py-1 bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-md mb-4 inline-block shadow-md">{badgeText}</span>
                  <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 font-headline leading-tight mb-2">
                    {resolvedTitle}
                  </h2>
                  <p className="text-slate-500 text-sm font-semibold mb-6">
                    {resolvedDesc}
                  </p>
                </div>

                {/* Navigator Toolbar */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-sm relative min-w-0">
                  <button
                    onClick={goPrev}
                    disabled={safeIndex === 0}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  {/* Bottom Sheet Trigger Button */}
                  <button
                    onClick={() => setIsMusicSheetOpen(true)}
                    className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white text-slate-800 font-bold border border-slate-200 text-sm hover:bg-slate-100 cursor-pointer text-left shadow-sm min-w-0"
                  >
                    <span className="truncate max-w-[140px] sm:max-w-[280px] block">{episodePrefix} {safeIndex + 1}. {resolvedTitle}</span>
                    <span className="material-symbols-outlined text-slate-400 flex-shrink-0">unfold_more</span>
                  </button>

                  <button
                    onClick={goNext}
                    disabled={safeIndex === listToRender.length - 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === listToRender.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
                
                {/* Author Info */}
                <div className="flex items-center gap-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 ring-2 ring-slate-100 shadow-sm">
                    <img 
                      src={getSafeStorageUrl(broadcasterImg)} 
                      alt={broadcasterName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Broadcaster</span>
                    <span className="text-base font-black text-slate-800 leading-none">{broadcasterName}</span>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <button 
                    onClick={() => setIsMusic365Open(false)}
                    className="px-12 py-4 bg-slate-900 text-white text-base font-bold rounded-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-lg border-none cursor-pointer"
                  >
                    창 닫기
                  </button>
                </div>
              </div>
            </div>

            {/* Episode Selector BottomSheet */}
            <BottomSheet
              isOpen={isMusicSheetOpen}
              onClose={() => setIsMusicSheetOpen(false)}
              title={broadcasterName}
              height="60vh"
            >
              <div className="flex flex-col gap-1.5 py-2">
                {listToRender.map((item, idx) => {
                  const itTitle = language === 'KR' && item.titleNative ? item.titleNative : item.title;
                  const isSelected = safeIndex === idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentMusic365Index(idx);
                        setIsMusicSheetOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-slate-900 text-white font-extrabold shadow-md scale-[1.01]' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                        {idx + 1}
                      </span>
                      <span className="truncate flex-1">{itTitle}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </BottomSheet>
          </div>
        );
      })()}

      {/* Tango History Review Full-Screen Popup */}
      {isHistoryOpen && (() => {
        const defaultHistory = {
          id: 'default_hist',
          category: 'history',
          title: 'Tango History',
          titleNative: '땅고의 역사',
          keyword: 'HISTORY',
          keywordNative: '역사',
          description: '¡Tango! - The Dance, the Song, the Story Book Review and Translation Prologue.',
          descriptionNative: '런던 출판사 Thames and Hudson의 명저 <¡Tango! - The Dance, the Song, the Story> 요약 번역 연재를 개시합니다.',
          imageUrls: ['https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg'],
          content: 'Tango history matters.',
          contentNative: '땅고의 역사를 깊이 알아봅니다.',
          createdAt: { seconds: Date.now() / 1000 }
        };

        const listToRender = historyContents.length > 0 ? historyContents : [defaultHistory];
        const safeIndex = currentHistoryIndex < listToRender.length ? currentHistoryIndex : 0;
        const activeHist = listToRender[safeIndex] || defaultHistory;

        const resolvedKeyword = language === 'KR' && activeHist.keywordNative ? activeHist.keywordNative : activeHist.keyword;
        const resolvedTitle = language === 'KR' && activeHist.titleNative ? activeHist.titleNative : activeHist.title;
        const resolvedDesc = language === 'KR' && activeHist.descriptionNative ? activeHist.descriptionNative : activeHist.description;
        const resolvedContent = language === 'KR' && activeHist.contentNative ? activeHist.contentNative : activeHist.content;

        const goPrev = () => {
          if (safeIndex > 0) {
            setCurrentHistoryIndex(safeIndex - 1);
            setActiveImageIndex(0);
          }
        };
        const goNext = () => {
          if (safeIndex < listToRender.length - 1) {
            setCurrentHistoryIndex(safeIndex + 1);
            setActiveImageIndex(0);
          }
        };

        // 다중 이미지 슬라이더 연동
        const imagesToSlide = activeHist.imageUrls && activeHist.imageUrls.length > 0
          ? activeHist.imageUrls
          : [activeHist.imageUrl || 'https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg'];

        const prevImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex > 0) {
            setActiveImageIndex(activeImageIndex - 1);
          } else {
            setActiveImageIndex(imagesToSlide.length - 1);
          }
        };
        const nextImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex < imagesToSlide.length - 1) {
            setActiveImageIndex(activeImageIndex + 1);
          } else {
            setActiveImageIndex(0);
          }
        };

        return (
          <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            {/* Image Slider Container */}
            <div className="relative w-full h-[55vh] flex-shrink-0 bg-slate-950 group">
              <img 
                src={getSafeStorageUrl(imagesToSlide[activeImageIndex] || 'https://tangoclass.co.kr/wp-content/uploads/2026/06/2026-05-Cabeceo-Title-KO.jpg')} 
                alt={resolvedTitle} 
                className="w-full h-full object-contain transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20"></div>
              
              {/* Top Navigation Row */}
              <div className="absolute top-0 left-0 w-full p-6 flex justify-end items-center z-20">
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[28px]">close</span>
                </button>
              </div>

              {/* Slider Left/Right Arrows */}
              {imagesToSlide.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-20">
                  <button 
                    onClick={prevImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button 
                    onClick={nextImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}

              {/* Slider Dots Indicator */}
              {imagesToSlide.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {imagesToSlide.map((_: any, i: number) => (
                    <span 
                      key={i} 
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${activeImageIndex === i ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'}`}
                    ></span>
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="max-w-4xl mx-auto w-full">
                  <span className="px-3 py-1 bg-amber-500 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-md mb-4 inline-block shadow-md">{resolvedKeyword}</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 font-headline leading-tight">
                    {resolvedTitle}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 bg-white pb-24">
              <div className="max-w-4xl mx-auto px-8 md:px-16 py-10 space-y-10">
                <div className="prose prose-slate prose-xl max-w-none">
                  
                  {/* Navigator Toolbar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 mb-8 shadow-sm relative min-w-0">
                    <button
                      onClick={goPrev}
                      disabled={safeIndex === 0}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>

                    {/* Bottom Sheet Trigger Button */}
                    <button
                      onClick={() => setIsHistorySheetOpen(true)}
                      className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white text-slate-800 font-bold border border-slate-200 text-sm hover:bg-slate-100 cursor-pointer text-left shadow-sm min-w-0"
                    >
                      <span className="truncate max-w-[140px] sm:max-w-[280px] block">{safeIndex + 1}화. {resolvedTitle}</span>
                      <span className="material-symbols-outlined text-slate-400 flex-shrink-0">unfold_more</span>
                    </button>

                    <button
                      onClick={goNext}
                      disabled={safeIndex === listToRender.length - 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === listToRender.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                  
                  {/* 저자 공간: Ddakji Dongtak Yang (고정 사진 + 이름) */}
                  <div className="flex items-center gap-3.5 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 ring-2 ring-slate-100 shadow-sm">
                      <img 
                        src={getSafeStorageUrl('https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800')} 
                        alt="Ddakji Dongtak Yang" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Author / Translator</span>
                      <span className="text-base font-black text-slate-800 leading-none">Ddakji Dongtak Yang</span>
                    </div>
                  </div>
                  
                  {/* Summary Block */}
                  <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-8 border-amber-500 pl-8 py-4 bg-slate-50 rounded-r-3xl">
                    {resolvedDesc}
                  </p>

                  {/* Main Content Info */}
                  <div className="mt-10 text-left whitespace-pre-wrap leading-relaxed text-lg text-slate-700 font-sans border-t border-slate-100 pt-8">
                    {resolvedContent}
                  </div>

                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => setIsHistoryOpen(false)}
                      className="px-12 py-4 bg-slate-900 text-white text-base font-bold rounded-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-lg border-none cursor-pointer"
                    >
                      창 닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* History Episode Selector BottomSheet */}
            <BottomSheet
              isOpen={isHistorySheetOpen}
              onClose={() => setIsHistorySheetOpen(false)}
              title={resolvedKeyword}
              height="60vh"
            >
              <div className="flex flex-col gap-1.5 py-2">
                {listToRender.map((item, idx) => {
                  const itTitle = language === 'KR' && item.titleNative ? item.titleNative : item.title;
                  const isSelected = safeIndex === idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentHistoryIndex(idx);
                        setActiveImageIndex(0);
                        setIsHistorySheetOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-slate-900 text-white font-extrabold shadow-md scale-[1.01]' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                        {idx + 1}
                      </span>
                      <span className="truncate flex-1">{itTitle}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </BottomSheet>
          </div>
        );
      })()}

      {/* Beto Travel Full-Screen Popup */}
      {isTravelOpen && (() => {
        const defaultTravel = {
          id: 'default_travel',
          category: 'travel',
          title: 'Beijing Select Tango Weekend',
          titleNative: '북경 셀렉트 땅고 위켄드',
          keyword: 'TRAVEL',
          keywordNative: '여행',
          description: "Beto Kim's travel diary and settlement on 2026 Beijing Select Tango Weekend.",
          descriptionNative: '2026 북경 셀렉트 땅고 위켄드(6.19.~6.22.) 여행 후기 및 가계부 정산 스크린샷 이미지와 함께 수기를 공유합니다.',
          imageUrls: ['/travel_beijing1.png'],
          content: 'Tango travel log.',
          contentNative: '탱고 여행기를 감상합니다.',
          createdAt: { seconds: Date.now() / 1000 }
        };

        const listToRender = travelContents.length > 0 ? travelContents : [defaultTravel];
        const safeIndex = currentTravelIndex < listToRender.length ? currentTravelIndex : 0;
        const activeTravel = listToRender[safeIndex] || defaultTravel;

        const resolvedKeyword = language === 'KR' && activeTravel.keywordNative ? activeTravel.keywordNative : activeTravel.keyword;
        const resolvedTitle = language === 'KR' && activeTravel.titleNative ? activeTravel.titleNative : activeTravel.title;
        const resolvedDesc = language === 'KR' && activeTravel.descriptionNative ? activeTravel.descriptionNative : activeTravel.description;
        const resolvedContent = language === 'KR' && activeTravel.contentNative ? activeTravel.contentNative : activeTravel.content;

        const goPrev = () => {
          if (safeIndex > 0) {
            setCurrentTravelIndex(safeIndex - 1);
            setActiveImageIndex(0);
          }
        };
        const goNext = () => {
          if (safeIndex < listToRender.length - 1) {
            setCurrentTravelIndex(safeIndex + 1);
            setActiveImageIndex(0);
          }
        };

        // 다중 이미지 슬라이더 연동
        const imagesToSlide = activeTravel.imageUrls && activeTravel.imageUrls.length > 0
          ? activeTravel.imageUrls
          : [activeTravel.imageUrl || '/travel_beijing1.png'];

        const prevImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex > 0) {
            setActiveImageIndex(activeImageIndex - 1);
          } else {
            setActiveImageIndex(imagesToSlide.length - 1);
          }
        };
        const nextImg = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (activeImageIndex < imagesToSlide.length - 1) {
            setActiveImageIndex(activeImageIndex + 1);
          } else {
            setActiveImageIndex(0);
          }
        };

        return (
          <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            {/* Image Slider Container */}
            <div className="relative w-full h-[55vh] flex-shrink-0 bg-slate-950 group">
              <img 
                src={getSafeStorageUrl(imagesToSlide[activeImageIndex] || '/travel_beijing1.png')} 
                alt={resolvedTitle} 
                className="w-full h-full object-contain transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20"></div>
              
              {/* Top Navigation Row */}
              <div className="absolute top-0 left-0 w-full p-6 flex justify-end items-center z-20">
                <button 
                  onClick={() => setIsTravelOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[28px]">close</span>
                </button>
              </div>

              {/* Slider Left/Right Arrows */}
              {imagesToSlide.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-20">
                  <button 
                    onClick={prevImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button 
                    onClick={nextImg}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}

              {/* Slider Dots Indicator */}
              {imagesToSlide.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {imagesToSlide.map((_: any, i: number) => (
                    <span 
                      key={i} 
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${activeImageIndex === i ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'}`}
                    ></span>
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="max-w-4xl mx-auto w-full">
                  <span className="px-3 py-1 bg-amber-500 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-md mb-4 inline-block shadow-md">{resolvedKeyword}</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 font-headline leading-tight">
                    {resolvedTitle}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 bg-white pb-24">
              <div className="max-w-4xl mx-auto px-8 md:px-16 py-10 space-y-10">
                <div className="prose prose-slate prose-xl max-w-none">
                  
                  {/* Navigator: 아코디언 툴바 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 mb-8 shadow-sm relative min-w-0">
                    <button
                      onClick={goPrev}
                      disabled={safeIndex === 0}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>

                    {/* 목록 아코디온 Dropdown */}
                    <div className="relative flex-1 min-w-0">
                      <button
                        onClick={() => setIsTravelSheetOpen(true)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white text-slate-800 font-bold border border-slate-200 text-sm hover:bg-slate-100 cursor-pointer text-left shadow-sm min-w-0"
                      >
                        <span className="truncate max-w-[140px] sm:max-w-[280px] block">{safeIndex + 1}화. {resolvedTitle}</span>
                        <span className="material-symbols-outlined text-slate-400 flex-shrink-0">unfold_more</span>
                      </button>


                    </div>

                    <button
                      onClick={goNext}
                      disabled={safeIndex === listToRender.length - 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 transition-all flex-shrink-0 ${safeIndex === listToRender.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95 cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                  
                  {/* 저자 공간: Beto Kim (고정 사진 + 이름) */}
                  <div className="flex items-center gap-3.5 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 ring-2 ring-slate-100 shadow-sm">
                      <img 
                        src={getSafeStorageUrl('/beto.jpg')} 
                        alt="Beto Kim" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Author / Traveler</span>
                      <span className="text-base font-black text-slate-800 leading-none">Beto Kim</span>
                    </div>
                  </div>
                  
                  {/* Summary Block */}
                  <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-8 border-amber-500 pl-8 py-4 bg-slate-50 rounded-r-3xl">
                    {resolvedDesc}
                  </p>

                  {/* Main Content Info */}
                  <div className="mt-10 text-left whitespace-pre-wrap leading-relaxed text-lg text-slate-700 font-sans border-t border-slate-100 pt-8">
                    {resolvedContent}
                  </div>

                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => setIsTravelOpen(false)}
                      className="px-12 py-4 bg-slate-900 text-white text-base font-bold rounded-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-lg border-none cursor-pointer"
                    >
                      창 닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Episode Selector BottomSheet */}
            <BottomSheet
              isOpen={isTravelSheetOpen}
              onClose={() => setIsTravelSheetOpen(false)}
              title={resolvedKeyword}
              height="60vh"
            >
              <div className="flex flex-col gap-1.5 py-2">
                {listToRender.map((item, idx) => {
                  const itTitle = language === 'KR' && item.titleNative ? item.titleNative : item.title;
                  const isSelected = safeIndex === idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTravelIndex(idx);
                        setActiveImageIndex(0);
                        setIsTravelSheetOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-slate-900 text-white font-extrabold shadow-md scale-[1.01]' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                        {idx + 1}
                      </span>
                      <span className="truncate flex-1">{itTitle}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </BottomSheet>
          </div>
        );
      })()}

      {/* Coming Soon Fullscreen */}
      {comingSoonCard && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <button 
            onClick={() => setComingSoonCard(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          <div className="flex flex-col items-center text-center px-8 max-w-md animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-[28px] bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8 ring-1 ring-white/10">
              <span className="material-symbols-outlined text-white/80 text-[48px]">{comingSoonCard.icon}</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-3 font-headline tracking-tight">{comingSoonCard.title}</h2>
            <p className="text-white/60 text-base leading-relaxed mb-10">{comingSoonCard.desc}</p>
            
            <div className="flex items-center gap-3 mb-12">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-amber-400 text-sm font-bold uppercase tracking-[0.1em]">{comingSoonCard.badge || t('common.coming_soon_default')}</span>
            </div>

            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {t('home.coming_soon_desc')}
            </p>

            <button 
              onClick={() => setComingSoonCard(null)}
              className="mt-10 px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all active:scale-95 ring-1 ring-white/10"
            >
              {t('common.got_it')}
            </button>
          </div>
        </div>
      )}

      {/* 소개 (About) Fullscreen Popup */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 w-full p-6 border-b border-outline/10 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-extrabold text-slate-900 font-headline">World of Community (WoC) 소개</h2>
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-all animate-none"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 bg-white p-8 md:p-16 max-w-4xl mx-auto w-full">
            <div className="prose prose-slate max-w-none space-y-6 text-left">
              <h3 className="text-3xl font-black text-[#6750A4] mb-6">글로벌 탱고 및 커뮤니티 통합 플랫폼</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                World of Community (WoC)는 전 세계의 탱고 애호가, 댄서, 강사 및 스튜디오 운영자를 하나의 디지털 생태계로 연결하기 위해 설계된 프리미엄 글로벌 통합 서비스입니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                <div className="p-6 bg-slate-50 rounded-2xl border border-outline/5">
                  <h4 className="font-bold text-slate-900 text-lg mb-2">실시간 밀롱가 & 소셜 탐색</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    오늘 서울에서 열리는 밀롱가 정보부터 해외 주요 도시의 소셜 이벤트 일정까지, 사용자의 로컬 타임존과 GPS에 기반하여 정밀한 실시간 데이터를 바인딩하여 제공합니다.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-outline/5">
                  <h4 className="font-bold text-slate-900 text-lg mb-2">전문가 수준의 클래스 관리</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    아카데미와 강사분들을 위한 스마트 일정 기획, 신청자 관리, 번들 할인 및 월간 패스 예약 시스템을 원스톱으로 지원합니다.
                  </p>
                </div>
              </div>
              <p className="text-slate-700 text-base leading-relaxed">
                우리는 단순히 정보를 나열하는 것을 넘어, 전 세계 지역 커뮤니티가 자생적으로 성장하고 서로 교류할 수 있는 문화를 개척합니다. WoC와 함께 매혹적인 탱고의 여정을 언제 어디서나 생생하게 누려보세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 이용약관 (Terms) Fullscreen Popup */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 w-full p-6 border-b border-outline/10 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-extrabold text-slate-900 font-headline">서비스 이용약관</h2>
            <button 
              onClick={() => setIsTermsOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-all animate-none"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 bg-white p-8 md:p-16 max-w-4xl mx-auto w-full">
            <div className="prose prose-slate max-w-none space-y-6 text-left text-sm text-slate-700 leading-relaxed">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 1 조 (목적)</h3>
              <p>
                본 약관은 World of Community(이하 &quot;회사&quot;)가 운영하는 플랫폼 및 모바일 애플리케이션(이하 &quot;서비스&quot;)을 이용함에 있어, 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
              </p>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 2 조 (의무 및 책임)</h3>
              <p>
                1. 회원은 관계 법령, 본 약관의 규정, 이용안내 및 서비스 상에 공지한 주의사항을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.<br />
                2. 회원은 커뮤니티의 건전성과 타인의 개인정보를 존중해야 하며, 비속어 사용, 허위 정보 유포 또는 허가되지 않은 광고 행위 시 이용이 제한될 수 있습니다.
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 3 조 (결제 및 환불 규정)</h3>
              <p>
                스튜디오 대관, 클래스 수강 신청 등 유료 서비스의 결제는 회사가 제공하는 안전 결제 시스템을 이용해야 하며, 예약 변경 및 환불은 각 스튜디오 및 주최측이 명시한 환불 정책 및 현행 소비자보호법에 의거하여 처리됩니다.
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 4 조 (면책조항)</h3>
              <p>
                회사는 천재지변, 분산 서비스 거부 공격(DDoS), 호스팅 장애 등 불가항력으로 인해 서비스를 제공할 수 없는 경우에는 책임을 지지 않으며, 회원이 서비스를 이용하여 기대하는 이익이나 개인적 소셜 네트워킹 결과에 대해 보증하지 않습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 (Privacy) Fullscreen Popup */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 w-full p-6 border-b border-outline/10 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-extrabold text-slate-900 font-headline">개인정보처리방침</h2>
            <button 
              onClick={() => setIsPrivacyOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-all animate-none"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 bg-white p-8 md:p-16 max-w-4xl mx-auto w-full">
            <div className="prose prose-slate max-w-none space-y-6 text-left text-sm text-slate-700 leading-relaxed">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">1. 수집하는 개인정보 항목</h3>
              <p>
                회사는 회원가입, 원활한 고객 상담, 유료 서비스 제공 등을 위해 아래와 같은 개인정보를 수집하고 있습니다:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-left">
                <li>필수항목: 이메일 주소, 비밀번호, 닉네임, 프로필 사진 URL</li>
                <li>선택항목: 연령대, 선호 지역, 주 활동 파트(리더/팔로워)</li>
                <li>소셜 로그인 시: 제공업체(Google, Apple 등)로부터 전달받는 고유 식별값 및 프로필 명 정보</li>
              </ul>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">2. 개인정보의 수집 및 이용 목적</h3>
              <p>
                회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-left">
                <li>서비스 제공에 따른 본인 인증, 예약 및 결제 대행</li>
                <li>글로벌 탱고 커뮤니티 파트너 추천 및 매칭 서비스 고도화</li>
                <li>이벤트 알림 수신 동의자에 대한 맞춤 피드 전송</li>
              </ul>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">3. 개인정보의 보유 및 파기</h3>
              <p>
                회원의 개인정보는 서비스 탈퇴 시 지체 없이 파기되는 것을 원칙으로 합니다. 단, 전자상거래법 등 관계법령의 규정에 의하여 보존할 필요가 있는 경우 해당 법령이 정한 기간 동안 보관 후 안전하게 영구 삭제됩니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
