"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { feedService } from '@/lib/firebase/feedService';
import PageWrapper from '@/components/layout/PageWrapper';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import UniversalFeed from '@/components/feed/UniversalFeed';
import { FeedContext } from '@/types/feed';
import UserProfileModal from '@/components/profile/UserProfileModal';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useNavigation } from '@/components/providers/NavigationProvider';


function PlazaPageContent() {
  const { user, profile } = useAuth();
  const [storyUsers, setStoryUsers] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const { openModal: openProfile, closeModal: closeProfile, value: selectedProfileId } = useModalNavigation('profileId');
  const { isOpen: showCreateModal, openModal: openCreate, closeModal: closeCreate } = useModalNavigation('create');
  const { setSubHeader } = useNavigation();



  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'hot', label: 'Hot' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'pin', label: 'Pin' },
    { id: 'my_log', label: 'My log' },
  ];

  // Plaza Feed Context
  const plazaContext: FeedContext = {
    scope: 'plaza',
    scopeId: 'tango', // WoC Tango context
    label: 'Plaza'
  };

  // Fetch Stories from feedService
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const targetId = plazaContext.scope === 'plaza' ? 'plaza' : plazaContext.scopeId;
        const stories = await feedService.getUsersWithRecentPosts(targetId);
        setStoryUsers(stories);
      } catch (error) {
        console.error("Failed to fetch stories:", error);
      }
    };
    fetchStories();
  }, []);

  // Relationship Logic: Sorting Algorithm
  const sortedStories = React.useMemo(() => {
    const pinnedIds = (profile as any)?.pinnedUserIds || [];
    const others = [...storyUsers].filter(u => u.userId !== user?.uid);

    const sorted = others.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.userId);
      const bPinned = pinnedIds.includes(b.userId);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;

      const aScore = a.interactionScore || 0;
      const bScore = b.interactionScore || 0;
      return bScore - aScore;
    });

    return sorted;
  }, [user, profile, storyUsers]);

  // Teleport Filter Bar to Header (Premium Standard: Dual Row)
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col">
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-200'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 2: Stories (Premium Profile Line) */}
        <div className="w-full py-2.5 px-3 flex items-center gap-4 overflow-x-auto no-scrollbar bg-[#FAF8FF]/50">
          {sortedStories.map((storyUser, idx) => {
            const isPinned = ((profile as any)?.pinnedUserIds || []).includes(storyUser.userId);

            return (
              <div
                key={storyUser.userId || `story-${idx}`}
                className="flex flex-col items-center gap-1 cursor-pointer relative shrink-0"
                onClick={() => {
                  if (storyUser.userId && !storyUser.isSelf) {
                    openProfile(storyUser.userId);
                  }
                }}
              >
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl p-[2px] ${storyUser.hasUnread ? 'bg-gradient-to-tr from-[#9B51E0] to-[#E56860]' : 'bg-slate-200'}`}>
                    <div className="w-full h-full rounded-[14px] border-2 border-white overflow-hidden">
                      <img
                        src={storyUser.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(storyUser.userName || 'User')}&background=0f172a&color=fff&font-size=0.33&bold=true`}
                        alt={storyUser.userName || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(storyUser.userName || 'User')}&background=0f172a&color=fff&font-size=0.33&bold=true`;
                        }}
                      />
                    </div>
                  </div>

                  {storyUser.isSelf && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[10px] text-white font-bold">add</span>
                    </div>
                  )}

                  {isPinned && !storyUser.isSelf && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[10px] text-white">keep</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] max-w-[56px] truncate text-center font-bold tracking-tight ${storyUser.isSelf ? 'text-slate-900' : 'text-slate-500'}`}>
                  {storyUser.userName || 'Unknown'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );

    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [activeFilter, setSubHeader, sortedStories, profile, openProfile]);



  return (
    <PageWrapper>
      {selectedProfileId && (
        <UserProfileModal
          userId={selectedProfileId}
          onClose={closeProfile}
        />
      )}

      <div className="flex flex-col min-h-screen relative">
        <div className="relative z-10 flex flex-col min-h-screen pb-[60px]">
          {/* Universal Feed Section */}
          <div className="flex-grow">
            <UniversalFeed context={plazaContext} currentUser={user} profile={profile} activeFilter={activeFilter} />
          </div>


        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </PageWrapper>
  );
}

export default function PlazaPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-rounded animate-spin text-slate-300 text-4xl">progress_activity</span>
      </div>
    }>
      <PlazaPageContent />
    </Suspense>
  );
}
