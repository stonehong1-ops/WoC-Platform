'use client';

import React, { useState, useEffect } from 'react';
import CreateFeedPopup from './CreateFeedPopup';
import FeedPostCard from './FeedPostCard';
import { feedService } from '@/lib/firebase/feedService';
import { Post } from '@/types/feed';
import UserAvatar from '@/components/common/UserAvatar';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useLocation } from '@/components/providers/LocationProvider';
import { COUNTRY_MAPPING } from '@/lib/constants/locations';
import { useLanguage } from '@/contexts/LanguageContext';

interface UniversalFeedProps {
  context: any;
  currentUser: any;
  profile?: any;
  activeFilter?: string;
}

export default function UniversalFeed({ context, currentUser, profile, activeFilter: propFilter }: UniversalFeedProps) {
  const { openModal: openCreate, closeModal: closeCreate, value: createFlowValue } = useModalNavigation('createFlow');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [localFilter, setLocalFilter] = useState('all');
  const { t } = useLanguage();

  const isCreateModalOpen = !!createFlowValue;
  const editingPost = createFlowValue && createFlowValue !== 'new' ? posts.find(p => p.id === createFlowValue) || null : null;

  const activeFilter = propFilter || localFilter;
  const tabs = [
    { id: 'all', label: t('plaza.tab_all') },
    { id: 'hot', label: t('plaza.tab_hot') },
    { id: 'favorites', label: t('plaza.tab_favorites') },
    { id: 'pin', label: t('plaza.tab_pin') },
    { id: 'my_log', label: t('plaza.tab_my_log') },
  ];

  useEffect(() => {
    let targetId = context.scope === 'plaza' ? 'plaza' : (context.scopeId || 'freestyle-tango');
    if (context.scope === 'helpdesk') targetId = 'helpdesk';
    
    const unsubscribe = feedService.subscribePosts(
      targetId,
      (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
      },
      {},
      (error) => {
        console.error("Feed subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [context.scopeId]);

  const { location } = useLocation();

  // Derive filtered posts based on activeFilter
  const filteredPosts = React.useMemo(() => {
    let result = [...posts];

    // 1. Regional Filtering (Only for Plaza scope)
    if (context.scope === 'plaza' && location.country !== 'GLOBAL') {
      result = result.filter(p => {
        // If post has no location metadata, skip filtering or decide based on UX (usually skip)
        if (!p.location?.country) return false; 
        
        const countryMatch = p.location.country.toUpperCase() === location.country.toUpperCase();
        if (location.city === 'ALL') {
          return countryMatch;
        }
        
        const cityMatch = p.location.city.toUpperCase() === location.city.toUpperCase();
        return countryMatch && cityMatch;
      });
    }

    // 2. Tab Filtering
    switch (activeFilter) {
      case 'hot':
        // Ranked by engagement (likes + comments)
        result.sort((a, b) => {
          const aScore = (a.likesCount || 0) + (a.commentsCount || 0);
          const bScore = (b.likesCount || 0) + (b.commentsCount || 0);
          if (bScore !== aScore) return bScore - aScore;
          // If scores are equal, sort by date
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        break;
      case 'my_log':
      case 'my': // fallback for old filter name
        // User's own posts
        result = result.filter(p => p.userId === currentUser?.uid);
        break;
      case 'pin':
      case 'pinned': // fallback for old filter name
        // Posts I pinned
        const pinnedPostIds = profile?.pinnedPostIds || [];
        result = result.filter(p => pinnedPostIds.includes(p.id));
        break;
      case 'favorites':
      case 'friends': // fallback for old filter name
        // Authors I interacted with (liked/commented on their posts)
        const interactedUserIds = profile?.interactedUserIds || [];
        result = result.filter(p => interactedUserIds.includes(p.userId));
        break;
      case 'all':
      default:
        // Already chronological by default (subscribePosts orders by createdAt desc)
        break;
    }

    return result;
  }, [posts, activeFilter, currentUser, profile, location, context.scope]);

  return (
    <div className={`text-on-surface font-body relative ${context.scope === 'plaza' ? 'min-h-screen' : ''}`}>
      {/* Ambient Background Effects */}
      <div className={`${context.scope === 'plaza' ? 'fixed inset-0 z-[-1] overflow-hidden pointer-events-none' : 'hidden'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[60%] bg-tertiary/5 blur-3xl rounded-full"></div>
      </div>

      <main className={`max-w-[600px] mx-auto flex flex-col ${context.scope === 'plaza' ? 'pt-0' : 'pt-0 pb-16'}`}>
        <div className="flex flex-col w-full">
          {/* Action Hub: Inline Compose Bar (Standardized) */}
          {(context.scope === 'plaza' || context.scope === 'group' || context.scope === 'social' || context.scope === 'helpdesk') && (
            <div className="mx-4 my-3 px-5 py-3 flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
                {t('plaza.compose_prompt', 'Share your thoughts...')}
              </p>
              <button 
                onClick={() => openCreate('new')}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-2"
              >
                <span className="text-[13px] font-bold">{t('plaza.create_post', 'Post')}</span>
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </button>
            </div>
          )}

        {/* Feed Posts List */}
        <div className="flex flex-col pb-24 w-full">
          {loading ? (
            <div className="flex flex-col gap-0 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-container-lowest h-80 animate-pulse border-b border-outline-variant/10 shadow-sm w-full" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-lowest border-b border-outline-variant/10 shadow-sm w-full">
              <span className="material-symbols-outlined text-outline-variant text-6xl mb-4">post_add</span>
              <p className="text-on-surface-variant font-medium px-10">
                {location.country === 'GLOBAL' 
                  ? t('plaza.last_feed_global') 
                  : `${location.city}, ${COUNTRY_MAPPING[location.country.toUpperCase()] || location.country}${t('plaza.last_feed_local')}`}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                profile={profile}
                hideUserInfo={context.scope === 'helpdesk'}
                onEdit={(post) => {
                  openCreate(post.id);
                }}
                onDelete={async (postId) => {
                  if (window.confirm(t('plaza.confirm_delete_post'))) {
                    try {
                      await feedService.deletePost(postId);
                    } catch (error) {
                      alert(t('plaza.fail_delete'));
                    }
                  }
                }}
              />
            ))
          )}
        </div>
        </div>
      </main>

      {/* Full Screen Post Creation Popup */}
      <CreateFeedPopup
        isOpen={isCreateModalOpen}
        onClose={closeCreate}
        context={context}
        editingPost={editingPost}
      />
    </div>
  );
}
