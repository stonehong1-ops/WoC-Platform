import React, { useState, useEffect, useMemo } from 'react';
import { groupService } from '@/lib/firebase/groupService';
import { Group, Post } from '@/types/group';
import { formatDistanceToNow } from 'date-fns';
import PostEditorModal from './PostEditorModal';
import PostDetailModal from './PostDetailModal';
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface GroupBoardProps {
  group: Group;
}

const GroupBoard = ({ group }: GroupBoardProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
    const base = [{ id: 'all', title: 'All' }];
    return [...base, ...(group.boards || [])];
  }, [group.boards]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Category Filter
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      
      // Search Filter
      const matchesSearch = !searchQuery || (post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.content.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const currentPosts = filteredPosts.slice(0, pageSize);

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return formatDistanceToNow(d, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    groupService.incrementPostViews(group.id, post.id);
  };

  return (
    <div className="space-y-12">
      {/* Board Header & Categories */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Community Board</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">Connect, share, and learn with fellow dancers.</p>
          </div>
          
          {/* Search Bar Integration */}
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..." 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Horizontal Scrollable Categories */}
        <div className="flex overflow-x-auto pb-4 -mx-6 px-6 space-x-3 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`snap-start flex-shrink-0 font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20 -translate-y-0.5"
                  : "bg-surface-container-lowest text-on-surface shadow-sm outline outline-1 outline-outline-variant/10 hover:bg-surface-container-low"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </section>

      {/* Post List (Bento Grid Style) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPosts.map((post, index) => {
          const isFeatured = index === 0 && selectedCategory === 'all' && !searchQuery; // Featured if first post and no specific filter
          const hasImage = !!post.image;
          const categoryTitle = categories.find(c => c.id === post.category)?.title || 'General';

          if (isFeatured) {
            return (
              <article 
                key={post.id}
                onClick={() => handlePostClick(post)}
                className="bg-surface-container-lowest rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 overflow-hidden lg:col-span-2 group hover:shadow-md transition-all duration-300 transform scale-100 active:scale-99 flex flex-col sm:flex-row cursor-pointer"
              >
                <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden bg-surface-container-low">
                  <ImageWithFallback 
                    src={post.image} 
                    alt={post.title || ""} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackType="gallery"
                  />
                  <div className="absolute top-3 left-3 bg-tertiary-container/80 backdrop-blur-sm text-on-tertiary-container font-label font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">Featured</div>
                </div>
                <div className="p-6 flex flex-col justify-between w-full sm:w-3/5">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-xs font-bold text-primary tracking-wide uppercase">{categoryTitle}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-xs font-medium text-on-surface-variant">{formatDate(post.createdAt)}</span>
                    </div>
                    <h3 className="font-headline font-bold text-xl text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="font-body text-sm text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary-container flex items-center justify-center">
                        {post.author.avatar ? (
                          <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-xs text-on-secondary-container">person</span>
                        )}
                      </div>
                      <span className="font-body text-xs font-semibold text-on-surface">{post.author.name}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-on-surface-variant">
                      <div className="flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span className="text-xs font-bold">{(post.views || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                        <span className="text-xs font-bold">{(post.comments || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          }

          // Standard Card (with or without image)
          return (
            <article 
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="bg-surface-container-lowest rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 overflow-hidden group hover:shadow-md transition-all duration-300 transform scale-100 active:scale-99 flex flex-col cursor-pointer"
            >
              {hasImage && (
                <div className="w-full h-40 relative overflow-hidden bg-surface-container-low">
                  <ImageWithFallback 
                    src={post.image} 
                    alt={post.title || ""} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackType="gallery"
                  />
                </div>
              )}
              <div className="p-6 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs font-bold text-primary tracking-wide uppercase">{categoryTitle}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="text-xs font-medium text-on-surface-variant">{formatDate(post.createdAt)}</span>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">
                    {post.content}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary-container flex items-center justify-center">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-xs text-on-secondary-container">person</span>
                      )}
                    </div>
                    <span className="font-body text-xs font-semibold text-on-surface">{post.author.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-on-surface-variant">
                    <div className="flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span className="text-xs font-bold">{(post.views || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                      <span className="text-xs font-bold">{(post.comments || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Empty State */}
      {currentPosts.length === 0 && (
        <div className="py-24 text-center bg-surface-container-lowest rounded-2xl outline outline-1 outline-outline-variant/10">
          <span className="material-symbols-outlined text-6xl text-outline-variant opacity-20 mb-4 block">inbox</span>
          <h3 className="text-lg font-bold text-on-surface">No posts found</h3>
          <p className="text-sm text-on-surface-variant mt-1">Be the first to share something with the community!</p>
        </div>
      )}

      {/* Load More */}
      {filteredPosts.length > pageSize && (
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => setPageSize(prev => prev + 12)}
            className="flex items-center gap-2 px-8 py-3 bg-surface-container-lowest text-on-surface font-bold rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 hover:bg-surface-container-low transition-all"
          >
            Load More Posts
            <span className="material-symbols-outlined">expand_more</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => {
          setEditingPost(null);
          setIsEditorOpen(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
        {/* Tooltip or Label could be added here if needed */}
      </button>

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
