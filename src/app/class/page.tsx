'use client';
/**
 * 🔒 DESIGN_LOCKED: This page MUST maintain a vertical LIST-BASED layout.
 * DO NOT convert to Grid or Grid-cols-2 without explicit USER approval.
 * Refer to STABILITY_GUARD.md for global design standards.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { groupService } from '@/lib/firebase/groupService';
import { venueService } from '@/lib/firebase/venueService';
import { Group } from '@/types/group';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import ClassDetail from '@/components/class/ClassDetail';

type GroupCounts = Record<string, { individual: number; bundle: number; pass: number }>;

function ClassMenuContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { value: modalId, openModal, closeModal } = useModalNavigation('groupId');
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupCounts, setGroupCounts] = useState<GroupCounts>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'classes' | 'name'>('classes');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { setSubHeader } = useNavigation();

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'studio', label: 'Studio' },
    { key: 'academy', label: 'Academy' },
    { key: 'tango', label: 'Tango' },
    { key: 'workshop', label: 'Workshop' },
  ];

  const handlePrevMonth = React.useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);
  
  const handleNextMonth = React.useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);
  
  const formattedMonth = currentDate.toLocaleString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', year: 'numeric' });

  useEffect(() => {
    const fetchClassGroups = async () => {
      try {
        const [allGroups, allVenues] = await Promise.all([
          groupService.getGroups(),
          venueService.getVenues()
        ]);
        
        const venueMap = Object.fromEntries(allVenues.map(v => [v.id, v]));
        
        const classGroups = allGroups.filter(g => {
          if (g.activeServices?.class === false) return false;
          return g.activeServices?.class === true || 
            g.activeServices?.rental === true ||
            (g.classes && g.classes.length > 0) ||
            (g as any).type === 'Studio' ||
            (g as any).type === 'Academy' ||
            (g as any).activeServices?.studio === true ||
            g.name.toLowerCase().includes('studio') ||
            g.name.toLowerCase().includes('academy') ||
            g.name.toLowerCase().includes('tango');
        }).map(g => {
          // If group missing address, try to get from venue
          if (!g.address && g.venueId && venueMap[g.venueId]) {
            const v = venueMap[g.venueId];
            return {
              ...g,
              address: v.address || `${v.city || ''} ${v.district || ''}`.trim()
            };
          }
          return g;
        });

        setGroups(classGroups);

        const countsEntries = await Promise.all(
          classGroups.map(async (g) => {
            const [clsSnap, discSnap, passSnap] = await Promise.all([
              getCountFromServer(collection(db, 'groups', g.id, 'classes')),
              getCountFromServer(collection(db, 'groups', g.id, 'discounts')),
              getCountFromServer(collection(db, 'groups', g.id, 'monthlyPasses')),
            ]);
            return [g.id, {
              individual: clsSnap.data().count,
              bundle: discSnap.data().count,
              pass: passSnap.data().count,
            }] as const;
          })
        );
        setGroupCounts(Object.fromEntries(countsEntries));
      } catch (error) {
        console.error("Failed to fetch class groups:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassGroups();
  }, []);

  const safeSearch = searchQuery.toLowerCase();
  const filteredGroups = groups.filter(g => {
    if (selectedGroupId) return g.id === selectedGroupId;
    if (activeCategory !== 'all') {
      const type = (g as any).type?.toLowerCase() || '';
      const name = g.name.toLowerCase();
      if (activeCategory === 'studio') return type === 'studio' || name.includes('studio');
      if (activeCategory === 'academy') return type === 'academy' || name.includes('academy');
      if (activeCategory === 'tango') return name.includes('tango');
      if (activeCategory === 'workshop') return name.includes('workshop');
    }
    return true;
  }).sort((a, b) => {
    if (sortOrder === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      const aC = groupCounts[a.id];
      const bC = groupCounts[b.id];
      const aTotal = aC ? (aC.individual + aC.bundle + aC.pass) : 0;
      const bTotal = bC ? (bC.individual + bC.bundle + bC.pass) : 0;
      return bTotal - aTotal;
    }
  });

  const filterBar = React.useMemo(() => (
    <div className="relative w-full h-11 bg-white flex items-center justify-between px-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-3">
        {/* Month Selector on the Left */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-1.5 py-0.5 border border-slate-100">
          <button onClick={handlePrevMonth} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-400">
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span className="text-[13px] font-bold text-slate-900 uppercase tracking-tight w-[80px] text-center">
            {formattedMonth}
          </span>
          <button onClick={handleNextMonth} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-400">
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Sort Trigger on the Right */}
        <button 
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
        >
          {sortOrder === 'classes' ? t('class.sort_by_classes') : t('class.sort_by_name')}
          <span className={`material-symbols-outlined text-[16px] transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
      </div>

      {/* Sort Dropdown */}
      {showSortDropdown && (
        <div className="absolute top-full right-0 z-40 bg-white shadow-2xl border-t border-slate-100 py-2 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={() => { setSortOrder('classes'); setShowSortDropdown(false); }}
            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
              sortOrder === 'classes' ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">sort</span>
            <span className="text-[13px]">{t('class.sort_by_classes')}</span>
          </button>
          <button
            onClick={() => { setSortOrder('name'); setShowSortDropdown(false); }}
            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
              sortOrder === 'name' ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">sort_by_alpha</span>
            <span className="text-[13px]">{t('class.sort_by_name')}</span>
          </button>
        </div>
      )}
    </div>
  ), [formattedMonth, showSortDropdown, sortOrder, handlePrevMonth, handleNextMonth, t]);

  // Teleport Filter Bar to Header (Premium Standard: Dual Row)
  useEffect(() => {
    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [filterBar, setSubHeader]);

  const GANGNAM_DISTRICTS = ['강남', '서초', '송파', '강동', '동작', '관악', '영등포', '구로', '금천', '양천', '강서'];

  const getRegion = (group: Group) => {
    const addr = group.address || '';
    if (addr.includes('서울') || addr.includes('Seoul')) {
      const isGangnam = GANGNAM_DISTRICTS.some(d => addr.includes(d));
      return isGangnam ? 'Seoul Gangnam' : 'Seoul Gangbuk';
    }
    
    if (!addr) return 'International';
    
    const fullAddr = addr.toLowerCase();
    
    // Incheon / Gyeonggi / Gangwon
    if (fullAddr.includes('인천') || fullAddr.includes('incheon') || 
        fullAddr.includes('경기') || fullAddr.includes('gyeonggi') || 
        fullAddr.includes('강원') || fullAddr.includes('gangwon')) {
      return 'Incheon / Gyeonggi / Gangwon';
    }
    
    // Busan / Gyeongnam / Ulsan
    if (fullAddr.includes('부산') || fullAddr.includes('busan') || 
        fullAddr.includes('경남') || fullAddr.includes('gyeongnam') || 
        fullAddr.includes('울산') || fullAddr.includes('ulsan')) {
      return 'Busan / Gyeongnam / Ulsan';
    }
    
    // Daegu / Gyeongbuk
    if (fullAddr.includes('대구') || fullAddr.includes('daegu') || 
        fullAddr.includes('경북') || fullAddr.includes('gyeongbuk')) {
      return 'Daegu / Gyeongbuk';
    }
    
    // Daejeon / Chungcheong
    if (fullAddr.includes('대전') || fullAddr.includes('daejeon') || 
        fullAddr.includes('충청') || fullAddr.includes('chungcheong')) {
      return 'Daejeon / Chungcheong';
    }
    
    // Gwangju / Jeolla
    if (fullAddr.includes('광주') || fullAddr.includes('gwangju') || 
        fullAddr.includes('전라') || fullAddr.includes('jeolla')) {
      return 'Gwangju / Jeolla';
    }
    
    // Jeju
    if (fullAddr.includes('제주') || fullAddr.includes('jeju')) {
      return 'Jeju';
    }

    const parts = addr.split(' ');
    return parts[0];
  };

  const groupedGroups = React.useMemo(() => {
    const groupsByRegion: Record<string, Group[]> = {};
    filteredGroups.forEach(group => {
      const region = getRegion(group);
      if (!groupsByRegion[region]) groupsByRegion[region] = [];
      groupsByRegion[region].push(group);
    });

    // Define region order (Seoul first)
    const sortedRegions = Object.keys(groupsByRegion).sort((a, b) => {
      if (a === 'Seoul Gangbuk') return -1;
      if (b === 'Seoul Gangbuk') return 1;
      if (a === 'Seoul Gangnam') return -1;
      if (b === 'Seoul Gangnam') return 1;
      if (a === 'International') return 1;
      if (b === 'International') return -1;
      return a.localeCompare(b);
    });

    return sortedRegions.map(region => ({
      region,
      groups: groupsByRegion[region]
    }));
  }, [filteredGroups]);

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="pt-1 px-4 pb-20 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
          </div>
        ) : groupedGroups.length > 0 ? (
          <div className="space-y-8">
            {groupedGroups.map(({ region, groups: regionGroups }) => (
              <div key={region} className="space-y-4">
                {/* Region Header */}
                <div className="flex items-center gap-3 px-1">
                  <div className="w-1 h-3 bg-blue-500 rounded-full" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {t(`class.region_${region}`, region)}
                  </span>
                  <div className="flex-1 h-[1px] bg-slate-100" />
                </div>

                <div className="space-y-3">
                  {regionGroups.map(group => {
                    const counts = groupCounts[group.id];
                    const individualCount = counts?.individual ?? 0;
                    const bundleCount = counts?.bundle ?? 0;
                    const passCount = counts?.pass ?? 0;
                    const repImage = group.logo || group.coverImage || null;
                    const type = (group as any).type || (group.name.toLowerCase().includes('studio') ? 'Studio' : 'Academy');

                    return (
                      <div 
                        key={group.id} 
                        onClick={() => openModal(group.id)}
                        className="group cursor-pointer bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                      >
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="w-20 h-20 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 relative border border-slate-50">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                              <span className="material-symbols-outlined text-2xl">storefront</span>
                            </div>
                            {repImage && (
                              <img 
                                src={repImage} 
                                alt={group.name} 
                                className="absolute inset-0 z-10 w-full h-full object-cover" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider font-label">
                                  {t(`class.type_${type}`, type)}
                                </span>
                                <span className="material-symbols-outlined text-[18px] text-slate-300 group-hover:text-blue-500 transition-colors">
                                  arrow_forward_ios
                                </span>
                              </div>
                              <h4 className="text-[15px] font-bold text-slate-900 font-body truncate leading-tight mt-0.5">
                                {group.name}
                              </h4>
                              {group.nativeName && group.nativeName !== group.name && (
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                                  {group.nativeName}
                                </p>
                              )}
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-2 mt-2">
                              {individualCount > 0 && (
                                <div className="flex items-center gap-1 h-5 px-2 rounded-md bg-slate-50 border border-slate-100">
                                  <span className="text-[11px] font-bold text-slate-600">{individualCount}</span>
                                  <span className="text-[11px] font-medium text-slate-400 uppercase">{t('class.stats_classes')}</span>
                                </div>
                              )}
                              {bundleCount > 0 && (
                                <div className="flex items-center h-5 px-2 rounded-md bg-amber-50 border border-amber-100">
                                  <span className="text-[11px] font-bold text-amber-600 uppercase">{t('class.stats_bundle')}</span>
                                </div>
                              )}
                              {passCount > 0 && (
                                <div className="flex items-center h-5 px-2 rounded-md bg-blue-50 border border-blue-100">
                                  <span className="text-[11px] font-bold text-blue-600 uppercase">{t('class.stats_pass')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">search_off</span>
            <p className="text-sm font-bold text-slate-500">{t('class.no_groups')}</p>
          </div>
        )}
      </div>

      {modalId && (
        <ClassDetail 
          groupId={modalId} 
          isModal={true}
          onClose={closeModal}
        />
      )}
    </main>
  );
}

export default function ClassMenuPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
      </div>
    }>
      <ClassMenuContent />
    </Suspense>
  );
}
