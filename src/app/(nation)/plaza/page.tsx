"use client";

import React, { useState, useEffect } from 'react';
import { feedService } from '@/lib/firebase/feedService';
import PageWrapper from '@/components/layout/PageWrapper';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import UniversalFeed from '@/components/feed/UniversalFeed';
import { FeedContext } from '@/types/feed';

export default function PlazaPage() {
  const { user, profile } = useAuth();
  const [storyUsers, setStoryUsers] = useState<any[]>([]);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ userId: string, x: number, y: number } | null>(null);
  const longPressTimer = React.useRef<any>(null);

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
    const self = {
      userId: user?.uid,
      userName: 'Your Story',
      userPhoto: user?.photoURL,
      isSelf: true
    };

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

    return [self, ...sorted];
  }, [user, storyUsers, (profile as any)?.pinnedUserIds]);

  // Handle Pinning
  const handlePinToggle = async (targetId: string) => {
    if (!user) return;
    const pinnedIds = (profile as any)?.pinnedUserIds || [];
    const isCurrentlyPinned = pinnedIds.includes(targetId);

    try {
      await feedService.togglePinUser(user.uid, targetId, isCurrentlyPinned);
      setContextMenu(null);
    } catch (error) {
      alert("Failed to update pin status.");
    }
  };

  // Long-press detection
  const handleTouchStart = (userId: string, e: any) => {
    if (userId === user?.uid) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    longPressTimer.current = setTimeout(() => {
      setContextMenu({ userId, x, y });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <PageWrapper>
      <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-manrope relative overflow-hidden pt-16" onClick={() => contextMenu && setContextMenu(null)}>
        {/* Ambient Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.4]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen pb-[60px]">
          {/* Context Menu for Pinning */}
          <AnimatePresence>
            {contextMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y - 60, zIndex: 1000 }}
                className="bg-surface-container-lowest shadow-2xl rounded-2xl border border-outline-variant/10 py-2 min-w-[140px]"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handlePinToggle(contextMenu.userId); }}
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface-variant transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    {((profile as any)?.pinnedUserIds || []).includes(contextMenu.userId) ? 'keep_off' : 'keep'}
                  </span>
                  <span className="text-[12px] font-bold text-on-surface">
                    {((profile as any)?.pinnedUserIds || []).includes(contextMenu.userId) ? 'Unpin from Top' : 'Pin to Top'}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Universal Feed Section */}
          <div className="flex-grow">
            <UniversalFeed context={plazaContext} currentUser={user} profile={profile} />
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
