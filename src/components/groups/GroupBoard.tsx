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
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_board_posts_${group.id}`);
      if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
      }
    }
    return [];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    const unsubscribe = groupService.subscribePosts(group.id, (fetchedPosts) => {
      setPosts(fetchedPosts);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_board_posts_${group.id}`, JSON.stringify(fetchedPosts));
      }
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

  // 마크다운 기호를 정화하고 알맹이 텍스트만 추출하는 헬퍼 함수
  const stripMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/!\[.*?\]\(.*?\)/g, '') // 이미지 제거
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 링크 제거
      .replace(/^>\s*/gm, '') // 인용구 제거
      .replace(/^##\s+/gm, '') // 헤더 제거
      .replace(/\s+/g, ' ') // 공백 개행 정돈
      .trim();
  };

  // posts가 실시간으로 갱신될 때마다 가장 신선한 최신 상태의 데이터를 뷰창으로 바인딩
  const selectedPost = useMemo(() => {
    if (!selectedPostId) return null;
    return posts.find(p => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  const handlePostClick = (post: Post) => {
    setSelectedPostId(post.id);
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
    <div className="max-w-[600px] mx-auto w-full pb-20 bg-background min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Header & Categories */}
      <div className="px-4 pt-4 mb-4 border-b border-outline-variant/15 bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-headline text-on-surface tracking-tight">{t('group.board.title')}</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setIsBoardEditorOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant/70 hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            )}
            <button 
              onClick={() => {
                setEditingPost(null);
                setIsEditorOpen(true);
              }}
              className="bg-primary text-on-primary font-headline font-bold py-1.5 px-3 rounded-lg shadow-sm shadow-primary/20 flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity active:scale-[0.99] text-xs"
            >
              <span className="material-symbols-outlined text-[14px]">edit_document</span>
              {t('group.board.write_post')}
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
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant/70 border-transparent hover:text-on-surface'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      <div className="px-4 flex flex-col gap-4">
        {currentPosts.map((post) => {
          const hasImage = !!post.image;
          const categoryLabel = getCategoryLabel(post);
          const isNotice = post.category === 'notice';
          const readTime = Math.max(1, Math.ceil((post.content || '').length / 500));

          return (
            <article
              key={post.id}
              onClick={() => handlePostClick(post)}
              className={`bg-surface-container-lowest rounded-2xl p-5 border shadow-sm hover:shadow-md hover:scale-[1.005] active:scale-[0.995] transition-all duration-200 cursor-pointer flex gap-5 items-start ${
                isNotice ? 'border-primary/25 bg-primary/[0.01]' : 'border-outline-variant/15'
              }`}
            >
              {hasImage && (
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20 shadow-inner">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title || ""}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    fallbackType="gallery"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isNotice ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface-variant'
                  }`}>
                    {categoryLabel}
                  </span>
                  {isNotice && <span className="material-symbols-outlined text-primary text-[14px]">push_pin</span>}
                  
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant/75 ml-auto">
                    <time>{formatDate(post.createdAt, 'dateTime')}</time>
                    <span className="w-0.5 h-0.5 rounded-full bg-outline-variant/40" />
                    <span>{readTime}{t('group.min_read') || 'min read'}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-black font-headline text-on-surface line-clamp-2 mb-1.5 leading-snug tracking-tight hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm font-medium text-on-surface-variant/85 line-clamp-2 mb-1.5 leading-relaxed">
                  {stripMarkdown(post.content)}
                </p>
              </div>
            </article>
          );
        })}

        {currentPosts.length === 0 && (
          <div className="py-16 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm mt-4">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 block">inbox</span>
            <h3 className="text-sm font-bold font-headline text-on-surface">{t('noPostsFound')}</h3>
            <p className="text-xs font-medium text-on-surface-variant/70 mt-1">{t('beTheFirstToShare')}</p>
          </div>
        )}

        {/* Load More */}
        {filteredPosts.length > pageSize && (
          <div className="flex justify-center mt-6 mb-4">
            <button
              onClick={() => setPageSize(prev => prev + 15)}
              className="flex items-center gap-2 px-6 py-2 bg-surface-container-lowest text-on-surface font-bold text-xs rounded-full shadow-sm border border-outline-variant/30 hover:bg-surface-container-low transition-colors"
            >
              {t('loadMorePosts')}
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
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedPostId(null);
          }}
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
