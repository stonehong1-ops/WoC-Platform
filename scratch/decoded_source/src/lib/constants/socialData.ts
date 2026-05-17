export interface SocialEvent {
  id: string;
  title: string;
  place: string;
  time: string;
  djs: string[];
  organizers: string[];
  imageUrl?: string;
  href: string;
  isSpecial?: boolean;
  day?: string; // e.g., '03/24(화)'
}

export const HERO_BANNER = {
  id: 'hero-1',
  title: 'Lucas & Paula 서울 워크샵',
  subtitle: '10/25-30 (6일간) / 얼리버드 15% d.c',
  organizer: 'Stone Hong',
  imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2069&auto=format&fit=crop',
  href: '/social/hero-1',
};

export const TODAY_SOCIALS: SocialEvent[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `today-${i}`,
  title: `탱고 소셜 나이트 #${i + 1}`,
  place: '강남 탱고 웍스',
  time: '19:00 - 23:00',
  djs: ['DJ Suna', 'DJ Tango'],
  organizers: ['Stone Hong', 'Paula'],
  imageUrl: `https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=2070&auto=format&fit=crop`,
  href: `/social/today-${i}`,
}));

export interface WeeklyDay {
  day: string; // e.g., '03/24(화)'
  events: SocialEvent[];
}

export const WEEKLY_SOCIALS: WeeklyDay[] = Array.from({ length: 7 }).map((_, i) => ({
  day: `03/${24 + i}(${['화', '수', '목', '금', '토', '일', '월'][i]})`,
  events: Array.from({ length: 15 }).map((__, j) => ({
    id: `week-${i}-${j}`,
    title: `밀롱가 엘 불린`,
    place: '합정 턴',
    time: '20:00 - 익일 01:00',
    djs: ['DJ Blue'],
    organizers: ['El Bulin Team'],
    href: `/social/week-${i}-${j}`,
  })),
}));

export const SPECIAL_EVENTS: SocialEvent[] = [
  {
    id: 'special-1',
    title: '부에노스아이레스 마스터 마라톤',
    place: '인천 파라다이스 시티',
    time: '48시간 연속 진행',
    djs: ['DJ Buenos', 'DJ Aires', 'DJ Master'],
    organizers: ['Global Tango Association', 'Stone Hong'],
    isSpecial: true,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
    href: '/social/special-1',
  },
];

export const REGIONS = ['서울', '경기', '부산', '대전', '대구', '광주', '제주'];
