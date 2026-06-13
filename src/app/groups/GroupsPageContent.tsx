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
    <div className="bg-background min-h-screen pb-32 relative font-body">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* What's New Carousel */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-background">{t('groups.whats_new')}</h2>
              <p className="text-on-surface-variant text-sm font-medium">{t('groups.whats_new_desc')}</p>
            </div>
            <button
              onClick={() => { openCategoryModal('All'); }}
              className="text-primary font-bold text-sm flex items-center gap-1 group"
            >
              {t('groups.view_all')} <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4 -mx-6 px-6">
            {whatsNewGroups.length > 0 ? whatsNewGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => { handleGroupSelect(group); }}
                className="flex-shrink-0 w-[320px] group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all duration-300">
                  <GroupCoverImage group={group} className="group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/10 z-10"></div>
                  {group.address && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-bold text-primary flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">location_on</span> {extractDong(group.address, language)}
                    </span>
                  </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 text-white">
                    <h3 className="text-lg font-bold font-headline mb-0.5 w-full truncate flex items-baseline gap-2">
                      <span className="text-white">{group.name}</span>
                      {group.nativeName && <span className="text-[0.7em] font-medium text-white/70">{group.nativeName}</span>}
                    </h3>
                    <p className="text-white/80 text-[11px] font-medium line-clamp-1 mt-1">
                      {group.memberCount} {t('groups.member_count_label')} • {group.tags?.[0] ? t(`groups.cat_${group.tags[0].toLowerCase()}`) : t('groups.community_fallback')}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="w-full text-center py-10 text-on-surface-variant/50 font-medium">{t('groups.no_whats_new')}</div>
            )}
          </div>
        </section>



        {/* Category Best Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-background">{t('groups.category_best')}</h2>
            <p className="text-on-surface-variant text-sm font-medium">{t('groups.category_best_desc')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {discoveryCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => { openCategoryModal(cat.id); }}
                className={`group relative aspect-[4/3] rounded-3xl overflow-hidden ${cat.color} cursor-pointer transition-all hover:scale-[0.98] shadow-sm hover:shadow-md`}
              >
                <div className="absolute inset-0 bg-black/5 z-0"></div>
                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <span className={`material-symbols-outlined ${cat.text} text-3xl`}>{cat.icon}</span>
                    <span className={`bg-white px-2.5 py-0.5 rounded-lg text-[13px] font-black shadow-md ${cat.text} flex items-center justify-center min-w-[28px]`}>
                      {categoryCounts[cat.id as keyof typeof categoryCounts] || 0}
                    </span>
                  </div>
                  <span className={`${cat.text} font-black font-headline text-lg italic`}>{t(`groups.cat_${cat.id.toLowerCase()}`)}</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className={`material-symbols-outlined text-8xl ${cat.text}`}>{cat.icon}</span>
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
