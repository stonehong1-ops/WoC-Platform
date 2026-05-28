export const DONG_ROMANIZE: Record<string, string> = {
  '합정동': 'Hapjeong-dong', '서교동': 'Seogyo-dong', '상수동': 'Sangsu-dong',
  '망원동': 'Mangwon-dong', '연남동': 'Yeonnam-dong', '성산동': 'Seongsan-dong',
  '이태원동': 'Itaewon-dong', '한남동': 'Hannam-dong', '청담동': 'Cheongdam-dong',
  '압구정동': 'Apgujeong-dong', '신사동': 'Sinsa-dong', '역삼동': 'Yeoksam-dong',
  '삼성동': 'Samsung-dong', '강남동': 'Gangnam-dong', '서초동': 'Seocho-dong',
  '방배동': 'Bangbae-dong', '논현동': 'Nonhyeon-dong', '대치동': 'Daechi-dong',
  '잠실동': 'Jamsil-dong', '송파동': 'Songpa-dong', '홍대동': 'Hongdae-dong',
  '을지로동': 'Euljiro-dong', '명동': 'Myeongdong', '종로동': 'Jongno-dong',
  '혜화동': 'Hyehwa-dong', '동대문동': 'Dongdaemun-dong', '마포동': 'Mapo-dong',
  '용산동': 'Yongsan-dong', '구로동': 'Guro-dong', '영등포동': 'Yeongdeungpo-dong',
  '여의도동': 'Yeouido-dong', '관악동': 'Gwanak-dong', '봉천동': 'Bongcheon-dong',
  '신림동': 'Sillim-dong', '건대동': 'Geondae-dong', '성수동': 'Seongsu-dong',
  '왕십리동': 'Wangsimni-dong', '행당동': 'Haengdang-dong', '금호동': 'Geumho-dong',
  '옥수동': 'Oksu-dong', '약수동': 'Yaksu-dong', '신당동': 'Sindang-dong',
  '교대동': 'Gyodae-dong', '선릉동': 'Seolleung-dong',
};

export const extractDong = (address: string, lang?: string): string => {
  if (!address) return '';
  const dongMatch = address.match(/(\S+동)/);
  if (dongMatch) {
    const dong = dongMatch[1];
    if (lang === 'en') return DONG_ROMANIZE[dong] || dong;
    return dong;
  }
  const parts = address.split(/\s+/);
  if (parts.length >= 3) return parts[2];
  if (parts.length >= 2) return parts[1];
  return address;
};

export const discoveryCategories = [
  { id: 'Studio', icon: 'palette', color: 'bg-primary-container', text: 'text-primary' },
  { id: 'Shop', icon: 'shopping_bag', color: 'bg-secondary-container', text: 'text-secondary' },
  { id: 'Academy', icon: 'school', color: 'bg-blue-100', text: 'text-blue-900' },
  { id: 'Stay', icon: 'bed', color: 'bg-tertiary-container', text: 'text-tertiary' },
  { id: 'Rental', icon: 'meeting_room', color: 'bg-slate-100', text: 'text-slate-900' },
  { id: 'Beauty', icon: 'face_retouching_natural', color: 'bg-pink-100', text: 'text-pink-900' },
  { id: 'Wellness', icon: 'self_care', color: 'bg-rose-100', text: 'text-rose-900' },
  { id: 'Restaurant', icon: 'restaurant', color: 'bg-orange-100', text: 'text-orange-900' },
  { id: 'Cafe', icon: 'local_cafe', color: 'bg-amber-100', text: 'text-amber-900' },
  { id: 'Office', icon: 'work', color: 'bg-slate-100', text: 'text-slate-900' }
];
