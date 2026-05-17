import React, { useState, useEffect, useMemo } from 'react';
import { groupService } from '@/lib/firebase/groupService';
import { Group, Post } from '@/types/group';
import PostEditorModal from './PostEditorModal';
import PostDetailModal from './PostDetailModal';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useLanguage } from '@/contexts/LanguageContext';
import { KIND_ICON, KIND_COLOR } from '@/constants/tags';
import GroupBoardEditor from './GroupBoardEditor';

interface GroupBoardProps {
  group: Group;
  isAdmin?: boolean;
}

const GroupBoard = ({ group, isAdmin = false }: GroupBoardProps) => {
  const { t, formatDate } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pageSize, setPageSize] = useState(15);

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

  // Uses formatDate from LanguageContext

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    groupService.incrementPostViews(group.id, post.id);
  };

  const getCategoryLabel = (post: Post) => {
    return categories.find(c => c.id === post.category)?.title || (t('general') || 'General');
  };

  const renderTags = (post: Post) => {
    const tags = post.postTags || post.tags;
    if (!tags || tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {tags.map((tag: any, idx: number) => {
          if (typeof tag === 'string') {
            return (
              <span key={idx} className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500">#{tag}</span>
            );
          }
          return (
            <div key={tag.id || idx} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${KIND_COLOR[tag.kind] || 'text-slate-500 bg-slate-100'}`}>
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {KIND_ICON[tag.kind] || 'label'}
              </span>
              <span className="truncate max-w-[100px]">{tag.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 bg-[#f4f6fc] min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Header & Categories */}
      <div className="px-4 pt-4 mb-4 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#242c51] tracking-tight">{t('group.board.title') || 'Notice Board'}</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setIsBoardEditorOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-[#0057bd] hover:bg-[#0057bd]/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            )}
            <button 
              onClick={() => {
                setEditingPost(null);
                setIsEditorOpen(true);
              }}
              className="bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold py-1.5 px-3 rounded-lg shadow-sm shadow-[#0057bd]/20 flex items-center justify-center gap-1.5 hover:bg-[#004ca6] transition-colors active:scale-[0.99] text-xs"
            >
              <span className="material-symbols-outlined text-[14px]">edit_document</span>
              {t('group.board.write_post') || 'Write'}
            </button>
          </div>
        </div>

        {/* Swipeable Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
                selectedCategory === cat.id
                  ? 'text-[#0057bd] border-[#0057bd]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      <div className="px-4 flex flex-col gap-3">
        {currentPosts.map((post) => {
          const hasImage = !!post.image;
          const categoryLabel = getCategoryLabel(post);
          const isNotice = post.category === 'notice';

          return (
            <article
              key={post.id}
              onClick={() => handlePostClick(post)}
              className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-4 ${isNotice ? 'border-[#0057bd]/30' : 'border-slate-100'}`}
            >
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isNotice ? 'bg-[#0057bd]/10 text-[#0057bd]' : 'bg-slate-100 text-slate-500'}`}>
                    {categoryLabel}
                  </span>
                  {isNotice && <span className="material-symbols-outlined text-[#0057bd] text-[14px]">push_pin</span>}
                  <span className="text-xs font-medium text-slate-400 ml-auto">{formatDate(post.createdAt, 'dateTime')}</span>
                </div>
                <h3 className="text-base font-bold text-[#242c51] truncate mb-1">{post.title}</h3>
                <p className="text-sm font-medium text-slate-500 line-clamp-2 mb-2">{post.content}</p>
                {renderTags(post)}
              </div>
              
              {hasImage && (
                <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title || ""}
                    className="w-full h-full object-cover"
                    fallbackType="gallery"
                  />
                </div>
              )}
            </article>
          );
        })}

        {currentPosts.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-100 shadow-sm mt-4">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">inbox</span>
            <h3 className="text-sm font-bold text-[#242c51]">{t('noPostsFound') || 'No posts found'}</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">{t('beTheFirstToShare') || 'Be the first to share something with the community!'}</p>
          </div>
        )}

        {/* Load More */}
        {filteredPosts.length > pageSize && (
          <div className="flex justify-center mt-6 mb-4">
            <button
              onClick={() => setPageSize(prev => prev + 15)}
              className="flex items-center gap-2 px-6 py-2 bg-white text-slate-600 font-bold text-xs rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {t('loadMorePosts') || 'Load More'}
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
        )}
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

      {/* Admin Board Settings Popup */}
      {isBoardEditorOpen && isAdmin && (
        <GroupBoardEditor
          group={group}
          onClose={() => setIsBoardEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default GroupBoard;
