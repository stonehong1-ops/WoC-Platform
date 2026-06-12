import { Social } from '@/types/social';

// 대한민국 법정공휴일 (2025-2027)
export const KR_HOLIDAYS: Record<string, string> = {
  '2025-01-01': 'New Year', '2025-01-28': 'Seollal', '2025-01-29': 'Seollal', '2025-01-30': 'Seollal',
  '2025-03-01': 'Independence Movement', '2025-05-05': 'Children\'s Day', '2025-05-06': 'Buddha\'s Birthday',
  '2025-06-06': 'Memorial Day', '2025-08-15': 'Liberation Day', '2025-10-03': 'National Foundation',
  '2025-10-05': 'Chuseok', '2025-10-06': 'Chuseok', '2025-10-07': 'Chuseok', '2025-10-09': 'Hangul Day',
  '2025-12-25': 'Christmas',
  '2026-01-01': 'New Year', '2026-02-16': 'Seollal', '2026-02-17': 'Seollal', '2026-02-18': 'Seollal',
  '2026-03-01': 'Independence Movement', '2026-05-05': 'Children\'s Day', '2026-05-24': 'Buddha\'s Birthday',
  '2026-06-06': 'Memorial Day', '2026-08-15': 'Liberation Day', '2026-09-24': 'Chuseok',
  '2026-09-25': 'Chuseok', '2026-09-26': 'Chuseok', '2026-10-03': 'National Foundation', '2026-10-09': 'Hangul Day',
  '2026-12-25': 'Christmas',
  '2027-01-01': 'New Year', '2027-02-06': 'Seollal', '2027-02-07': 'Seollal', '2027-02-08': 'Seollal',
  '2027-03-01': 'Independence Movement', '2027-05-05': 'Children\'s Day', '2027-05-13': 'Buddha\'s Birthday',
  '2027-06-06': 'Memorial Day', '2027-08-15': 'Liberation Day', '2027-10-03': 'National Foundation',
  '2027-10-09': 'Hangul Day', '2027-10-13': 'Chuseok', '2027-10-14': 'Chuseok', '2027-10-15': 'Chuseok',
  '2027-12-25': 'Christmas',
};

export function getDateKey(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isKoreanHoliday(d: Date) {
  return KR_HOLIDAYS[getDateKey(d)] || null;
}

export const districtOrder = (d?: string) => {
  if (d === '강북') return 0;
  if (d === '강남') return 1;
  return 2;
};

export const subDistrictOrder = (d?: string) => {
  if (!d) return 9;
  const lower = d.toLowerCase();
  if (lower.includes('홍대') || lower.includes('한강위')) return 0;
  if (lower.includes('강남') || lower.includes('한강아래')) return 1;
  if (lower.includes('강북')) return 2;
  return 3;
};

export const getWeekOrdinal = (d: Date) => Math.ceil(d.getDate() / 7);

export const isLastWeekOfMonth = (d: Date) => {
  const currentMonth = d.getMonth();
  const nextWeekDate = new Date(d);
  nextWeekDate.setDate(d.getDate() + 7);
  return nextWeekDate.getMonth() !== currentMonth;
};

export const getDensityMode = (length: number): 'emperor' | 'wide' | 'slim' | 'grid' => {
  if (length <= 2) return 'emperor';
  if (length >= 3 && length <= 4) return 'wide';
  if (length >= 5 && length <= 9) return 'slim';
  return 'grid';
};

export const detectSeoulDistrict = (social: Social, language: string, venuesMap: Record<string, any>): string => {
  if (social.district && typeof social.district === 'string' && social.district.trim()) {
    const d = social.district.trim().toLowerCase();
    if (d.includes('강남') || d.includes('서초') || d.includes('송파') || d.includes('강동') || d.includes('양재')) {
      return language === 'KR' ? '한강아래 (강남지역)' : 'South of River (Gangnam)';
    }
    if (d.includes('강북') || d.includes('홍대') || d.includes('마포') || d.includes('신촌') || d.includes('종로') || d.includes('합정')) {
      return language === 'KR' ? '한강위 (홍대인근)' : 'North of River (Hongdae)';
    }
  }

  const venue = venuesMap[social.venueId];
  if (venue && venue.seoulArea) {
    if (venue.seoulArea === 'gangbuk') {
      return language === 'KR' ? '한강위 (홍대인근)' : 'North of River (Hongdae)';
    }
    if (venue.seoulArea === 'gangnam') {
      return language === 'KR' ? '한강아래 (강남지역)' : 'South of River (Gangnam)';
    }
  }

  const venueName = String(social.venueNameNative || social.venueName || '').toLowerCase();
  const gangbukKeywords = [
    '홍대', '마포', '신촌', '합정', '망원', '종로', '중구', '성동', '서대문', '이대', '상수', '광진', '용산', '한남', '이태원', '을지로', '광화문',
    'hongdae', 'mapo', 'sinchon', 'hapjeong', 'jongno', 'yongsan', 'hannam', 'itaewon',
    '바르샤', 'barsha', '엘빠소', 'elpaso', '아반', 'aban', '보헤미안', 'bohemian', '아르헨티나', 'argentina',
    '오쵸', 'ocho', '땅고마니아', 'tangomania', '라비다', 'lavida', '마구아', 'magua', '밀롱가헤이', 'milongahei',
    '라벤타나', '라 벤타나', 'ventana', 'la ventana', '알마', 'alma', '오나다', 'onada', 'atta', '아똬'
  ];

  for (const key of gangbukKeywords) {
    if (venueName.includes(key)) return language === 'KR' ? '한강위 (홍대인근)' : 'North of River (Hongdae)';
  }

  return language === 'KR' ? '한강아래 (강남지역)' : 'South of River (Gangnam)';
};

export const getVenueDisplay = (
  social: Social,
  language: string,
  venuesMap?: Record<string, any>
): string => {
  const dbVenue = social.venueId && venuesMap ? venuesMap[social.venueId] : null;
  if (dbVenue) {
    if (language === 'KR') {
      return dbVenue.nameKo || dbVenue.nameNative || dbVenue.titleNative || dbVenue.name || '';
    } else {
      return dbVenue.name || dbVenue.nameKo || dbVenue.nameNative || dbVenue.titleNative || '';
    }
  }
  
  if (language === 'KR') {
    return social.venueNameNative || social.venueName || '';
  } else {
    return social.venueName || social.venueNameNative || '';
  }
};

export const INSTRUCTOR_NAME_MAP: Record<string, string> = {
  "muse": "뮤즈",
  "aran": "아란",
  "aran sunmi kang": "아란",
  "epitone": "에피톤",
  "janda": "쟌다",
  "jarnda": "쟌다",
  "sophia": "소피아",
  "sophia song": "소피아송",
  "rain": "레인",
  "mango": "망고",
  "jeje": "제제",
  "ari": "아리",
  "yerin": "예린",
  "mj": "엠제이",
  "linda": "린다",
  "liz": "리즈",
  "chaos": "카오스",
  "luna": "루나",
  "joa": "조아",
  "pippi": "삐삐",
  "who": "후",
  "aqua": "아쿠아",
  "chani": "차니",
  "gina": "지나",
  "irang": "이랑",
  "gael": "가엘",
  "ritta": "리따",
  "harry": "해리",
  "fidel": "피델",
  "sydney": "시드니",
  "bomi": "보미",
  "hans": "한스",
  "bara": "바라",
  "aji": "아지",
  "swan": "스완",
  "banya": "반야",
  "ajji": "아찌",
  "chugong": "추공",
  "stone": "스톤",
  "stone hong": "스톤",
  "natali": "나탈리",
  "tony": "토니",
  "shrek": "슈렉",
  "totoro": "토토로",
  "gaul": "가을",
  "ellin": "엘린",
  "joy": "기쁨",
  "lala": "라라",
  "shine": "샤인",
  "polly": "폴리",
  "jayden": "제이든",
  "may": "메이",
  "vicky": "비키",
  "basil": "바질",
  "susana": "수사나",
  "trees": "트리스",
  "nacho": "나초",
  "hernan": "에르난",
  "henry": "헨리",
  "alex": "알렉스",
  "becca": "베카",
  "carlos": "카를로스",
  "okiz": "오키즈",
  "okiz baek": "오키즈",
  "odysseus dada": "오디세우스 다다",
  "odysseus": "오디세우스",
  "dani.cecil": "다니 세실",
  "o.n.e": "O.N.E",
  "one": "O.N.E",
  "aqui": "아끼",
  "ivy": "아이비",
  "billy": "빌리",
  "hagun": "하군",
  "bana": "반아",
  "tbd": "미정",
  "미정": "TBD"
};

export function formatInstructorNames(instructorStr: string, locale: string): string {
  if (!instructorStr) return "";
  
  // 이미 한글 문자가 포함되어 있다면 원래 강사명 반환
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(instructorStr);
  if (hasKorean && locale === "KR") return instructorStr;

  if (locale !== "KR") {
    return instructorStr.split(/[,&/]/).map(part => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      
      const lowerKey = trimmed.toLowerCase();
      // Reverse lookup
      for (const [en, ko] of Object.entries(INSTRUCTOR_NAME_MAP)) {
        if (ko.toLowerCase() === lowerKey || ko === trimmed) {
          return en.charAt(0).toUpperCase() + en.slice(1);
        }
      }
      
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }).filter(Boolean).join(", ");
  }

  const parts = instructorStr.split(/[,&/]/);
  const formattedParts = parts.map(part => {
    const trimmed = part.trim();
    const key = trimmed.toLowerCase();
    
    if (INSTRUCTOR_NAME_MAP[key]) {
      return INSTRUCTOR_NAME_MAP[key];
    }
    
    const firstWord = key.split(/\s+/)[0];
    if (INSTRUCTOR_NAME_MAP[firstWord]) {
      return INSTRUCTOR_NAME_MAP[firstWord];
    }
    
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  });

  return formattedParts.join(", ");
}

export const COMMUNITY_NAME_MAP: Record<string, string> = {
  "vida mia": "비다미아",
  "rora mil": "로라밀",
  "salida milonga": "살리다 밀롱가",
  "en paz friday practica": "엔빠스 금요 쁘락띠까",
  "en paz practica": "엔빠스 쁘락띠까",
  "camelia": "카멜리아",
  "ptc휴강": "PTC휴강",
  "화, 금 낮쁘락": "화, 금 낮쁘락",
  "en paz studio": "엔빠스 스튜디오",
  "en paz": "엔빠스",
  "solotango": "솔로땅고",
  "la vida": "라비다",
  "pasion": "빠시온",
  "troilo": "트로일로",
  "bonita": "보니따",
  "arbol": "아르볼",
  "su! 달려용!": "수! 달려용!",
  "hernan": "에르난",
  "stone": "스톤",
  "stone hong": "스톤",
  "aran": "아란",
  "timeworld tango club": "타임월드 탱고클럽",
  "daejeon friday fever": "대전 프라이데이 Fever",
  "daejeon jjin tango": "대전 찐탱고",
  "jjin tango studio": "찐탱고 연습실",
  "cafe de tango (busan)": "카페 데 탱고 (부산)",
  "cafe de tango team": "Cafe de Tango Team",
  "tango cafe ideal (busan)": "탱고 카페 이데알 (부산)",
  "ideal team": "Ideal Team",
  "andante": "안단테",
  "ocho": "오초",
  "la ventana": "라벤따나",
  "pista": "피스타",
  "onada": "오나다",
  "tbd": "미정",
  "미정": "TBD"
};

export const REVERSE_COMMUNITY_MAP: Record<string, string> = {
  "비다미아": "Vida Mia",
  "로라밀": "RoRa Mil",
  "살리다 밀롱가": "Salida Milonga",
  "엔빠스 금요 쁘락띠까": "En Paz Friday Practica",
  "엔빠스 쁘락띠까": "En Paz Practica",
  "카멜리아": "Camelia",
  "엔빠스 스튜디오": "En Paz Studio",
  "엔빠스": "En Paz",
  "솔로땅고": "SoloTango",
  "라비다": "La Vida",
  "빠시온": "Pasion",
  "트로일로": "Troilo",
  "보니따": "Bonita",
  "아르볼": "Arbol",
  "에르난": "Hernan",
  "스톤": "Stone",
  "아란": "Aran",
  "타임월드 탱고클럽": "Timeworld Tango Club",
  "대전 프라이데이 fever": "Daejeon Friday Fever",
  "대전 찐탱고": "Daejeon JJin Tango",
  "찐탱고 연습실": "JJin Tango Studio",
  "카페 데 탱고 (부산)": "Cafe de Tango (Busan)",
  "탱고 카페 이데알 (부산)": "Tango Cafe Ideal (Busan)",
  "안단테": "Andante",
  "오초": "Ocho",
  "라벤따나": "La Ventana",
  "피스타": "Pista",
  "오나다": "Onada",
  "미정": "TBD"
};

export function formatCommunityName(nameStr: string, locale: string): string {
  if (!nameStr) return "";
  const trimmed = nameStr.trim();
  
  if (locale === "KR") {
    const key = trimmed.toLowerCase();
    if (COMMUNITY_NAME_MAP[key]) {
      return COMMUNITY_NAME_MAP[key];
    }
    if (INSTRUCTOR_NAME_MAP[key]) {
      return INSTRUCTOR_NAME_MAP[key];
    }
    return trimmed;
  } else {
    if (REVERSE_COMMUNITY_MAP[trimmed]) {
      return REVERSE_COMMUNITY_MAP[trimmed];
    }
    const lowerKey = trimmed.toLowerCase();
    for (const [en, ko] of Object.entries(COMMUNITY_NAME_MAP)) {
      if (ko.toLowerCase() === lowerKey) {
        return en.charAt(0).toUpperCase() + en.slice(1);
      }
    }
    for (const [en, ko] of Object.entries(INSTRUCTOR_NAME_MAP)) {
      if (ko.toLowerCase() === lowerKey || en.toLowerCase() === lowerKey) {
        return en.charAt(0).toUpperCase() + en.slice(1);
      }
    }
    return trimmed;
  }
}


