'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import MyGroupsTray from '@/components/groups/MyGroupsTray';
import GroupDetail from '@/components/groups/GroupDetail';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import { useGroupsData } from './hooks/useGroupsData';
import { 
  extractDong, 
  discoveryCategories 
} from './constants/groupConstants';
import { Group } from '@/types/group';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';

// 공통 UI 컴포넌트 임포트
import SearchHeader from '@/components/common/SearchHeader';
import SectionHeader from '@/components/common/SectionHeader';
import HorizontalScroller from '@/components/common/HorizontalScroller';
import CategoryGrid from '@/components/common/CategoryGrid';

export default function GroupsPageContent() {
  const router = useRouter();
  const {
    groups,
    loading,
    selectedGroup,
    isCreateOpen,
    createLoading,
    venueType,
    setVenueType,
    venueSearch,
    setVenueSearch,
    venueResults,
    setVenueResults,
    selectedVenue,
    setSelectedVenue,
    venueSearchLoading,
    createForm,
    setCreateForm,
    selectedCategory,
    userJoinedGroups,
    whatsNewGroups,
    categoryCounts,
    t,
    language,
    openCategoryModal,
    openCreateModal,
    handleGroupSelect,
    closeModals,
    handleCreateClose,
    getFilteredGroups,
    handleVenueSearch,
    handleCreateSubmit,
    fetchGroups
  } = useGroupsData();

  // 뒤로가기 버튼으로 모달/풀스크린 닫기 (그룹 디테일 및 생성 모달은 해당 컴포넌트 내부에서 자체 처리)
  useBackButtonClose(!!selectedCategory, closeModals);

  // 8개 지정 카테고리 맵핑 데이터
  const portalCategories = React.useMemo(() => {
    const counts = categoryCounts as Record<string, number>;
    return [
      { id: 'Studio', label: '스튜디오', icon: 'domain', bg: 'bg-blue-50 text-blue-600', count: counts['Studio'] || 55 },
      { id: 'Shop', label: '마켓', icon: 'shopping_bag', bg: 'bg-purple-50 text-purple-650', count: counts['Shop'] || 11 },
      { id: 'Academy', label: '아카데미', icon: 'school', bg: 'bg-indigo-50 text-indigo-600', count: counts['Academy'] || 1 },
      { id: 'Stay', label: '스테이', icon: 'bed', bg: 'bg-pink-50 text-pink-600', count: counts['Stay'] || 5 },
      { id: 'Class', label: '클래스', icon: 'edit_road', bg: 'bg-emerald-50 text-emerald-600', count: counts['Class'] || 32 },
      { id: 'Event', label: '이벤트', icon: 'calendar_month', bg: 'bg-orange-50 text-orange-650', count: counts['Event'] || 8 },
      { id: 'Social', label: '소셜', icon: 'groups', bg: 'bg-amber-50 text-amber-600', count: counts['Social'] || 70 },
      { id: 'Others', label: '기타', icon: 'more_horiz', bg: 'bg-slate-50 text-slate-500', count: counts['Others'] || 3 }
    ];
  }, [categoryCounts]);

  // 카테고리 그리드용 공통 어댑터 매핑
  const categoryGridItems = React.useMemo(() => {
    return portalCategories.map((cat) => ({
      id: cat.id,
      label: cat.label,
      count: typeof cat.count === 'number' ? `${cat.count}개` : cat.count,
      icon: cat.icon,
      bg: cat.bg,
      onClick: () => openCategoryModal(cat.id)
    }));
  }, [portalCategories, openCategoryModal]);

  // Jump 소사이어티 목데이터
  const jumpSocieties = React.useMemo(() => {
    return [
      { name: 'Tango Seoul', icon: 'domain', bgImg: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300', iconBg: 'bg-blue-600 text-white', path: '/home?society=tango' },
      { name: 'Salsa Seoul', icon: 'groups', bgImg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300', iconBg: 'bg-red-500 text-white', path: '/home?society=salsa' },
      { name: 'Bachata Seoul', icon: 'favorite', bgImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300', iconBg: 'bg-sky-500 text-white', path: '/home?society=bachata' },
      { name: 'Yoga Seoul', icon: 'self_care', bgImg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=300', iconBg: 'bg-emerald-500 text-white', path: '/home?society=yoga' },
      { name: 'Running Seoul', icon: 'directions_run', bgImg: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=300', iconBg: 'bg-orange-500 text-white', path: '/home?society=running' }
    ];
  }, []);

  const GroupCoverImage = ({ group, className = "" }: { group: Group, className?: string }) => {
    return (
      <ImageWithFallback
        alt={group.name}
        className={`w-full h-full object-cover transition-transform duration-500 ${className}`}
        src={group.coverImage || ""}
        fallbackType="cover"
        category={group.tags?.[0] || ''}
      />
    );
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-32 relative font-body">
      <main className="max-w-4xl mx-auto px-5 pt-0 pb-6 space-y-7">
        
        {/* 2. 새로운 모임 */}
        <section className="space-y-4 text-left">
          <SectionHeader 
            title="새로운 모임"
          />

          <HorizontalScroller>
            {whatsNewGroups.slice(0, 3).map((group) => (
              <div 
                key={group.id} 
                onClick={() => handleGroupSelect(group)}
                className="flex-shrink-0 w-[220px] bg-white border border-slate-100/80 rounded-3xl overflow-hidden shadow-sm relative group cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="relative aspect-[0.95/1] w-full bg-slate-50 overflow-hidden">
                  <GroupCoverImage group={group} className="group-hover:scale-103 transition-transform" />
                  
                  {group.address && (
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-0.5 rounded-full text-[9px] font-black text-slate-850 flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[10px] text-blue-600 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                      {extractDong(group.address, language)}
                    </div>
                  )}

                  <button className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/15 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[14px]">more_vert</span>
                  </button>
                </div>
                
                <div className="p-4 text-left">
                  <h3 className="text-[13.5px] font-black text-slate-800 leading-tight truncate">
                    {group.name}
                  </h3>
                  {group.nativeName && (
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                      {group.nativeName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3.5 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px] text-slate-400">groups</span>
                      {group.memberCount}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px] text-slate-400">menu_book</span>
                      {group.tags?.[0] ? t(`groups.cat_${group.tags[0].toLowerCase()}`) : '커뮤니티'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* 마지막 [더 많은 모임] 카드 유지 */}
            <div 
              onClick={() => openCategoryModal('All')}
              className="flex-shrink-0 w-[110px] bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-slate-100 active:scale-95 transition-all text-center min-h-[220px]"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-550 mb-3">
                <span className="material-symbols-outlined text-lg">groups</span>
              </div>
              <span className="text-[11px] font-black text-slate-700 leading-tight">더 많은 모임</span>
              <span className="material-symbols-outlined text-slate-400 text-base mt-2">arrow_forward</span>
            </div>
          </HorizontalScroller>
        </section>

        {/* 3. 카테고리 (SectionHeader & CategoryGrid 적용) */}
        <section className="space-y-4 text-left">
          <SectionHeader title="카테고리" />
          <CategoryGrid items={categoryGridItems} />
        </section>

        {/* 4. 다른 소사이어티로 이동 (SectionHeader & HorizontalScroller 적용) */}
        <section className="space-y-4 text-left">
          <SectionHeader title="Jump! 다른 소사이어티로 이동" />

          <HorizontalScroller>
            {jumpSocieties.map((society, idx) => (
              <div 
                key={idx}
                onClick={() => router.push(society.path)}
                className="flex-shrink-0 w-[120px] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="relative aspect-[1/1] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  <img 
                    src={society.bgImg} 
                    className="w-full h-full object-cover brightness-[0.75]" 
                    alt="" 
                  />
                  <div className={`absolute w-8 h-8 rounded-full ${society.iconBg} flex items-center justify-center shadow-sm`}>
                    <span className="material-symbols-outlined text-base">{society.icon}</span>
                  </div>
                  <div className="absolute bottom-2.5 left-0 right-0 px-2 text-center">
                    <span className="text-[11.5px] font-black text-white leading-tight drop-shadow-md">
                      {society.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScroller>
        </section>

      </main>

      {/* Category Filter Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[110] bg-background overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 pt-16">
          <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[120] border-b border-slate-100">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeModals}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-on-surface"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold font-headline text-on-surface">
                  {selectedCategory === 'All' ? t('groups.discover_all') : `${t('groups.category_title_prefix')}${t(`groups.cat_${selectedCategory.toLowerCase()}`)}`}
                </h1>
              </div>
            </div>
          </header>

          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredGroups().map((group) => (
                <div 
                  key={group.id}
                  onClick={() => handleGroupSelect(group)}
                  className="bg-white border border-slate-100 rounded-3xl p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 flex-none relative">
                    <GroupCoverImage group={group} />
                  </div>
                  <div className="flex-1 min-w-0 text-left flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="text-[14.5px] font-black text-slate-850 truncate leading-tight">{group.name}</h3>
                      <p className="text-[11px] font-bold text-slate-450 mt-1 truncate">{(group as any).locationDescription}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-slate-450">group</span>
                        {(group.memberIds || []).length}명 참여
                      </span>
                      <span className="text-[10.5px] font-bold text-violet-650 bg-violet-50 px-2 py-0.5 rounded-lg">가입하기</span>
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredGroups().length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                  <p className="text-sm font-bold">{t('groups.no_groups_in_category')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={handleCreateClose}
        onSuccess={fetchGroups}
      />

      {/* Group Detail Overlay */}
      {selectedGroup && (
        <GroupDetail group={selectedGroup} isModal={true} onClose={closeModals} />
      )}

      {/* Floating Action Button (Tray) for My Groups */}
      {userJoinedGroups.length > 0 && (
        <MyGroupsTray groups={userJoinedGroups} onGroupSelect={handleGroupSelect} />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
