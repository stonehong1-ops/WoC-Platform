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
  const [sortOrder, setSortOrder] = useState<'name' | 'classes'>('classes');

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
        ).map(g => {
          if (g.name.toLowerCase().includes('freestyle tango')) {
            return { ...g, name: 'Freestyle Tango', nativeName: '프리스타일' };
          }
          return g;
        });
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
    <main className="max-w-md mx-auto w-full relative px-5 pt-4 space-y-4">
      {/* Club Breakdown Section */}
      <section className="space-y-4 relative z-10">


        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map(group => {
              const counts = groupCounts[group.id];
              const individualCount = counts?.individual ?? 0;
              const bundleCount = counts?.bundle ?? 0;
              const passCount = counts?.pass ?? 0;

              return (
                <div 
                  key={group.id} 
                  onClick={() => router.push(`/class/${group.id}`)}
                  className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <h3 className="font-headline font-bold text-lg text-on-surface leading-tight">{group.name}</h3>
                        {group.nativeName && group.nativeName !== group.name && (
                          <span className="text-[13px] font-medium text-on-surface-variant mt-0.5">{group.nativeName}</span>
                        )}
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-low group-hover:bg-primary/10 transition-colors">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                    </button>
                  </div>

                  <div className="flex gap-4 bg-surface-container-low rounded-lg p-3 border border-surface-variant/50">
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Individual</div>
                      <div className="text-base font-bold text-on-surface">{individualCount}</div>
                    </div>
                    <div className="w-px bg-outline-variant/50"></div>
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Bundle</div>
                      <div className="text-base font-bold text-on-surface">{bundleCount}</div>
                    </div>
                    <div className="w-px bg-outline-variant/50"></div>
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Pass</div>
                      <div className="text-base font-bold text-on-surface">{passCount}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface-container-lowest rounded-xl border-2 border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-outline text-4xl mb-2">search_off</span>
            <p className="text-sm font-bold text-on-surface-variant">No class groups found.</p>
          </div>
        )}
      </section>
    </main>
  );
}
