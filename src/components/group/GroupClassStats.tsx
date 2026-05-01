import React, { useState, useEffect, useMemo } from 'react';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { ClassRegistration, Group, GroupClass } from '@/types/group';
import { isSameMonth, format } from 'date-fns';
import { safeDate } from '@/lib/utils/safeData';

interface GroupClassStatsProps {
  group: Group;
  validClassIds: string[];
  filteredClasses: GroupClass[];
}

export function GroupClassStats({ group, validClassIds, filteredClasses }: GroupClassStatsProps) {
  const [registrations, setRegistrations] = useState<ClassRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!group?.id) return;
    
    setIsLoading(true);
    const unsubscribe = classRegistrationService.subscribeToGroupRegistrations(group.id, (data) => {
      setRegistrations(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [group?.id]);

  // Calculate statistics per class based on the valid classes for the current month
  const classStats = useMemo(() => {
    // Filter registrations for the selected month's classes
    const filtered = registrations.filter(reg => validClassIds.includes(reg.classId));

    const statsMap = new Map<string, {
      classTitle: string;
      leaderCount: number;
      followerCount: number;
      total: number;
      leaders: ClassRegistration[];
      followers: ClassRegistration[];
      couples: ClassRegistration[];
      others: ClassRegistration[];
    }>();

    // Pre-fill with all running classes for the current month
    filteredClasses.forEach(cls => {
      statsMap.set(cls.id, {
        classTitle: cls.title,
        leaderCount: 0,
        followerCount: 0,
        total: 0,
        leaders: [],
        followers: [],
        couples: [],
        others: []
      });
    });

    filtered.forEach(reg => {
      const key = reg.classId || reg.classTitle;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          classTitle: reg.classTitle,
          leaderCount: 0,
          followerCount: 0,
          total: 0,
          leaders: [],
          followers: [],
          couples: [],
          others: []
        });
      }

      const stat = statsMap.get(key)!;
      stat.total += 1;
      
      if (reg.role === 'Leader') {
        stat.leaderCount += 1;
        stat.leaders.push(reg);
      } else if (reg.role === 'Follower') {
        stat.followerCount += 1;
        stat.followers.push(reg);
      } else if (reg.role === 'Couple') {
        // Couple usually implies 1 Leader, 1 Follower
        stat.leaderCount += 1;
        stat.followerCount += 1;
        stat.total += 1; // couple counts as 2 people
        stat.couples.push(reg);
      } else {
        stat.others.push(reg);
      }
    });

    return Array.from(statsMap.values());
  }, [registrations, validClassIds, filteredClasses]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  if (classStats.length === 0) {
    return (
      <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
        <span className="material-symbols-outlined text-4xl text-outline mb-2">bar_chart</span>
        <p className="text-on-surface-variant">No class data found for this month.</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full">
      {classStats.map((stat, idx) => {
        // Calculate percentages
        const leaderPercent = stat.total > 0 ? (stat.leaderCount / stat.total) * 100 : 0;
        const followerPercent = stat.total > 0 ? (stat.followerCount / stat.total) * 100 : 0;
        
        // Handle case where role might be undefined but total > 0
        const unknownCount = Math.max(0, stat.total - stat.leaderCount - stat.followerCount);
        const unknownPercent = stat.total > 0 ? (unknownCount / stat.total) * 100 : 0;

        return (
          <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4 border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-lg text-on-surface leading-tight">
                {stat.classTitle}
              </h3>
              <span className="text-sm font-bold bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full whitespace-nowrap">
                Total: {stat.total}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Ratio Bar */}
              <div className="h-2.5 rounded-full flex overflow-hidden bg-surface-container w-full">
                {stat.leaderCount > 0 && (
                  <div className="bg-[#0057bd] h-full transition-all duration-500" style={{ width: `${leaderPercent}%` }}></div>
                )}
                {stat.followerCount > 0 && (
                  <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${followerPercent}%` }}></div>
                )}
                {unknownCount > 0 && (
                  <div className="bg-gray-300 h-full transition-all duration-500" style={{ width: `${unknownPercent}%` }}></div>
                )}
              </div>
              
              {/* Legend */}
              <div className="flex justify-between items-center text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#0057bd]"></div>
                  <span className="text-gray-700">Leader: {stat.leaderCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Follower: {stat.followerCount}</span>
                  <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <div className="mt-2 space-y-4 pt-4 border-t border-outline-variant/20">
              {stat.leaders.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#0057bd] mb-2 uppercase tracking-wide">Leaders</h4>
                  <div className="flex flex-wrap gap-2">
                    {stat.leaders.map(l => (
                      <span key={l.id} className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-md border border-blue-100">
                        {l.applicantName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {stat.followers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-600 mb-2 uppercase tracking-wide">Followers</h4>
                  <div className="flex flex-wrap gap-2">
                    {stat.followers.map(f => (
                      <span key={f.id} className="text-sm bg-rose-50 text-rose-800 px-2 py-1 rounded-md border border-rose-100">
                        {f.applicantName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {stat.couples.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-purple-600 mb-2 uppercase tracking-wide">Couples</h4>
                  <div className="flex flex-wrap gap-2">
                    {stat.couples.map(c => (
                      <span key={c.id} className="text-sm bg-purple-50 text-purple-800 px-2 py-1 rounded-md border border-purple-100">
                        {c.applicantName} &amp; {c.partnerName || '?'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {stat.others.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Others</h4>
                  <div className="flex flex-wrap gap-2">
                    {stat.others.map(o => (
                      <span key={o.id} className="text-sm bg-gray-50 text-gray-800 px-2 py-1 rounded-md border border-gray-200">
                        {o.applicantName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {stat.total === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-2">No participants yet</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
