'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { peopleService } from '@/lib/firebase/peopleService';
import { Person, PersonRole } from '@/types/people';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { PlatformUser } from '@/types/user';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';

// 공통 UI 컴포넌트 임포트

import SectionHeader from '@/components/common/SectionHeader';
import HorizontalScroller from '@/components/common/HorizontalScroller';
import CategoryGrid from '@/components/common/CategoryGrid';

export default function PeoplePage() {
  const { setSubHeader } = useNavigation();
  const { location } = useLocation();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리 파라미터 연동
  const viewParam = searchParams.get('view');
  const roleParam = searchParams.get('role');
  const sectionParam = searchParams.get('section');

  // 뒤로가기 버튼으로 풀스크린 닫기
  const closeRoleModal = useCallback(() => router.push('/people'), [router]);
  const closeSectionModal = useCallback(() => router.push('/people'), [router]);
  useBackButtonClose(!!roleParam, closeRoleModal);
  useBackButtonClose(!!sectionParam, closeSectionModal);

  // 상태 관리
  const [people, setPeople] = useState<Person[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);

  const [isGlobal, setIsGlobal] = useState(false); // false: 로컬, true: 글로벌
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // Subscribe Firestore
  useEffect(() => {
    const unsub = peopleService.subscribe(setPeople);
    return () => unsub();
  }, []);

  // Subscribe Users
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }) as PlatformUser);
      setUsers(items);
    });
    return () => unsub();
  }, []);

  // SubHeader Injection 제거 (메인 홈일 때 탭바 제거)
  useEffect(() => {
    setSubHeader(null);
    return () => setSubHeader(null);
  }, [setSubHeader]);

  // people 컬렉션의 userId → Person 빠른 조회 맵
  const peopleByUserId = useMemo(() => {
    const map = new Map<string, Person>();
    people.forEach(p => {
      if (p.userId) map.set(p.userId, p);
    });
    return map;
  }, [people]);

  // 하트 토글 핸들러
  const handleToggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 1. 추천 프로필 목데이터 (실데이터 매핑 fallback용)
  // 0. 활성 지역 변수
  const activeCity = location.city || 'Seoul';
  const activeCityName = activeCity.toLowerCase() === 'seoul' ? '서울' : activeCity.toLowerCase() === 'busan' ? '부산' : activeCity;

  // 1. 추천 프로필 (전체 피플 중 상위 6명, 없으면 목데이터 fallback)
  const recommendedProfiles = useMemo(() => {
    const dbFeatured = people.filter(p => p.heroImageUrl && p.profilePhotoUrl);
    if (dbFeatured.length > 0) {
      return dbFeatured.slice(0, 6).map(p => ({
        id: p.id,
        name: p.name,
        roles: p.roles,
        city: p.baseCity,
        status: p.liveStatus || '클래스 진행 중',
        imageUrl: p.profilePhotoUrl
      }));
    }
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
  }, [people]);

  // 2. 역할별 탐색 4구 (강사, DJ, 오거나이저, 판매자) — users 컬렉션 boolean 플래그 기반
  const getUserCount = (role: string) => {
    switch (role) {
      case '강사': return users.filter(u => u.isInstructor === true).length;
      case 'DJ': return users.filter(u => u.isDj === true).length;
      case '오거나이저': return users.filter(u => u.isOrganizer === true).length;
      case '판매자': return users.filter(u => u.isSeller === true).length;
      default: return 0;
    }
  };

  const rolesGrid = useMemo(() => {
    return [
      { label: '강사', count: `${users.filter(u => u.isInstructor === true).length}명`, icon: 'school', bg: 'bg-violet-50 text-violet-650' },
      { label: 'DJ', count: `${users.filter(u => u.isDj === true).length}명`, icon: 'headphones', bg: 'bg-purple-50 text-purple-600' },
      { label: '오거나이저', count: `${users.filter(u => u.isOrganizer === true).length}명`, icon: 'groups', bg: 'bg-orange-50 text-orange-600' },
      { label: '판매자', count: `${users.filter(u => u.isSeller === true).length}명`, icon: 'shopping_bag', bg: 'bg-blue-50 text-blue-600' }
    ];
  }, [users]);

  // 역할 그리드용 공통 어댑터 매핑
  const portalRoles = useMemo(() => {
    return rolesGrid.map((role) => ({
      id: role.label,
      label: role.label,
      count: role.count,
      icon: role.icon,
      bg: role.bg,
      onClick: () => router.push(`/people?role=${role.label}`)
    }));
  }, [rolesGrid, router]);

  // 3. 최근 업데이트 소식
  const recentUpdates = useMemo(() => {
    const sorted = [...people].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
    if (sorted.length > 0) {
      return sorted.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        content: p.title || '프로필 정보가 업데이트되었습니다.',
        time: '최근 업데이트',
        img: p.profilePhotoUrl
      }));
    }
    return [
      { id: '1', name: 'Luna Lee', content: '새로운 클래스 일정이 등록되었습니다.', time: '2시간 전', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150' },
      { id: '2', name: 'Carlos Estigarribia', content: '프로필 정보가 업데이트되었습니다.', time: '5시간 전', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150' },
      { id: '3', name: 'Fausto & Stephanie', content: '서울 투어 일정이 추가되었습니다.', time: '1일 전', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150' }
    ];
  }, [people]);

  // 4. 활성 지역에서 만날 수 있는 사람 — users 컬렉션 기반
  const localMeetups = useMemo(() => {
    // people 컬렉션에서 도시 매칭 (확장 프로필 보유자)
    const fromPeople = people.filter(p => {
      const matchesCurrent = p.currentCity?.toLowerCase() === activeCity.toLowerCase();
      const matchesBase = p.baseCity?.toLowerCase() === activeCity.toLowerCase();
      return (matchesCurrent || matchesBase);
    }).map(p => ({
      id: p.id,
      name: p.name,
      role: p.roles.join(' · '),
      city: p.currentCity || p.baseCity,
      status: p.liveStatus || t('people.local_active', '활동 중'),
      img: p.profilePhotoUrl,
      hasPeopleProfile: true
    }));
    return fromPeople;
  }, [people, activeCity, t]);

  // 5. 투어 중인 아티스트
  const touringArtists = useMemo(() => {
    const touring = people.filter(p => p.roles.includes('Touring') || (p.tourStops && p.tourStops.length > 0));
    if (touring.length > 0) {
      return touring.map(p => {
        const nextStop = p.tourStops?.[0];
        return {
          id: p.id,
          name: p.name,
          location: nextStop ? `${nextStop.city}, ${nextStop.country}` : p.baseCity,
          duration: nextStop ? nextStop.month : '일정 확인',
          badge: p.liveStatus || '투어 중',
          statusType: 'active',
          img: p.profilePhotoUrl
        };
      });
    }
    return [
      { id: 'fausto-stephanie', name: 'Fausto & Stephanie', location: 'Milan, Italy', duration: '5.20 - 6.10', badge: '클래스 진행 중', statusType: 'active', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300' },
      { id: 'ira-saulo', name: 'Ira & Saulo', location: 'Seoul, Korea', duration: '7.10 - 7.20', badge: '다음', statusType: 'next', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300' },
      { id: 'los-totis', name: 'Los Totis', location: 'Paris, France', duration: '8.05 - 8.15', badge: '이후', statusType: 'future', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=300' },
      { name: 'Pablo & Ludmila', location: 'Buenos Aires, Argentina', duration: '9월 예정', badge: '계획 중', statusType: 'plan', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300' }
    ];
  }, [people]);



  return (
    <main className="max-w-4xl mx-auto w-full relative min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="px-5 py-6 pb-32 flex flex-col gap-7 text-left">

        {/* 3. 추천 프로필 (SectionHeader & HorizontalScroller 적용) */}
        <section className="space-y-4">
          <SectionHeader 
            title={t('people.section_recommended', '추천 프로필')}
            actionLabel={t('people.view_all', '전체 보기')}
            onAction={() => router.push('/people?section=recommended')}
          />

          <HorizontalScroller>
            {recommendedProfiles.map((artist) => (
              <div
                key={artist.id}
                onClick={() => router.push(`/people/${artist.id}`)}
                className="flex-shrink-0 w-[145px] bg-white border border-slate-100/90 rounded-3xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
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
          </HorizontalScroller>
        </section>

        {/* 4. 역할별 탐색 (SectionHeader & CategoryGrid 적용) */}
        <section className="space-y-4">
          <SectionHeader title="역할별 탐색" />
          <CategoryGrid items={portalRoles} />
        </section>

        {/* 5. 최근 업데이트 (SectionHeader 적용) */}
        <section className="space-y-4">
          <SectionHeader 
            title={t('people.section_updates', '최근 업데이트')}
            actionLabel={t('people.view_all', '전체 보기')}
            onAction={() => router.push('/people?section=updates')}
          />

          <div className="bg-white border border-slate-100 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
            {recentUpdates.map((update) => (
              <div 
                key={update.id} 
                onClick={() => router.push(`/people/${update.id}`)}
                className="p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-all cursor-pointer"
              >
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

        {/* 6. 동적 지역 매핑 적용한 인물 목록 */}
        {localMeetups.length > 0 && (
        <section className="space-y-4">
          <SectionHeader 
            title={`${activeCityName}에서 만날 수 있는 사람`}
            actionLabel={t('people.view_all', '전체 보기')}
            onAction={() => router.push('/people?section=local')}
          />

          <HorizontalScroller>
            {localMeetups.map((meetup) => (
              <div
                key={meetup.id}
                onClick={() => router.push(`/people/${meetup.id}`)}
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
          </HorizontalScroller>
        </section>
        )}

        {/* 7. 투어 중인 아티스트 (SectionHeader & HorizontalScroller 적용) */}
        <section className="space-y-4">
          <SectionHeader 
            title={t('people.section_touring', '투어 중인 아티스트')}
            actionLabel={t('people.view_all', '전체 보기')}
            onAction={() => router.push('/people?section=touring')}
          />

          <HorizontalScroller>
            {touringArtists.map((artist, idx) => (
              <div
                key={idx}
                onClick={() => artist.id && router.push(`/people/${artist.id}`)}
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
          </HorizontalScroller>
        </section>


      </div>

      {/* Role Filter Modal */}
      {roleParam && (
        <div className="fixed inset-0 z-[150] bg-background overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 pt-16">
          <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[160] border-b border-slate-100">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/people')}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-on-surface"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold font-headline text-on-surface">
                  {roleParam}
                </h1>
              </div>
            </div>
          </header>

          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.filter(u => {
                switch (roleParam) {
                  case '강사': return u.isInstructor === true;
                  case 'DJ': return u.isDj === true;
                  case '오거나이저': return u.isOrganizer === true;
                  case '판매자': return u.isSeller === true;
                  default: return false;
                }
              }).map((member) => {
                const personProfile = peopleByUserId.get(member.id);
                const targetUrl = personProfile
                  ? `/people/${personProfile.id}`
                  : `/people/${member.id}?preview=1`;
                return (
                  <div 
                    key={member.id}
                    onClick={() => router.push(targetUrl)}
                    className="bg-white border border-slate-100 rounded-3xl p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-50 flex-none relative border border-slate-100 shadow-sm">
                      {member.photoURL ? (
                        <img src={member.photoURL} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-xl font-black">
                          {(member.nickname || '?')[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left flex flex-col justify-between py-0.5">
                      <div>
                        <h3 className="text-[14.5px] font-black text-slate-850 truncate leading-tight">{member.nickname || member.nativeNickname || '이름 없음'}</h3>
                        <p className="text-[11px] font-bold text-slate-450 mt-1 truncate">{member.career || member.email || ''}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>{roleParam}</span>
                        {personProfile ? (
                          <span className="text-[10.5px] font-bold text-violet-650 bg-violet-50 px-2 py-0.5 rounded-lg">{t('people.view_profile', '프로필 보기')}</span>
                        ) : (
                          <span className="text-[10.5px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{t('people.basic_info', '기본 정보')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {users.filter(u => {
                switch (roleParam) {
                  case '강사': return u.isInstructor === true;
                  case 'DJ': return u.isDj === true;
                  case '오거나이저': return u.isOrganizer === true;
                  case '판매자': return u.isSeller === true;
                  default: return false;
                }
              }).length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                  <p className="text-sm font-bold">{t('people.no_members_role', '해당 역할의 멤버가 아직 등록되지 않았습니다.')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Section Full View */}
      {sectionParam && (
        <div className="fixed inset-0 z-[150] bg-background overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 pt-16">
          <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[160] border-b border-slate-100">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/people')}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-on-surface"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold font-headline text-on-surface">
                  {sectionParam === 'recommended' ? t('people.section_recommended', '추천 프로필')
                    : sectionParam === 'updates' ? t('people.section_updates', '최근 업데이트')
                    : sectionParam === 'local' ? `${activeCityName}${t('people.section_local_suffix', '에서 만날 수 있는 사람')}`
                    : sectionParam === 'touring' ? t('people.section_touring', '투어 중인 아티스트')
                    : ''}
                </h1>
              </div>
            </div>
          </header>

          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* 추천 프로필 전체보기 */}
            {sectionParam === 'recommended' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {recommendedProfiles.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => router.push(`/people/${artist.id}`)}
                    className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-slate-50 border border-slate-50">
                      <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-[13px] font-black text-slate-850 leading-tight w-full truncate mb-0.5">{artist.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 truncate w-full">{artist.roles.join(' · ')}</p>
                    <p className="text-[10.5px] font-bold text-slate-550 truncate w-full mt-1">{artist.city}</p>
                  </div>
                ))}
                {recommendedProfiles.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                    <p className="text-sm font-bold">{t('people.no_data', '데이터가 없습니다.')}</p>
                  </div>
                )}
              </div>
            )}

            {/* 최근 업데이트 전체보기 */}
            {sectionParam === 'updates' && (
              <div className="bg-white border border-slate-100 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                {recentUpdates.map((update) => (
                  <div
                    key={update.id}
                    onClick={() => router.push(`/people/${update.id}`)}
                    className="p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-50 flex-none">
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
                {recentUpdates.length === 0 && (
                  <div className="py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                    <p className="text-sm font-bold">{t('people.no_data', '데이터가 없습니다.')}</p>
                  </div>
                )}
              </div>
            )}

            {/* 도시 인물 전체보기 */}
            {sectionParam === 'local' && (
              <div className="grid grid-cols-2 gap-4">
                {localMeetups.map((meetup) => (
                  <div
                    key={meetup.id}
                    onClick={() => router.push(`/people/${meetup.id}`)}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                      <img src={meetup.img} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-left">
                        <h3 className="text-[13px] font-black text-white leading-tight truncate">{meetup.name}</h3>
                        <p className="text-[10px] font-bold text-white/80 truncate mt-0.5">{meetup.role}</p>
                      </div>
                    </div>
                    <div className="p-3 text-left">
                      <span className="inline-block text-[9.5px] font-black text-violet-600 bg-violet-50/80 border border-violet-150 px-2.5 py-1 rounded-2xl">{meetup.status}</span>
                    </div>
                  </div>
                ))}
                {localMeetups.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                    <p className="text-sm font-bold">{t('people.no_data', '데이터가 없습니다.')}</p>
                  </div>
                )}
              </div>
            )}

            {/* 투어 아티스트 전체보기 */}
            {sectionParam === 'touring' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {touringArtists.map((artist, idx) => (
                  <div
                    key={idx}
                    onClick={() => artist.id && router.push(`/people/${artist.id}`)}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="relative aspect-[1.5/1] w-full bg-slate-50 overflow-hidden">
                      <img src={artist.img} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                      <span className={`absolute top-3 left-3 text-[9px] font-black text-white px-2 py-0.5 rounded-md ${
                        artist.statusType === 'active' ? 'bg-violet-600'
                          : artist.statusType === 'next' ? 'bg-blue-600'
                          : artist.statusType === 'future' ? 'bg-purple-600' : 'bg-slate-500'
                      }`}>{artist.badge}</span>
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
                {touringArtists.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                    <p className="text-sm font-bold">{t('people.no_data', '데이터가 없습니다.')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
