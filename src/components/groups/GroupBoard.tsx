import React, { useState, useEffect, useMemo } from 'react';
import { groupService } from '@/lib/firebase/groupService';
import { Group, Post } from '@/types/group';
import { format } from 'date-fns';
import PostEditorModal from './PostEditorModal';
import PostDetailModal from './PostDetailModal';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useLanguage } from '@/contexts/LanguageContext';

interface GroupBoardProps {
  group: Group;
}

const GroupBoard = ({ group }: GroupBoardProps) => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    const unsubscribe = groupService.subscribePosts(group.id, (fetchedPosts) => {
      setPosts(fetchedPosts);
    });
    return () => unsubscribe();
  }, [group.id]);

  const categories = useMemo(() => {
    const base = [{ id: 'all', title: t('all') || 'All' }];
    return [...base, ...(group.boards || [])];
  }, [group.boards, t]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesCategory;
    });
  }, [posts, selectedCategory]);

  const currentPosts = filteredPosts.slice(0, pageSize);

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return format(d, 'MMMM d, yyyy');
    } catch (e) {
      return '';
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    groupService.incrementPostViews(group.id, post.id);
  };

  const getCategoryLabel = (post: Post) => {
    return categories.find(c => c.id === post.category)?.title || (t('general') || 'General');
  };

  const getCategoryStyle = (post: Post, index: number) => {
    if (index === 0) return 'bg-primary text-on-primary';
    if (post.category === 'notice') return 'bg-tertiary-container text-on-tertiary-container';
    return 'bg-surface-variant text-on-surface';
  };

  return (
    <div>
      {/* Header / Selector */}
      <div className="mb-section_gap flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/15 pb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">{group.name || (t('community') || 'Community')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('latestUpdatesAnnouncements') || 'Latest updates and announcements.'}</p>
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-xl border-outline-variant bg-surface-container-lowest font-body-md text-body-md text-on-surface shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-3 pl-4 pr-10 appearance-none outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
            <span className="material-symbols-outlined">expand_more</span>
          </div>
        </div>
      </div>

      {/* Content Grid (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-element_gap">
        {currentPosts.map((post, index) => {
          const hasImage = !!post.image;
          const isFeatured = index === currentPosts.length - 1 && currentPosts.length >= 4 && selectedCategory === 'all';
          const categoryLabel = getCategoryLabel(post);
          const categoryStyle = getCategoryStyle(post, index);

          /* Card 4 Pattern: Featured wide card (last card when 4+ posts) */
          if (isFeatured) {
            return (
              <article
                key={post.id}
                onClick={() => handlePostClick(post)}
                className="bg-surface-container-lowest rounded-xl border border-outline/15 overflow-hidden group hover:shadow-md transition-shadow duration-300 flex flex-col md:col-span-2 lg:col-span-3 cursor-pointer"
              >
                <div className="p-6 flex-grow flex flex-col md:flex-row md:items-center gap-6">
                  {hasImage && (
                    <div className="md:w-1/3 h-48 md:h-auto md:aspect-video rounded-lg overflow-hidden bg-surface-container relative shrink-0">
                      <ImageWithFallback
                        src={post.image}
                        alt={post.title || ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallbackType="gallery"
                      />
                    </div>
                  )}
                  <div className="flex-grow flex flex-col justify-center">
                    <div className="font-label-sm text-label-sm text-on-surface-variant mb-2">{formatDate(post.createdAt)}</div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">{post.content}</p>
                    <button
                      className="self-start bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors"
                      onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}
                    >
                      {t('readMore') || 'Read more'}
                    </button>
                  </div>
                </div>
              </article>
            );
          }

          /* Card 1 Pattern: With image (image on top) */
          if (hasImage) {
            return (
              <article
                key={post.id}
                onClick={() => handlePostClick(post)}
                className="bg-surface-container-lowest rounded-xl border border-outline/15 overflow-hidden group hover:shadow-md transition-shadow duration-300 flex flex-col cursor-pointer"
              >
                <div className="h-48 w-full bg-surface-container overflow-hidden relative">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackType="gallery"
                  />
                  <div className={`absolute top-4 left-4 font-label-sm text-label-sm px-3 py-1 rounded-full uppercase tracking-widest ${categoryStyle}`}>{categoryLabel}</div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="font-label-sm text-label-sm text-on-surface-variant mb-2">{formatDate(post.createdAt)}</div>
                  <h3 className="font-title-lg text-title-lg text-on-surface mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3 mb-4 flex-grow">{post.content}</p>
                  <div className="mt-auto pt-4 border-t border-outline-variant/15 flex items-center justify-between text-primary">
                    <span className="font-label-md text-label-md">{t('readMore') || 'Read more'}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              </article>
            );
          }

          /* Card 2/3 Pattern: Text only */
          return (
            <article
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="bg-surface-container-lowest rounded-xl border border-outline/15 overflow-hidden group hover:shadow-md transition-shadow duration-300 flex flex-col cursor-pointer"
            >
              <div className="p-6 flex-grow flex flex-col">
                {post.category === 'notice' ? (
                  /* Card 2: With pin icon */
                  <div className="flex justify-between items-start mb-4">
                    <div className={`font-label-sm text-label-sm px-3 py-1 rounded-full uppercase tracking-widest ${categoryStyle}`}>{categoryLabel}</div>
                    <span className="material-symbols-outlined text-on-surface-variant">push_pin</span>
                  </div>
                ) : (
                  /* Card 3: Badge only */
                  <div className={`font-label-sm text-label-sm px-3 py-1 rounded-full uppercase tracking-widest self-start mb-4 ${categoryStyle}`}>{categoryLabel}</div>
                )}
                <div className="font-label-sm text-label-sm text-on-surface-variant mb-2">{formatDate(post.createdAt)}</div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3 mb-4 flex-grow">{post.content}</p>
                <div className="mt-auto pt-4 border-t border-outline-variant/15 flex items-center justify-between text-primary">
                  <span className="font-label-md text-label-md">{t('readMore') || 'Read more'}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Empty State */}
      {currentPosts.length === 0 && (
        <div className="py-24 text-center bg-surface-container-lowest rounded-2xl border border-outline/15 mt-element_gap">
          <span className="material-symbols-outlined text-6xl text-outline-variant opacity-20 mb-4 block">inbox</span>
          <h3 className="font-title-lg text-title-lg text-on-surface">{t('noPostsFound') || 'No posts found'}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('beTheFirstToShare') || 'Be the first to share something with the community!'}</p>
        </div>
      )}

      {/* Load More */}
      {filteredPosts.length > pageSize && (
        <div className="flex justify-center mt-section_gap">
          <button
            onClick={() => setPageSize(prev => prev + 12)}
            className="flex items-center gap-2 px-8 py-3 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-xl shadow-sm border border-outline/15 hover:bg-surface-container-low transition-all"
          >
            {t('loadMorePosts') || 'Load More Posts'}
            <span className="material-symbols-outlined">expand_more</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <div 
        className="fixed right-6 z-40 pointer-events-none"
        style={{ 
          bottom: 'calc(64px + max(env(safe-area-inset-bottom), 12px) + 3mm)',
          transform: 'translateY(var(--woc-bottom-nav-y, 0px))',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <button
          onClick={() => {
            setEditingPost(null);
            setIsEditorOpen(true);
          }}
          className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
        </button>
      </div>

      {/* Modals */}
      {isEditorOpen && (
        <PostEditorModal
          group={group}
          post={editingPost}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingPost(null);
          }}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          groupId={group.id}
          post={selectedPost}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onEdit={(post) => {
            setIsDetailOpen(false);
            setEditingPost(post);
            setIsEditorOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default GroupBoard;
