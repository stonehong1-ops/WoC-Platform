'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { Group } from '@/types/group';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

type GroupCounts = Record<string, { individual: number; bundle: number; pass: number }>;

export default function ClassMenuPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupCounts, setGroupCounts] = useState<GroupCounts>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'classes' | 'name'>('classes');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const formattedMonth = currentDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

  useEffect(() => {
    const fetchClassGroups = async () => {
      try {
        const allGroups = await groupService.getGroups();
        
        const classGroups = allGroups.filter(g => 
          g.activeServices?.class === true || 
          g.activeServices?.rental === true ||
          (g.classes && g.classes.length > 0) ||
          (g as any).type === 'Studio' ||
          (g as any).type === 'Academy' ||
          (g as any).activeServices?.studio === true ||
          g.name.toLowerCase().includes('studio') ||
          g.name.toLowerCase().includes('academy') ||
          g.name.toLowerCase().includes('tango')
        );
        setGroups(classGroups);

        // Fetch subcollection counts in parallel for all groups
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
  const dropdownGroups = groups.filter(g => {
    const matchEng = g.name ? g.name.toLowerCase().includes(safeSearch) : false;
    const matchKor = g.nativeName ? g.nativeName.toLowerCase().includes(safeSearch) : false;
    return matchEng || matchKor;
  });

  const filteredGroups = groups.filter(g => {
    if (selectedGroupId) return g.id === selectedGroupId;
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSearchResults(val.length > 0);
    if (val === '') {
      setSelectedGroupId(null);
    }
  };

  const handleSelectGroup = (group: Group) => {
    setSearchQuery(group.name);
    setSelectedGroupId(group.id);
    setShowSearchResults(false);
  };

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Filter & Sort Bar */}
      <div className="w-full bg-[#FAF8FF] border-b border-slate-100/50 px-3 py-2 flex flex-col gap-3">
        {/* Month Selector */}
        <div className="w-full flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-slate-100 shadow-sm">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[18px] text-slate-600">chevron_left</span>
          </button>
          <div className="text-[14px] font-bold text-slate-800 tracking-wide">{formattedMonth}</div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[18px] text-slate-600">chevron_right</span>
          </button>
        </div>
        
        {/* Bottom Actions — items count + Sort */}
        <div className="w-full flex items-center justify-between px-1 relative">
          <div className="text-[11px] font-medium text-[#007AFF]">
            {filteredGroups.length} studios
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {sortOrder === 'classes' ? 'By Classes' : 'By Name'}
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          {showSortDropdown && (
            <div className="absolute top-6 right-0 z-40 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => { setSortOrder('classes'); setShowSortDropdown(false); }}
                className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                  sortOrder === 'classes' ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                <span className="text-[13px]">By Classes</span>
              </button>
              <button
                onClick={() => { setSortOrder('name'); setShowSortDropdown(false); }}
                className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                  sortOrder === 'name' ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">sort_by_alpha</span>
                <span className="text-[13px]">By Name</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 px-4 pb-20 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map(group => {
              const counts = groupCounts[group.id];
              const individualCount = counts?.individual ?? 0;
              const bundleCount = counts?.bundle ?? 0;
              const passCount = counts?.pass ?? 0;
              const repImage = group.logo || group.coverImage || null;

              return (
                <div 
                  key={group.id} 
                  onClick={() => router.push(`/class/${group.id}`)}
                  className="bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-500/50 hover:shadow-md transition-all group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <div className="flex gap-4 mb-4">
                    {/* Left-aligned Photo */}
                    <div className="w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden bg-[#f2f4f4] border border-slate-100 relative shadow-sm">
                      {/* Fallback View */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                        <span className="material-symbols-outlined text-2xl mb-0.5">storefront</span>
                        <span className="text-[8px] font-bold tracking-wider uppercase">No Image</span>
                      </div>
                      
                      {/* Actual Image */}
                      {repImage && (
                        <img 
                          src={repImage} 
                          alt={group.name} 
                          className="absolute inset-0 z-10 w-full h-full object-cover" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    
                    {/* Right-side content */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start">
                        <h3 className="w-full truncate font-headline font-bold text-[15px] text-slate-800 leading-tight">
                          {group.name}
                          {group.nativeName && group.nativeName !== group.name && (
                            <span className="text-[11px] font-medium text-slate-500 ml-1.5">{group.nativeName}</span>
                          )}
                        </h3>
                        <button className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-blue-50 transition-colors flex-shrink-0">
                          <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-500 text-[18px] transition-colors">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Class Counts Section (Bottom) */}
                  <div className="flex gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100/50">
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Individual</div>
                      <div className="text-[13px] font-bold text-slate-700">{individualCount}</div>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Bundle</div>
                      <div className="text-[13px] font-bold text-slate-700">{bundleCount}</div>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Pass</div>
                      <div className="text-[13px] font-bold text-slate-700">{passCount}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">search_off</span>
            <p className="text-sm font-bold text-slate-500">No class groups found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
