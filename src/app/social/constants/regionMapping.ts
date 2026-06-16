export type LocationGroup = 'SEOUL' | 'BUSAN' | 'GWANGJU' | 'DAEJEON' | 'ALL';

// 입력값(도시 문자열)을 4대 광역 그룹으로 판별하는 함수
export function getCityGroup(city?: string): LocationGroup {
  if (!city) return 'SEOUL';
  const c = city.trim().toUpperCase();
  
  // 서울 그룹: 서울, 인천, 경기, 강원 (춘천, 강릉, 일산 등 포함)
  if (['SEOUL', 'INCHEON', 'GYEONGGI', 'GANGWON', '인천', '경기', '강원', '서울', '춘천', 'CHUNCHEON', '강릉', 'GANGNEUNG', '일산', 'ILSAN'].some(x => c.includes(x.toUpperCase()))) {
    return 'SEOUL';
  }
  
  // 부산 그룹: 부산, 대구, 울산, 경상, 영남, 경북, 경남, 창원, 진주
  if (['BUSAN', 'DAEGU', 'ULSAN', 'GYEONGSANG', 'YEONGNAM', 'GYEONGBUK', 'GYEONGNAM', 'CHANGWON', '부산', '대구', '울산', '경상', '영남', '경북', '경남', '창원', '진주', 'JINJU', '창원케렌시아', 'JINJU TANGO'].some(x => c.includes(x.toUpperCase()))) {
    return 'BUSAN';
  }
  
  // 광주 그룹: 광주, 전북, 전남, 호남, 제주 (순천, 군산 등 호남/제주 전역 포함)
  if (['GWANGJU', 'JEONBUK', 'JEONNAM', 'HONAM', 'JEJU', '광주', '전북', '전남', '호남', '제주', '순천', 'SOONCHEON', '군산', 'GUNSAN'].some(x => c.includes(x.toUpperCase()))) {
    return 'GWANGJU';
  }
  
  // 대전 그룹: 대전, 세종, 충북, 충남, 충청, 청주, 천안
  if (['DAEJEON', 'SEJONG', 'CHUNGBUK', 'CHUNGNAM', 'CHUNGCHEONG', '대전', '세종', '충북', '충남', '충청', '청주', 'CHEONGJU', '천안', 'CHEONAN'].some(x => c.includes(x.toUpperCase()))) {
    return 'DAEJEON';
  }
  
  return 'SEOUL';
}

// 각 실제 세부 도시명에 매칭되는 한글/영어 라벨 리스너
export function getCityCategoryLabel(city: string, language: string): string {
  const c = city.trim().toUpperCase();
  
  // 서울 내부 세부 명칭은 '서울'을 반환하여 기존의 한강위/아래 구분을 적용하게 함
  if (c === 'SEOUL' || c === '서울') {
    return language === 'KR' ? '서울' : 'Seoul';
  }
  if (c.includes('INCHEON') || c.includes('인천')) return language === 'KR' ? '인천' : 'Incheon';
  if (c.includes('GYEONGGI') || c.includes('경기')) return language === 'KR' ? '경기' : 'Gyeonggi';
  if (c.includes('GANGWON') || c.includes('강원')) return language === 'KR' ? '강원' : 'Gangwon';
  
  if (c === 'BUSAN' || c === '부산') return language === 'KR' ? '부산' : 'Busan';
  if (c.includes('DAEGU') || c.includes('대구')) return language === 'KR' ? '대구' : 'Daegu';
  if (c.includes('ULSAN') || c.includes('울산')) return language === 'KR' ? '울산' : 'Ulsan';
  if (c.includes('GYEONGNAM') || c.includes('경남')) return language === 'KR' ? '경남' : 'Gyeongnam';
  if (c.includes('GYEONGBUK') || c.includes('경북')) return language === 'KR' ? '경북' : 'Gyeongbuk';
  if (c.includes('YEONGNAM') || c.includes('영남')) return language === 'KR' ? '영남' : 'Yeongnam';
  
  if (c === 'GWANGJU' || c === '광주') return language === 'KR' ? '광주' : 'Gwangju';
  if (c.includes('JEONBUK') || c.includes('전북')) return language === 'KR' ? '전북' : 'Jeonbuk';
  if (c.includes('JEONNAM') || c.includes('전남')) return language === 'KR' ? '전남' : 'Jeonnam';
  if (c.includes('JEJU') || c.includes('제주')) return language === 'KR' ? '제주' : 'Jeju';
  if (c.includes('HONAM') || c.includes('호남')) return language === 'KR' ? '호남' : 'Honam';
  
  if (c === 'DAEJEON' || c === '대전') return language === 'KR' ? '대전' : 'Daejeon';
  if (c.includes('SEJONG') || c.includes('세종')) return language === 'KR' ? '세종' : 'Sejong';
  if (c.includes('CHUNGBUK') || c.includes('충북')) return language === 'KR' ? '충북' : 'Chungbuk';
  if (c.includes('CHUNGNAM') || c.includes('충남')) return language === 'KR' ? '충남' : 'Chungnam';
  if (c.includes('CHUNGCHEONG') || c.includes('충청')) return language === 'KR' ? '충청' : 'Chungcheong';
  
  return city;
}

// 아이템과 현재 선택된 전역 location 간의 매칭 검사기
export function matchLocationGroup(selectedCity: string, itemCity?: string): boolean {
  if (!selectedCity || selectedCity === 'ALL') return true;
  if (!itemCity) return false;
  return getCityGroup(selectedCity) === getCityGroup(itemCity);
}
