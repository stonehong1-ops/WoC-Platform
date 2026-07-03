'use client';

import React from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import MyGroupsTray from '@/components/groups/MyGroupsTray';
import GroupDetail from '@/components/groups/GroupDetail';
import { useGroupsData } from './hooks/useGroupsData';
import { 
  extractDong, 
  discoveryCategories 
} from './constants/groupConstants';
import { Group } from '@/types/group';

export default function GroupsPageContent() {
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
    handleCreateSubmit
  } = useGroupsData();

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

  // Jump 소사이어티 목데이터
  const jumpSocieties = React.useMemo(() => {
    return [
      { name: 'Tango Seoul', icon: 'domain', bgImg: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300', iconBg: 'bg-blue-600 text-white' },
      { name: 'Salsa Seoul', icon: 'groups', bgImg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300', iconBg: 'bg-red-500 text-white' },
      { name: 'Bachata Seoul', icon: 'favorite', bgImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300', iconBg: 'bg-sky-500 text-white' },
      { name: 'Yoga Seoul', icon: 'self_care', bgImg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=300', iconBg: 'bg-emerald-500 text-white' },
      { name: 'Running Seoul', icon: 'directions_run', bgImg: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=300', iconBg: 'bg-orange-500 text-white' }
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
      <main className="max-w-4xl mx-auto px-5 py-6 space-y-7">
        
        {/* 1. 검색바 */}
        <div className="relative w-full flex items-center gap-3">
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl flex items-center px-4 py-3 gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="모임, 그룹, 장소 검색" 
              value={venueSearch}
              onChange={(e) => setVenueSearch(e.target.value)}
              className="bg-transparent border-none text-slate-800 text-[13.5px] font-bold outline-none flex-1 placeholder:text-slate-350"
            />
          </div>
          <button className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-650 hover:bg-slate-100 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>

        {/* 2. 새로운 모임 */}
        <section className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black text-slate-800 tracking-tight">새로운 모임</h2>
            <span className="material-symbols-outlined text-slate-350 text-[18px]">chevron_right</span>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5">
            {whatsNewGroups.slice(0, 3).map((group) => (
              <div 
                key={group.id}
                onClick={() => handleGroupSelect(group)}
                className="flex-shrink-0 w-[220px] bg-white border border-slate-100/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="relative aspect-[0.95/1] w-full bg-slate-50 overflow-hidden">
                  <GroupCoverImage group={group} className="group-hover:scale-103" />
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

            {/* 마지막 더 많은 모임 카드 */}
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
          </div>
        </section>

        {/* 3. 카테고리 8구 그리드 */}
        <section className="space-y-4 text-left">
          <h2 className="text-[16px] font-black text-slate-800 tracking-tight">카테고리</h2>
          <div className="grid grid-cols-4 gap-3">
            {portalCategories.map((cat) => (
              <div 
                key={cat.id}
                onClick={() => openCategoryModal(cat.id)}
                className="bg-white border border-slate-100/80 rounded-3xl p-3 flex flex-col items-center justify-center cursor-pointer hover:shadow-sm active:scale-[0.97] transition-all min-h-[105px]"
              >
                <div className={`w-10 h-10 rounded-full ${cat.bg.split(' ')[0]} flex items-center justify-center mb-2`}>
                  <span className={`material-symbols-outlined ${cat.bg.split(' ')[1]} text-xl`}>{cat.icon}</span>
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">{cat.label}</span>
                <span className="text-[10.5px] font-black text-slate-500 mt-1">{cat.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Jump! 다른 소사이어티로 이동 */}
        <section className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black text-slate-800 tracking-tight">Jump! 다른 소사이어티로 이동</h2>
            <span className="material-symbols-outlined text-slate-350 text-[18px]">chevron_right</span>
          </div>

          <div className="flex overflow-x-auto gap-3.5 no-scrollbar pb-2 -mx-5 px-5">
            {jumpSocieties.map((society, idx) => (
              <div 
                key={idx}
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
          </div>
        </section>

      </main>

      {/* Category Detail Overlay */}
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

          <main className="max-w-2xl mx-auto px-4 space-y-6 pb-20 pt-8">
            {getFilteredGroups().length > 0 ? getFilteredGroups().map((group, index) => (
              <article
                key={group.id}
                onClick={() => {
                  handleGroupSelect(group);
                }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-shadow group cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <GroupCoverImage group={group} className="group-hover:scale-105" />
                  {index === 0 && (
                    <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg tracking-wider">
                      {t('groups.featured_badge')}
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`} alt="User" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=User&background=random`} alt="User" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">+{group.memberCount > 2 ? group.memberCount - 2 : 0}</div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <h2 className="text-xl font-bold font-headline text-on-surface mb-1 w-full truncate flex items-baseline gap-2">
                        <span>{group.name}</span>
                        {group.nativeName && <span className="text-[0.7em] font-bold text-on-surface-variant/90">{group.nativeName}</span>}
                      </h2>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-1.5">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        <span>{t('groups.owned_by')}{group.representative?.name || t('groups.leader_fallback')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-white font-black text-xs bg-primary px-3 py-1.5 rounded-xl shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">groups</span>
                        {group.memberCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {(() => {
                      const strategy = group.membershipPolicy?.joinStrategy || 'open';
                      if (strategy === 'open') return (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          {t('groups.policy_open_label') || 'OPEN'}
                        </span>
                      );
                      if (strategy === 'approval') return (
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                          {t('groups.policy_approval_label') || 'APPROVAL'}
                        </span>
                      );
                      return (
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                          {t('groups.policy_invite_label') || 'INVITE'}
                        </span>
                      );
                    })()}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="bg-gradient-to-br from-primary to-[#4d8eff] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm"
                    >
                      {t('groups.join_button')}
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">search_off</span>
                <p className="font-medium">{t('groups.no_communities_found')}</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Create New Group Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[130] bg-surface-bright text-on-surface font-body-md antialiased flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex-shrink-0 fixed top-0 w-full z-[140] flex items-center justify-between px-4 h-16 bg-white shadow-sm border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateClose}
                className="p-2 rounded-full active:scale-95 duration-150 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
              <h1 className="font-title-md text-title-md text-on-surface truncate">{t('groups.create_modal_title')}</h1>
            </div>
            <button
              onClick={handleCreateSubmit}
              disabled={createLoading}
              className="px-5 py-2 rounded-xl bg-primary-container text-white font-title-md text-body-md hover:opacity-90 active:scale-95 duration-150 transition-all disabled:opacity-40"
            >
              {createLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('groups.save_button_loading')}</span>
                </div>
              ) : (
                <span>{t('groups.save_button')}</span>
              )}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto py-6 pb-32 pt-20 px-[1.5rem] max-w-[56rem] mx-auto w-full no-scrollbar space-y-6">
            {/* Section: Basic Info */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">{t('groups.form_name_label')}</label>
                  <input
                    className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg p-3 text-on-surface font-medium transition-all"
                    placeholder={t('groups.form_name_placeholder')}
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">{t('groups.form_description_label')}</label>
                  <textarea
                    className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg p-3 text-on-surface font-medium transition-all resize-none"
                    placeholder={t('groups.form_description_placeholder')}
                    rows={4}
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Section: Activity Type (Online vs Venue) */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">{t('groups.form_venue_type_label')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'online' as const, icon: 'language', label: t('groups.venue_type_online'), desc: t('groups.venue_type_online_desc') },
                  { id: 'venue' as const, icon: 'location_on', label: t('groups.venue_type_venue'), desc: t('groups.venue_type_venue_desc') }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setVenueType(opt.id);
                      if (opt.id === 'online') {
                        setSelectedVenue(null);
                        setVenueSearch('');
                        setVenueResults([]);
                        const onlineRestricted = ['Stay', 'Rental', 'Restaurant', 'Cafe'];
                        if (onlineRestricted.includes(createForm.category)) {
                          setCreateForm(prev => ({ ...prev, category: 'Studio' }));
                        }
                      }
                    }}
                    className={`relative p-5 rounded-xl border-2 cursor-pointer group hover:shadow-md transition-all ${venueType === opt.id
                      ? 'border-primary bg-primary-container/5'
                      : 'border-outline-variant/30 bg-white hover:border-outline'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`material-symbols-outlined text-2xl ${venueType === opt.id ? 'text-primary' : 'text-outline'}`}>{opt.icon}</span>
                      <div className={`w-5 h-5 rounded-full border-4 bg-white ${venueType === opt.id ? 'border-primary' : 'border-outline-variant'}`}></div>
                    </div>
                    <p className="font-bold text-sm mb-1">{opt.label}</p>
                    <p className="text-[12px] text-on-surface-variant font-medium">{opt.desc}</p>
                  </div>
                ))}
              </div>

              {/* Venue Search (only when venue type selected) */}
              {venueType === 'venue' && (
                <div className="mt-5 space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">{t('groups.venue_search_label')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
                    <input
                      className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg p-3 pl-12 text-on-surface font-medium transition-all"
                      placeholder={t('groups.venue_search_placeholder')}
                      type="text"
                      value={venueSearch}
                      onChange={(e) => handleVenueSearch(e.target.value)}
                    />
                    {venueSearchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Venue results list */}
                  {venueResults.length > 0 && !selectedVenue && (
                    <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 max-h-48 overflow-y-auto">
                      {venueResults.map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVenue(v);
                            setVenueSearch(v.name);
                            setVenueResults([]);
                            if (v.category) {
                              const validCats = ['Studio', 'Shop', 'Academy', 'Stay', 'Rental', 'Beauty', 'Wellness', 'Restaurant', 'Cafe', 'Office'];
                              const match = validCats.find(c => c.toLowerCase() === v.category.toLowerCase());
                              if (match) setCreateForm(prev => ({ ...prev, category: match }));
                            }
                          }}
                          className="w-full text-left p-3 hover:bg-surface-container-high transition-colors flex items-center gap-3 border-b border-outline-variant/10 last:border-0"
                        >
                          <span className="material-symbols-outlined text-primary">location_on</span>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{v.name}</p>
                            <p className="text-[11px] text-outline">{v.address || v.city || ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {venueSearch.length >= 2 && venueResults.length === 0 && !venueSearchLoading && !selectedVenue && (
                    <p className="text-[12px] text-outline text-center py-2">{t('groups.venue_no_results')}</p>
                  )}

                  {/* Selected venue card */}
                  {selectedVenue && (
                    <div className="flex items-center gap-3 p-4 bg-primary-container/10 rounded-xl border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-on-surface">{selectedVenue.name}</p>
                        <p className="text-[11px] text-outline">{selectedVenue.address || selectedVenue.city || ''}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVenue(null);
                          setVenueSearch('');
                        }}
                        className="text-error hover:bg-error-container/20 p-2 rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  )}

                  {/* Guide for unregistered venue */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200/50">
                    <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">info</span>
                    <div>
                      <p className="text-[12px] font-semibold text-amber-800">{t('groups.venue_not_registered')}</p>
                      <p className="text-[11px] text-amber-700">{t('groups.venue_register_guide')}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Section: Category */}
            {venueType && (
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">{t('groups.form_category_label')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {(() => {
                  const allCats = [
                    { id: 'Studio', icon: 'palette' },
                    { id: 'Shop', icon: 'shopping_bag' },
                    { id: 'Academy', icon: 'school' },
                    { id: 'Stay', icon: 'bed' },
                    { id: 'Rental', icon: 'meeting_room' },
                    { id: 'Beauty', icon: 'face_retouching_natural' },
                    { id: 'Wellness', icon: 'self_care' },
                    { id: 'Restaurant', icon: 'restaurant' },
                    { id: 'Cafe', icon: 'local_cafe' },
                    { id: 'Office', icon: 'work' }
                  ];
                  const onlineRestricted = ['Stay', 'Rental', 'Restaurant', 'Cafe'];
                  return allCats.map((cat) => {
                    const isDisabled = venueType === 'online' && onlineRestricted.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setCreateForm(prev => ({ ...prev, category: cat.id }))}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95 ${isDisabled
                          ? 'border-transparent bg-surface-container-low/50 opacity-40 cursor-not-allowed'
                          : createForm.category === cat.id
                          ? 'border-primary bg-primary-container/10'
                          : 'border-transparent bg-surface-container-low hover:bg-surface-container-high cursor-pointer'
                          }`}
                      >
                        <span className={`material-symbols-outlined mb-2 ${isDisabled ? 'text-outline/50' : createForm.category === cat.id ? 'text-primary' : 'text-outline'}`}>{cat.icon}</span>
                        <span className={`text-[12px] font-semibold ${isDisabled ? 'text-outline/50' : createForm.category === cat.id ? 'text-primary' : 'text-on-surface-variant'}`}>{t(`groups.cat_${cat.id.toLowerCase()}`)}</span>
                      </button>
                    );
                  });
                })()}
              </div>
              {venueType === 'online' && (
                <p className="mt-3 text-[11px] text-outline flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">info</span>
                  {t('groups.category_unavailable_online')}:{' '}
                  <span className="font-semibold">{t('groups.cat_stay')}, {t('groups.cat_rental')}, {t('groups.cat_restaurant')}, {t('groups.cat_cafe')}</span>
                </p>
              )}
            </section>
            )}

            {/* Section: Membership Strategy */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">{t('groups.form_policy_label')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'open', label: t('groups.policy_open_label'), icon: 'public', desc: t('groups.policy_open_desc') },
                  { id: 'approval', label: t('groups.policy_approval_label'), icon: 'verified_user', desc: t('groups.policy_approval_desc') },
                  { id: 'invite', label: t('groups.policy_invite_label'), icon: 'mail', desc: t('groups.policy_invite_desc') }
                ].map((policy) => (
                  <div
                    key={policy.id}
                    onClick={() => setCreateForm(prev => ({ ...prev, joinPolicy: policy.id }))}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer group hover:shadow-md transition-all ${createForm.joinPolicy === policy.id
                      ? 'border-primary bg-primary-container/5'
                      : 'border-outline-variant/30 bg-white hover:border-outline'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`material-symbols-outlined ${createForm.joinPolicy === policy.id ? 'text-primary' : 'text-outline'}`}>{policy.icon}</span>
                      <div className={`w-5 h-5 rounded-full border-4 bg-white ${createForm.joinPolicy === policy.id ? 'border-primary' : 'border-outline-variant'}`}></div>
                    </div>
                    <p className="font-bold text-sm mb-1">{policy.label}</p>
                    <p className="text-[12px] text-on-surface-variant font-medium">{policy.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-8"></div>
          </main>
        </div>
      )}

      {/* Group Detail Overlay */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[150] bg-background overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
          <GroupDetail group={selectedGroup} isModal={true} onClose={closeModals} />
        </div>
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
