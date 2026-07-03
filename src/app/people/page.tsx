'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { peopleService, SAMPLE_PEOPLE } from '@/lib/firebase/peopleService';
import { Person, PersonRole } from '@/types/people';

export default function PeoplePage() {
  const { setSubHeader } = useNavigation();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리 파라미터 연동
  const viewParam = searchParams.get('view');
  const roleParam = searchParams.get('role');
  const sectionParam = searchParams.get('section');

  // 상태 관리
  const [people, setPeople] = useState<Person[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGlobal, setIsGlobal] = useState(false); // false: 로컬, true: 글로벌
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // Subscribe Firestore
  useEffect(() => {
    const unsub = peopleService.subscribe(setPeople);
    return () => unsub();
  }, []);

  // SubHeader Injection 제거 (메인 홈일 때 탭바 제거)
  useEffect(() => {
    setSubHeader(null);
    return () => setSubHeader(null);
  }, [setSubHeader]);

  // 하트 토글 핸들러
  const handleToggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 1. 추천 프로필 목데이터 (실데이터 매핑 fallback용)
  const recommendedProfiles = useMemo(() => {
    return [
      {
        id: 'carlos-estigarribia',
        name: 'Carlos Estigarribia',
        roles: ['Teacher', 'Dancer'],
        city: 'Buenos Aires',
        status: '7월 서울 방문',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200'
      },
      {
        id: 'jazmin',
        name: 'Jazmin',
        roles: ['Dancer', 'Teacher'],
        city: 'Seoul',
        status: '클래스 진행 중',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200'
      },
      {
        id: 'claudio-vero',
        name: 'Claudio & Vero',
        roles: ['Dancers', 'Teachers'],
        city: 'Milan',
        status: '8월 내한 예정',
        imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200'
      },
      {
        id: 'magdalena',
        name: 'Magdalena',
        roles: ['DJ', 'Organizer'],
        city: 'Seoul',
        status: '이번 주 DJ',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'
      }
    ];
  }, []);

  // 2. 역할별 탐색 8구 (4x2)
  const rolesGrid = useMemo(() => {
    return [
      { label: '강사', count: '128명', icon: 'coaching', bg: 'bg-violet-50 text-violet-650' },
      { label: '댄서', count: '342명', icon: 'directions_run', bg: 'bg-blue-50 text-blue-600' },
      { label: 'DJ', count: '86명', icon: 'headphones', bg: 'bg-purple-50 text-purple-600' },
      { label: '오거나이저', count: '64명', icon: 'groups', bg: 'bg-orange-50 text-orange-600' },
      { label: '커플', count: '57팀', icon: 'favorite', bg: 'bg-emerald-50 text-emerald-600' },
      { label: '스튜디오 대표', count: '43명', icon: 'domain', bg: 'bg-teal-50 text-teal-600' },
      { label: '게스트 아티스트', count: '91명', icon: 'star', bg: 'bg-amber-50 text-amber-600' },
      { label: '기획자', count: '28명', icon: 'edit_note', bg: 'bg-slate-50 text-slate-500' }
    ];
  }, []);

  // 3. 최근 업데이트 소식
  const recentUpdates = useMemo(() => {
    return [
      { id: '1', name: 'Luna Lee', content: '새로운 클래스 일정이 등록되었습니다.', time: '2시간 전', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150' },
      { id: '2', name: 'Carlos Estigarribia', content: '프로필 정보가 업데이트되었습니다.', time: '5시간 전', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150' },
      { id: '3', name: 'Fausto & Stephanie', content: '서울 투어 일정이 추가되었습니다.', time: '1일 전', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150' }
    ];
  }, []);

  // 4. 서울에서 만날 수 있는 사람
  const seoulMeetups = useMemo(() => {
    return [
      { id: 'luna-lee', name: 'Luna Lee', role: 'Tango Instructor', city: '서울', status: '이번 주 클래스', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=250' },
      { id: 'dj-arbol', name: 'DJ Arbol', role: 'DJ', city: '서울', status: '이번 주 Ocho', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250' },
      { id: 'magdalena-seoul', name: 'Magdalena', role: 'DJ · Organizer', city: '서울', status: '이번 주 DJ', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250' },
      { id: 'tango-brujo', name: 'Tango Brujo', role: 'Studio', city: '서울', status: '연습실 운영', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=250' }
    ];
  }, []);

  // 5. 투어 중인 아티스트
  const touringArtists = useMemo(() => {
    return [
      { name: 'Fausto & Stephanie', location: 'Milan, Italy', duration: '5.20 - 6.10', badge: '클래스 진행 중', statusType: 'active', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300' },
      { name: 'Ira & Saulo', location: 'Seoul, Korea', duration: '7.10 - 7.20', badge: '다음', statusType: 'next', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300' },
      { name: 'Los Totis', location: 'Paris, France', duration: '8.05 - 8.15', badge: '이후', statusType: 'future', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=300' },
      { name: 'Pablo & Ludmila', location: 'Buenos Aires, Argentina', duration: '9월 예정', badge: '계획 중', statusType: 'plan', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300' }
    ];
  }, []);

  // Seed handler
  const handleSeed = async () => {
    setSeeding(true);
    try {
      for (const p of SAMPLE_PEOPLE) {
        await peopleService.add(p as Omit<Person, 'id' | 'createdAt' | 'updatedAt'>);
      }
      alert(t('people.alert_registered'));
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto w-full relative min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="px-5 py-6 pb-32 flex flex-col gap-7 text-left">
        
        {/* 1. 검색바 */}
        <div className="relative w-full flex items-center gap-3">
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl flex items-center px-4 py-3 gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="이름, 역할, 도시 검색" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-slate-800 text-[13.5px] font-bold outline-none flex-1 placeholder:text-slate-350"
            />
          </div>
          <button className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-650 hover:bg-slate-100 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>

        {/* 2. Local / Global 토글 */}
        <div className="flex bg-slate-100/70 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setIsGlobal(false)}
            className={`px-6 py-2 rounded-xl text-[12.5px] font-black tracking-tight transition-all duration-300 ${
              !isGlobal 
                ? 'bg-violet-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            로컬
          </button>
          <button
            onClick={() => setIsGlobal(true)}
            className={`px-6 py-2 rounded-xl text-[12.5px] font-black tracking-tight transition-all duration-300 ${
              isGlobal 
                ? 'bg-violet-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            글로벌
          </button>
        </div>

        {/* 3. 추천 프로필 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">추천 프로필</h2>
            <Link href="/people?section=recommended" className="text-violet-600 font-bold text-[12px] flex items-center gap-0.5">
              전체 보기 <span className="material-symbols-outlined text-base">chevron_right</span>
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5">
            {recommendedProfiles.map((artist) => (
              <div
                key={artist.id}
                className="flex-shrink-0 w-[145px] bg-white border border-slate-100/90 rounded-3xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative"
              >
                {/* 하트 아이콘 */}
                <button
                  onClick={(e) => handleToggleLike(e, artist.id)}
                  className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-slate-350 hover:text-red-500 transition-colors z-10"
                >
                  <span className="material-symbols-rounded text-[15px]" style={{ fontVariationSettings: likedIds.includes(artist.id) ? "'FILL' 1" : "'FILL' 0", color: likedIds.includes(artist.id) ? '#ef4444' : undefined }}>favorite</span>
                </button>

                <div className="w-[72px] h-[72px] rounded-full overflow-hidden mb-3 bg-slate-50 border border-slate-50 relative">
                  <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                </div>
                
                <h3 className="text-[13px] font-black text-slate-850 leading-tight w-full truncate mb-0.5">{artist.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 truncate w-full mb-1">{artist.roles.join(' · ')}</p>
                <p className="text-[10.5px] font-bold text-slate-550 mb-3 truncate w-full">{artist.city}</p>
                
                <span className="text-[10px] font-black text-violet-600 bg-violet-50/80 border border-violet-100/50 w-full py-1.5 rounded-2xl block truncate px-2">
                  {artist.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 역할별 탐색 */}
        <section className="space-y-4">
          <h2 className="text-[16px] font-black text-slate-850 tracking-tight">역할별 탐색</h2>
          <div className="grid grid-cols-4 gap-3">
            {rolesGrid.map((role, idx) => (
              <div
                key={idx}
                onClick={() => router.push(`/people?role=${role.label}`)}
                className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col items-center justify-center cursor-pointer hover:shadow-sm active:scale-[0.97] transition-all min-h-[105px]"
              >
                <div className={`w-10 h-10 rounded-full ${role.bg.split(' ')[0]} flex items-center justify-center mb-2`}>
                  <span className={`material-symbols-outlined ${role.bg.split(' ')[1]} text-xl`}>{role.icon}</span>
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">{role.label}</span>
                <span className="text-[10.5px] font-black text-slate-450 mt-1">{role.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 최근 업데이트 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">최근 업데이트</h2>
            <Link href="/people?section=updates" className="text-violet-600 font-bold text-[12px] flex items-center gap-0.5">
              전체 보기 <span className="material-symbols-outlined text-base">chevron_right</span>
            </Link>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
            {recentUpdates.map((update) => (
              <div key={update.id} className="p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-all">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-50 flex-none relative">
                  <img src={update.img} alt={update.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-bold text-slate-800 leading-tight">
                    <span className="font-black text-slate-850 mr-1.5">{update.name}</span>
                    <span className="text-slate-500 font-semibold">{update.content}</span>
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 flex-none">{update.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. 서울에서 만날 수 있는 사람 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">서울에서 만날 수 있는 사람</h2>
            <Link href="/people?section=local" className="text-violet-600 font-bold text-[12px] flex items-center gap-0.5">
              전체 보기 <span className="material-symbols-outlined text-base">chevron_right</span>
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5">
            {seoulMeetups.map((meetup) => (
              <div
                key={meetup.id}
                className="flex-shrink-0 w-[160px] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm relative group cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <button
                  onClick={(e) => handleToggleLike(e, meetup.id)}
                  className="absolute top-3 right-3 w-6.5 h-6.5 rounded-full bg-black/15 flex items-center justify-center text-white hover:text-red-500 transition-colors z-10"
                >
                  <span className="material-symbols-rounded text-[14px]" style={{ fontVariationSettings: likedIds.includes(meetup.id) ? "'FILL' 1" : "'FILL' 0", color: likedIds.includes(meetup.id) ? '#ef4444' : undefined }}>favorite</span>
                </button>

                <div className="relative aspect-[0.95/1] w-full bg-slate-50 overflow-hidden">
                  <img src={meetup.img} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <h3 className="text-[14px] font-black text-white leading-tight truncate">{meetup.name}</h3>
                    <p className="text-[10px] font-bold text-white/80 truncate mt-0.5">{meetup.role}</p>
                    <div className="flex items-center gap-0.5 text-white/90 text-[10px] font-bold mt-2">
                      <span className="material-symbols-outlined text-[11px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                      {meetup.city}
                    </div>
                  </div>
                </div>
                
                <div className="p-3 text-left">
                  <span className="inline-block text-[9.5px] font-black text-violet-600 bg-violet-50/80 border border-violet-150 px-2.5 py-1 rounded-2xl">
                    {meetup.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. 투어 중인 아티스트 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">투어 중인 아티스트</h2>
            <Link href="/people?section=touring" className="text-violet-600 font-bold text-[12px] flex items-center gap-0.5">
              전체 보기 <span className="material-symbols-outlined text-base">chevron_right</span>
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5">
            {touringArtists.map((artist, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[200px] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm relative group cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="relative aspect-[1.15/1] w-full bg-slate-50 overflow-hidden">
                  <img src={artist.img} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                  
                  {/* 상태 배지 */}
                  <span className={`absolute top-3 left-3 text-[9px] font-black text-white px-2 py-0.5 rounded-md ${
                    artist.statusType === 'active' 
                      ? 'bg-violet-600' 
                      : artist.statusType === 'next' 
                        ? 'bg-blue-600' 
                        : artist.statusType === 'future'
                          ? 'bg-purple-600'
                          : 'bg-slate-500'
                  }`}>
                    {artist.badge}
                  </span>

                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold mb-1">
                      <span className="material-symbols-outlined text-[12px] text-white/70">flight</span>
                      {artist.location}
                    </div>
                    <h3 className="text-[14.5px] font-black text-white leading-tight truncate">{artist.name}</h3>
                  </div>
                </div>
                
                <div className="p-3.5 text-left flex items-center gap-1 text-[11px] font-black text-slate-500">
                  <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
                  <span>{artist.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
