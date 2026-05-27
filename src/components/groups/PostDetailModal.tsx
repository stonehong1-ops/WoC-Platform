'use client';

import React, { useState, useEffect } from 'react';
import { Post, Comment } from '@/types/group';
import { motion, AnimatePresence } from 'framer-motion';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { KIND_ICON, KIND_COLOR } from '@/constants/tags';
import UserProfileClickable from '@/components/common/UserProfileClickable';
import UserBadge from '@/components/common/UserBadge';

interface PostDetailModalProps {
  groupId: string;
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (post: Post) => void;
}

export default function PostDetailModal({ groupId, post, isOpen, onClose, onEdit }: PostDetailModalProps) {
  const { user, profile, setShowLogin } = useAuth();
  const { t, formatDate } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 프리미엄 인터랙션을 위한 상태 추가
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 1. 댓글 실시간 바인딩
  useEffect(() => {
    if (!isOpen || !post) return;

    setLikeCount(post.likes || 0);
    setIsLiked(false); // 로컬 토글 상태 초기화

    const unsubscribe = groupService.subscribeComments(groupId, post.id, (fetchedComments) => {
      setComments(fetchedComments as Comment[]);
    });

    return () => unsubscribe();
  }, [isOpen, post, groupId]);

  // 2. 모바일/PWA 물리적/제스처 뒤로가기(Friction) 원스톱 제어 장치 탑재
  // 컴포넌트의 최초 마운트(열림) 및 최종 언마운트(닫힘) 생명주기에만 1회 결착되도록 의존성 격리
  useEffect(() => {
    // 히스토리 가상 상태 push하여 뒤로가기 스택 선점
    window.history.pushState({ postDetailOpen: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      // 뒤로가기 터치 시 앱이 꺼지거나 튕기는 대신 안전하게 뷰창만 닫아 보드 목록 유지
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // 수동 닫기 단추 탭 시 히스토리 스택 원상복구
      if (window.history.state?.postDetailOpen) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!post) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 100) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  const handleLikeClick = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (isLiked) return; // 연속 추천 방지

    setIsLiked(true);
    setLikeCount(prev => prev + 1);

    try {
      await groupService.likePost(groupId, post.id);
    } catch (error) {
      console.error('Failed to like post:', error);
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/groups/${groupId}?post=${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content.substring(0, 100),
        url: shareUrl,
      }).catch((err) => console.log('Share canceled', err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(t('blog.link_copied', '링크가 클립보드에 복사되었습니다.'));
    }
  };

  const handleAddComment = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      setShowLogin(true);
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    setIsSubmitting(true);
    try {
      await groupService.addComment(groupId, post.id, {
        content: trimmedComment,
        author: {
          id: user.uid,
          name: profile?.nickname || user.displayName || 'Anonymous',
          avatar: profile?.photoURL || user.photoURL || ''
        }
      });
      setNewComment('');
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      if (error.code === 'permission-denied') {
        alert(t('group.permission_denied'));
      } else {
        alert(t('group.comment_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t('group.delete_comment_confirm'))) return;
    try {
      await groupService.deleteComment(groupId, post.id, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm(t('group.delete_post_confirm'))) return;
    try {
      await groupService.deletePost(groupId, post.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const isAuthor = user?.uid === post.author.id;
  const readTime = Math.max(1, Math.ceil(post.content.length / 500));

  // 청사진(antigravity.txt) 규격에 완벽히 매칭하는 마크다운 파서 엔진
  const renderParsedContent = (content: string) => {
    if (!content) return (
      <p className="font-body-lg text-body-lg leading-relaxed italic text-on-surface-variant/50">
        {t('group.no_content')}
      </p>
    );

    const lines = content.split('\n');
    let hasDroppedCap = false;

    // 가독성(Readability)을 획기적으로 개선하기 위해 본문 텍스트 컬러를 선명한 text-on-surface로 고정
    return (
      <div className="space-y-12 font-body-lg text-body-lg text-on-surface leading-relaxed tracking-wide">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // 1. 다이아몬드 예술적 아티클 레이아웃 파서 (Artistic Insert)
          // ![제목: 설명](이미지URL) 또는 ![제목|설명](이미지URL)
          const imgMatch = trimmed.match(/^!\[(.*?)\]\((.+)\)$/);
          if (imgMatch) {
            const altText = imgMatch[1];
            const imgUrl = imgMatch[2];
            
            // 만약 이미지 주소가 대표 커버 이미지(post.image)와 동일하다면 본문 중간의 중복 렌더링을 원천 생략
            if (post.image && imgUrl === post.image) {
              return null;
            }
            
            const divider = altText.includes('|') ? '|' : (altText.includes(':') ? ':' : null);
            
            if (divider) {
              const parts = altText.split(divider);
              const subTitle = parts[0].trim();
              const description = parts.slice(1).join(divider).trim();
              
              return (
                <div key={idx} className="relative py-12 flex flex-col md:flex-row items-center gap-12 overflow-hidden border-t border-b border-outline-variant/10 my-16">
                  <div className="w-full md:w-1/2 flex justify-center">
                    <div className="rhombus-mask w-64 h-64 md:w-80 md:h-80 bg-surface-variant relative overflow-hidden shadow-2xl transform rotate-0 hover:scale-105 transition-transform duration-500">
                      <img alt={subTitle} className="absolute inset-0 w-full h-full object-cover" src={imgUrl} />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 text-left">
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-4 text-2xl font-bold tracking-tight">{subTitle}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              );
            } else {
              // 일반 이미지 마크다운을 프리미엄 16대9 포맷으로 전환
              return (
                <div key={idx} className="relative w-full rounded-2xl overflow-hidden my-12 shadow-md border border-outline-variant/15 aspect-[16/9] group">
                  <img alt={altText} className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" src={imgUrl} />
                  {altText && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-xs text-white p-4 text-sm font-semibold text-center truncate">
                      {altText}
                    </div>
                  )}
                </div>
              );
            }
          }

          // 2. 제목 헤더 파서
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-3xl font-black font-headline text-on-surface mt-16 mb-6 pb-3 border-b border-outline-variant/15 tracking-tight">
                {trimmed.replace('## ', '')}
              </h2>
            );
          }

          // 3. 고품격 blockquote 파서 (저자 푸터 추출 장치 탑재)
          if (trimmed.startsWith('> ')) {
            const rawQuote = trimmed.replace('> ', '');
            const authorRegex = /(?:\u2014|\u2013|--)\s*(.+)$/;
            const authorMatch = rawQuote.match(authorRegex);
            let quoteText = rawQuote;
            let authorText = '';

            if (authorMatch) {
              quoteText = rawQuote.replace(authorRegex, '').trim();
              authorText = authorMatch[1].trim();
            }

            // 큰따옴표 벗겨진 텍스트 감싸기
            const quoteContent = (quoteText.startsWith('"') && quoteText.endsWith('"'))
              ? quoteText
              : `"${quoteText}"`;

            return (
              <blockquote key={idx} className="border-l-4 border-primary pl-8 py-6 my-16 italic font-headline-md text-2xl text-on-surface bg-surface-container-low rounded-r-2xl relative shadow-2xs">
                <span className="material-symbols-outlined absolute left-2 top-2 text-primary/10 text-5xl pointer-events-none select-none font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                  format_quote
                </span>
                <div className="relative z-10 font-medium leading-relaxed">{quoteContent}</div>
                {authorText && (
                  <footer className="mt-4 font-label-md not-italic text-primary text-sm font-bold tracking-wider">
                    — {authorText}
                  </footer>
                )}
              </blockquote>
            );
          }

          // 4. 수평 구분선
          if (trimmed === '---') {
            return (
              <hr key={idx} className="my-14 border-t border-outline-variant/30" />
            );
          }

          // 5. 공백 라인
          if (line === '') {
            return <div key={idx} className="h-6" />;
          }

          // 6. 첫 글자 대왕 드롭캡 처리
          if (!hasDroppedCap && trimmed.length > 0 && !trimmed.startsWith('- ')) {
            hasDroppedCap = true;
            return (
              <p key={idx} className="first-letter:text-7xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left whitespace-pre-wrap font-body-lg text-body-lg leading-relaxed text-on-surface mb-6">
                {line}
              </p>
            );
          }

          // 7. 일반 문단
          return (
            <p key={idx} className="whitespace-pre-wrap font-body-lg text-body-lg leading-relaxed text-on-surface mb-6">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onScroll={handleScroll}
          className="fixed inset-0 z-[120] bg-surface text-on-surface overflow-y-auto w-full h-full"
        >
          {/* 럭셔리 투명-반투명 반응형 탑 바 (Top App Bar) */}
          <header className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center h-20 px-6 md:px-12 transition-all duration-300 ${
            isScrolled 
              ? 'bg-surface/95 backdrop-blur-md shadow-xs border-b border-outline-variant/15 text-on-surface' 
              : 'bg-transparent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
          }`}>
            <button 
              onClick={onClose}
              aria-label="Go back" 
              className={`flex items-center justify-center p-2.5 rounded-full transition-colors active:scale-95 group ${
                isScrolled ? 'hover:bg-surface-container-high text-on-surface-variant' : 'hover:bg-white/10 text-white'
              }`}
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform" data-icon="arrow_back">arrow_back</span>
            </button>

            {/* 스크롤 시 헤더 정중앙에 아티클 제목을 표시하는 shop 기준 규격 적용 (크기 격상 및 2줄 정렬) */}
            {isScrolled && (
              <div className="absolute left-1/2 -translate-x-1/2 max-w-[65%] line-clamp-2 text-center font-headline text-base md:text-lg font-black tracking-tight text-on-surface leading-tight animate-in fade-in slide-in-from-top-2 duration-300">
                {post.title}
              </div>
            )}

            <div className="flex items-center gap-4">
              {isAuthor && (
                <>
                  <button 
                    onClick={() => onEdit(post)} 
                    aria-label="Edit" 
                    className={`flex items-center justify-center p-2.5 rounded-full transition-colors active:scale-95 ${
                      isScrolled ? 'hover:bg-surface-container-high text-on-surface-variant' : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button 
                    onClick={handleDeletePost} 
                    aria-label="Delete" 
                    className={`flex items-center justify-center p-2.5 rounded-full transition-colors active:scale-95 ${
                      isScrolled ? 'hover:bg-surface-container-high text-error' : 'hover:bg-white/10 text-red-400'
                    }`}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </>
              )}
              <button 
                onClick={handleShareClick}
                aria-label="Share" 
                className={`flex items-center justify-center p-2.5 rounded-full transition-colors active:scale-95 ${
                  isScrolled ? 'hover:bg-surface-container-high text-on-surface-variant' : 'hover:bg-white/10 text-white'
                }`}
              >
                <span className="material-symbols-outlined" data-icon="share">share</span>
              </button>
            </div>
          </header>

          {/* 메인 캔버스 영역 */}
          <main className="w-full pb-32">
            
            {/* 시네마틱 풀-히어로 이미지 및 타이틀 섹션 */}
            <section className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden bg-surface-container-low border-b border-outline-variant/10">
              {post.image ? (
                <img 
                  alt={post.title} 
                  className="absolute inset-0 w-full h-full object-cover" 
                  src={post.image}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface-container-low to-tertiary/25 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[120px] text-primary/5 pointer-events-none select-none">auto_stories</span>
                </div>
              )}
              {/* 시네마틱 오버레이 섀도우 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-black/10 to-black/35 pointer-events-none" />
              
              <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-16 md:pb-24 flex flex-col items-center text-center z-10">
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <span className="bg-primary/25 backdrop-blur-md text-white border border-white/20 px-5 py-1.5 rounded-full font-label-md text-[13px] font-bold uppercase tracking-wider shadow-sm">
                    {post.category === 'notice' ? t('group.notice') : post.category || t('group.general')}
                  </span>
                </div>
                <h1 className="font-display-lg text-3xl sm:text-5xl md:text-[56px] max-w-4xl leading-tight text-white mb-8 font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                  {post.title}
                </h1>
                
                <div className="flex items-center justify-center gap-4 text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                  <img 
                    alt={post.author.name} 
                    className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm" 
                    src={post.author.avatar || '/anonymous-user.png'} 
                  />
                  <div className="text-left">
                    <p className="font-label-md text-label-md text-white font-extrabold">{post.author.name}</p>
                    <p className="font-label-sm text-[12px] text-white/80 mt-0.5 font-medium">
                      {formatDate(post.createdAt, 'dateOnly')} • {readTime}{t('group.min_read')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 아티클 감성 타이포그래피 영역 */}
            <article className="max-w-4xl mx-auto px-6 py-16">
              <div className="prose prose-lg max-w-none text-on-surface mb-20">
                {renderParsedContent(post.content)}

                {/* 미디어 갤러리: post.media의 이미지/비디오 렌더링 (마크다운 및 커버 이미지와 중복 제거) */}
                {(() => {
                  if (!post.media || post.media.length === 0) return null;
                  
                  // content 내 마크다운 이미지 URL 추출 (중복 방지)
                  const contentImageUrls = new Set<string>();
                  const imgRegex = /!\[.*?\]\((.+?)\)/g;
                  let regMatch;
                  while ((regMatch = imgRegex.exec(post.content || '')) !== null) {
                    contentImageUrls.add(regMatch[1]);
                  }

                  const mediaItems = post.media.filter((m: any) => {
                    const url = typeof m === 'string' ? m : m.url;
                    const type = typeof m === 'string' ? 'image' : (m.type || 'image');
                    if (type === 'link') return false;
                    if (url === post.image) return false;
                    if (contentImageUrls.has(url)) return false;
                    return true;
                  });

                  if (mediaItems.length === 0) return null;

                  return (
                    <div className="space-y-8 mt-12">
                      {mediaItems.map((m: any, idx: number) => {
                        const url = typeof m === 'string' ? m : m.url;
                        const type = typeof m === 'string' ? 'image' : (m.type || 'image');
                        return (
                          <div key={idx} className="relative w-full rounded-2xl overflow-hidden shadow-md border border-outline-variant/15 aspect-[16/9]">
                            {type === 'video' ? (
                              <video className="w-full h-full object-cover" src={url} controls playsInline />
                            ) : (
                              <img alt="" className="w-full h-full object-cover" src={url} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* 하단 좋아요 & 공유 & 책갈피 반응형 패널 */}
              <div className="max-w-4xl mx-auto pb-12 flex justify-between items-center border-t border-outline-variant/20 pt-8 mt-16 animate-in fade-in duration-300">
                <div className="flex items-center gap-8">
                  <button 
                    onClick={handleLikeClick}
                    className={`flex items-center gap-2 group active:scale-95 duration-100 ${
                      isLiked ? 'text-secondary font-bold' : 'text-on-surface hover:text-secondary'
                    }`}
                  >
                    <span 
                      className="material-symbols-outlined transition-colors text-[24px]"
                      style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                    <span className="font-label-md text-label-md font-bold">{likeCount}</span>
                  </button>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
                    <span className="font-label-md text-label-md font-bold">{comments.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleShareClick}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-primary/10 text-on-surface hover:text-primary transition-colors active:scale-95 duration-100" 
                    title={t('blog.share', 'Share')}
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </button>
                </div>
              </div>

              {/* 댓글 소통 영역 */}
              <div className="max-w-3xl mx-auto mt-8">
                <h4 className="font-title-lg text-title-lg text-on-surface mb-6 font-bold">{t('group.comments')} ({comments.length})</h4>
                
                {/* 댓글 등록 입력 인풋 */}
                <div className="flex gap-4 items-start w-full bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 shadow-3xs mb-8">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0 border border-outline-variant/10">
                    {profile?.photoURL || user?.photoURL ? (
                      <img src={profile?.photoURL || user?.photoURL || ''} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-on-surface">person</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('group.share_thoughts')}
                      className="w-full bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/45 outline-none min-h-[60px]"
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={handleAddComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-label-md shadow-xs hover:bg-primary/90 transition-all disabled:opacity-40"
                      >
                        {t('group.post')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 댓글 목록 */}
                <div className="w-full space-y-6">
                  {comments.length === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant/60 text-center py-10">{t('group.no_comments')}</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex items-start justify-between group/comment w-full py-3 border-b border-outline-variant/10 last:border-b-0">
                        <div className="flex-1 text-left">
                          <UserBadge
                            uid={comment.author.id || ''}
                            nickname={comment.author.name}
                            photoURL={comment.author.avatar}
                            avatarSize="w-10 h-10 ring-1 ring-slate-100/50 shadow-3xs"
                            nameClassName="font-label-md text-label-md text-on-surface hover:underline cursor-pointer font-bold"
                            className="block"
                            subText={
                              <div className="flex flex-col gap-2 mt-1">
                                <span className="font-label-sm text-[11px] text-on-surface-variant/60 font-medium">
                                  {formatDate(comment.createdAt, 'dateOnly')}
                                </span>
                                <p className="font-body-md text-body-md text-on-surface/90 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            }
                          />
                        </div>
                        {user?.uid === comment.author.id && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-error hover:scale-110 p-2 shrink-0 self-start"
                            aria-label="Delete comment"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </article>

            {/* 프리미엄 명품 Footer */}
            <footer className="w-full py-16 bg-surface-container-lowest border-t border-outline-variant/20 mt-16">
              <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <h2 className="font-display-lg text-xl tracking-widest text-on-surface font-extrabold uppercase">WORLD OF COMMUNITY</h2>
                <div className="flex gap-6 text-sm">
                  <a className="text-on-surface-variant/70 hover:text-primary transition-all font-medium" href="#">Archive</a>
                  <a className="text-on-surface-variant/70 hover:text-primary transition-all font-medium" href="#">Privacy</a>
                  <a className="text-on-surface-variant/70 hover:text-primary transition-all font-medium" href="#">Terms</a>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant/50">© 2026 WORLD OF COMMUNITY. ART IN DIALOGUE.</p>
              </div>
            </footer>

          </main>

          {/* 데스크톱 전용 Premium Floating Action Bar (antigravity.txt 청사진 100% 매칭) */}
          <div className="hidden md:flex fixed right-10 bottom-16 flex-col gap-4 z-40 animate-in slide-in-from-bottom-5 duration-300">
            <button 
              onClick={handleLikeClick}
              className={`w-14 h-14 bg-surface shadow-lg rounded-full flex items-center justify-center border border-outline-variant/15 transition-all duration-300 hover:scale-105 active:scale-95 group ${
                isLiked ? 'text-secondary' : 'text-on-surface hover:text-secondary'
              }`}
            >
              <span 
                className="material-symbols-outlined text-[28px] transition-transform duration-300 group-hover:scale-110" 
                style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
            <button 
              onClick={handleShareClick}
              className="w-14 h-14 bg-primary text-on-primary shadow-lg rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-primary/95 active:scale-95 group"
            >
              <span className="material-symbols-outlined text-[28px] transition-transform duration-300 group-hover:rotate-12">
                share
              </span>
            </button>
          </div>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}
