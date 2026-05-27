'use client';

import React, { useState, useRef, useEffect } from 'react';
import Portal from '@/components/common/Portal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/components/providers/AuthProvider';
import { storageService } from '@/lib/firebase/storageService';
import { groupService } from '@/lib/firebase/groupService';
import { userService } from '@/lib/firebase/userService';
import { eventService } from '@/lib/firebase/eventService';
import { socialService } from '@/lib/firebase/socialService';
import { Group, Post, GroupBoard as GroupBoardType, DEFAULT_BOARDS } from '@/types/group';
import { toast } from 'sonner';
import { KIND_ICON, KIND_COLOR } from '@/constants/tags';
import UserBadge from '@/components/common/UserBadge';

/* --- Types --- */
interface MediaItem {
  id: string; url: string; type: 'image' | 'video' | 'link';
  progress: number; status: 'uploading' | 'completed' | 'error'; file?: File;
  linkMetadata?: {
    title: string;
    description: string;
    image: string;
    domain: string;
  };
}
interface TagItem { id: string; label: string; kind: 'people' | 'event' | 'social' | 'group'; photo?: string; }
interface PostEditorModalProps {
  group: Group;
  post?: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

/* --- Style config --- */
const COLOR_PALETTE = [
  { bg: 'transparent', text: '#191b22', name: 'Default', isDefault: true },
  { bg: '#dbeafe', text: '#1e3a8a', name: 'Soft Blue' },
  { bg: '#dcfce7', text: '#14532d', name: 'Soft Green' },
  { bg: '#ffe4e6', text: '#9f1239', name: 'Soft Pink' },
  { bg: '#fef9c3', text: '#78350f', name: 'Soft Yellow' },
  { bg: '#f1f5f9', text: '#334155', name: 'Light Grey' },
  { bg: '#1a1a2e', text: '#e0e0ff', name: 'Midnight' },
  { bg: '#0f3460', text: '#e0f0ff', name: 'Ocean' },
  { bg: '#1b4332', text: '#d8f3dc', name: 'Forest' },
  { bg: '#4a0072', text: '#f3d0ff', name: 'Violet' },
  { bg: '#ff6b6b', text: '#fff', name: 'Coral' },
  { bg: '#ffd93d', text: '#1a1a1a', name: 'Sun' },
];
const IMPACT_SIZES = [
  { label: 'A', cls: 'text-xl font-normal',              weight: 400, size: '15px' },
  { label: 'A', cls: 'text-2xl font-bold',               weight: 700, size: '18px' },
  { label: 'A', cls: 'text-3xl font-black tracking-tight', weight: 900, size: '21px' },
];
const EMPHASIS_OPTIONS = [
  { label: 'B', cls: 'font-bold', title: 'Bold' },
  { label: 'I', cls: 'italic', title: 'Italic' },
  { label: 'AA', cls: 'uppercase tracking-widest', title: 'Uppercase' },
];

export default function PostEditorModal({ group, post, isOpen, onClose }: PostEditorModalProps) {
  const { t } = useLanguage();
  const { user, profile, setShowLogin } = useAuth();
  
  const boards = (group.boards && group.boards.length > 0) ? group.boards : DEFAULT_BOARDS;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(boards[0]?.id || 'notice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 독립된 대표 커버 이미지 전용 상태
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<typeof COLOR_PALETTE[0] | null>(null);
  const [selectedImpact, setSelectedImpact] = useState(0);
  const [selectedEmphasis, setSelectedEmphasis] = useState<number[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagKeyword, setTagKeyword] = useState('');
  const [tagResults, setTagResults] = useState<TagItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const bodyImageInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow height for content textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content]);

  const insertText = (before: string, after: string = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || '') + after;
    setContent(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 0));
    }, 0);
  };

  const isShort = content.length <= 70 && content.length > 0;
  const colorActive = selectedColor && !selectedColor.isDefault;
  const showColorPreview = isShort && colorActive;
  const showMedia = !showColorPreview;

  const previewClass = [IMPACT_SIZES[selectedImpact].cls, ...selectedEmphasis.map(i => EMPHASIS_OPTIONS[i].cls)].join(' ');
  const imageCount = coverImageUrl ? 1 : 0;
  const videoCount = 0;

  /* 🔗 Link Auto Detection & Manual Adding 🔗 */
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputVal, setLinkInputVal] = useState('');

  const handleLinkSubmit = async () => {
    if (!linkInputVal.trim()) return;
    const url = linkInputVal.trim();
    setLinkInputVal('');
    setShowLinkInput(false);
    await fetchLinkMetadata(url);
  };

  const fetchLinkMetadata = async (url: string) => {
    if (media.some(m => m.url === url)) return;

    const tempId = Math.random().toString(36).slice(7);
    setMedia(prev => [...prev, {
      id: tempId,
      url,
      type: 'link',
      progress: 50,
      status: 'uploading'
    }]);

    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setMedia(prev => prev.map(m => m.id === tempId ? {
        ...m,
        status: 'completed',
        progress: 100,
        linkMetadata: {
          title: data.title || '',
          description: data.description || '',
          image: data.image || '',
          domain: data.domain || ''
        }
      } : m));
    } catch {
      setMedia(prev => prev.filter(m => m.id !== tempId));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = content.match(urlRegex);
    if (!urls || urls.length === 0) return;

    const firstUrl = urls[0];
    const hasAlready = media.some(m => m.type === 'link' && m.url === firstUrl);
    if (hasAlready) return;

    const timer = setTimeout(async () => {
      await fetchLinkMetadata(firstUrl);
    }, 600);

    return () => clearTimeout(timer);
  }, [content, media, isOpen]);

  /* --- Reset --- */
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setCategory(post.category || boards[0]?.id || 'notice');
      
      // Parse legacy bgTheme or JSON format
      if (post.bgTheme) {
        try {
          const parsed = JSON.parse(post.bgTheme);
          const foundColor = COLOR_PALETTE.find(c => c.bg === parsed.bgColor);
          if (foundColor) setSelectedColor(foundColor);
          
          const impactIdx = IMPACT_SIZES.findIndex(s => s.cls === parsed.impactClass);
          if (impactIdx >= 0) setSelectedImpact(impactIdx);
          
          if (parsed.emphasisClasses && Array.isArray(parsed.emphasisClasses)) {
            const empIndices = parsed.emphasisClasses.map((cls: string) => EMPHASIS_OPTIONS.findIndex(e => e.cls === cls)).filter((i: number) => i >= 0);
            setSelectedEmphasis(empIndices);
          }
        } catch (e) {
          // If not JSON, try to find color directly
          const foundColor = COLOR_PALETTE.find(c => c.name === post.bgTheme || c.bg === post.bgTheme);
          if (foundColor) setSelectedColor(foundColor);
        }
      } else {
        setSelectedColor(null);
        setSelectedImpact(0);
        setSelectedEmphasis([]);
      }
      
      // Setup media (커버 이미지는 철저히 제외하고 본문 이미지/링크/비디오만 분리하여 격리 수용)
      const existingMedia: MediaItem[] = [];
      if (post.media && post.media.length > 0) {
        post.media.forEach((m: any, i) => {
          const isStr = typeof m === 'string';
          const url = isStr ? m : m.url;
          // 대표 커버와 주소가 일치하면 중복 처리를 차단하기 위해 스킵
          if (url === post.image) return;

          existingMedia.push({
            id: `e-${i}`,
            url,
            type: isStr ? (post.type === 'video' ? 'video' : 'image') : (m.type || 'image'),
            status: 'completed',
            progress: 100,
            linkMetadata: isStr ? undefined : m.linkMetadata
          });
        });
      }
      setMedia(existingMedia);
      
      // 대표 커버 이미지 전독 상태 직결 바인딩
      if (post.image) {
        setCoverImageUrl(post.image);
      } else {
        setCoverImageUrl(null);
      }

      setTags((post.postTags as TagItem[]) || []);
    } else {
      setTitle('');
      setContent('');
      setCategory(boards[0]?.id || 'notice');
      setMedia([]);
      setCoverImageUrl(null);
      setCoverImageId(null);
      setSelectedColor(null); 
      setSelectedImpact(0); 
      setSelectedEmphasis([]);
      setTags([]);
    }
    setTagKeyword('');
    setTagResults([]);
  }, [post, isOpen, boards]);

  /* --- Tag search --- */
  useEffect(() => {
    if (tagKeyword.trim().length < 2) { setTagResults([]); return; }
    const kw = tagKeyword.trim();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [users, events, socials, groupsList] = await Promise.allSettled([
          userService.searchUsers(kw, 5),
          eventService.searchEvents(kw),
          socialService.searchSocials(kw),
          groupService.getGroups(),
        ]);
        const results: TagItem[] = [];
        if (users.status === 'fulfilled') users.value.slice(0, 5).forEach(u => {
          const native = (u as any).nativeNickname || '';
          const label = native ? `${u.nickname || u.id} ${native}` : (u.nickname || u.id);
          results.push({ id: u.id, label, kind: 'people', photo: u.photoURL && u.photoURL !== 'https://lh3.googleusercontent.com/a/default-user' ? u.photoURL : undefined });
        });
        if (events.status === 'fulfilled') (events.value as any[]).slice(0, 3).forEach(e => results.push({ id: e.id, label: e.title || e.titleNative, kind: 'event' }));
        if (socials.status === 'fulfilled') (socials.value as any[]).slice(0, 3).forEach(s => results.push({ id: s.id, label: s.title, kind: 'social' }));
        if (groupsList.status === 'fulfilled') {
          (groupsList.value as any[]).filter(g => {
            const n = (g.name || '').toLowerCase();
            const nv = (g.nativeName || '').toLowerCase();
            return n.includes(kw.toLowerCase()) || nv.includes(kw.toLowerCase());
          }).slice(0, 3).forEach(g => {
            const native = g.nativeName || '';
            const label = native ? `${g.name} ${native}` : g.name;
            results.push({ id: g.id, label, kind: 'group' });
          });
        }
        setTagResults(results);
      } finally { setIsSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [tagKeyword]);

  /* --- Media --- */
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('feed.max_images', 'Images only'));
      return;
    }
    
    setIsUploadingCover(true);
    try {
      const path = `groups/${group.id}/posts/${user?.uid || 'anon'}/cover_${Date.now()}_${file.name}`;
      const url = await storageService.uploadFile(file, path);
      setCoverImageUrl(url);
      toast.success(t('blog.cover_updated', 'Cover image updated successfully'));
    } catch (err) {
      console.error('Cover upload failed:', err);
      toast.error(t('common.error', 'An error occurred'));
    } finally {
      setIsUploadingCover(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const curVideos = media.filter(m => m.type === 'video').length;
    files.forEach(file => {
      if (file.type.startsWith('video/') && curVideos >= 1) { 
        toast.error(t('feed.max_video', 'Maximum 1 video allowed')); 
        return; 
      }
      if (file.type.startsWith('video/')) handleUpload(file, 'video');
      else if (file.type.startsWith('image/')) handleUpload(file, 'image');
    });
    if (e.target) e.target.value = '';
  };

  const handleUpload = async (file: File, type: 'image' | 'video') => {
    const id = Math.random().toString(36).slice(7);
    setMedia(prev => [...prev, { id, url: URL.createObjectURL(file), type, progress: 0, status: 'uploading', file }]);
    try {
      const path = `groups/${group.id}/posts/${user?.uid || 'anon'}/${Date.now()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, p => setMedia(prev => prev.map(m => m.id === id ? { ...m, progress: Math.round(p) } : m)));
      
      if (type === 'image') {
        // 이미지를 media 배열에 completed 상태로 유지하여 갤러리 미리보기로 표시
        setMedia(prev => prev.map(m => m.id === id ? { ...m, url, status: 'completed', progress: 100 } : m));
        toast.success(t('blog.image_inserted', 'Image inserted into body'));
      } else {
        // 비디오 등 메타 미디어는 media 배열에 completed 상태로 온전히 유지
        setMedia(prev => prev.map(m => m.id === id ? { ...m, url, status: 'completed', progress: 100 } : m));
      }
    } catch {
      setMedia(prev => prev.map(m => m.id === id ? { ...m, status: 'error' } : m));
      toast.error(t('common.error', 'An error occurred'));
    }
  };

  const removeMedia = (id: string) => setMedia(prev => prev.filter(m => m.id !== id));

  /* --- Tags --- */
  const addTag = (item: TagItem) => {
    if (!tags.find(t => t.id === item.id)) setTags(prev => [...prev, item]);
    setTagKeyword(''); setTagResults([]);
  };
  const removeTag = (id: string) => setTags(prev => prev.filter(t => t.id !== id));

  /* --- Submit --- */
  const handleSubmit = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    
    if (isSubmitting) return;
    if (!content.trim() && !coverImageUrl && media.length === 0) return;
    if (media.some(m => m.status === 'uploading')) { 
      toast.error(t('feed.upload_in_progress', 'Please wait for upload to complete')); 
      return; 
    }
    
    setIsSubmitting(true);
    try {
      // 본문 첨부 마크다운에서 이미지 URL 정밀 추출
      const bodyImageUrls: string[] = [];
      const imgRegex = /!\[.*?\]\((.*?)\)/g;
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        bodyImageUrls.push(match[1]);
      }

      // 호환용 mediaData 구성 (본문 첨부 이미지 + 기타 미디어)
      const mediaData = [
        ...media.filter(m => m.status === 'completed').map(m => ({
          url: m.url,
          type: m.type,
          ...(m.type === 'link' ? { linkMetadata: m.linkMetadata } : {})
        })),
        ...bodyImageUrls.map(url => ({
          url,
          type: 'image' as const
        }))
      ];

      const isVideo = media.some(m => m.status === 'completed' && m.type === 'video');
      const hasImage = coverImageUrl || bodyImageUrls.length > 0 || media.some(m => m.status === 'completed' && m.type === 'image');
      const hasLink = media.some(m => m.status === 'completed' && m.type === 'link');
      
      const postType = isVideo ? 'video' : (hasImage ? 'image' : (hasLink ? 'link' : (showColorPreview ? 'text-card' : 'text')));

      const bgThemeJson = showColorPreview ? JSON.stringify({
        bgColor: selectedColor!.bg, 
        textColor: selectedColor!.text,
        impactClass: IMPACT_SIZES[selectedImpact].cls,
        emphasisClasses: selectedEmphasis.map(i => EMPHASIS_OPTIONS[i].cls),
      }) : undefined;

      const postData: any = {
        title,
        content,
        category,
        type: postType,
        bgTheme: bgThemeJson || null,
        media: mediaData,
        image: isVideo ? null : coverImageUrl,
        video: isVideo ? (media.find(m => m.type === 'video')?.url || null) : null,
        taggedUserIds: tags.filter(t => t.kind === 'people').map(t => t.id),
        postTags: tags.map(t => ({ id: t.id, label: t.label, kind: t.kind, photo: t.photo })),
        author: {
          id: user.uid,
          name: profile?.nickname || user.displayName || 'Anonymous',
          avatar: profile?.photoURL || user.photoURL || '',
          role: profile?.isInstructor ? 'Instructor' : 'Curator'
        }
      };

      if (post) {
        await groupService.updatePost(group.id, post.id, postData);
        toast.success(t('group.post_updated', 'Post updated successfully'));
      } else {
        await groupService.createPost(group.id, postData);
        toast.success(t('group.post_created', 'Post created successfully'));
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to save post:', error);
      toast.error(error.message || t('common.error', 'An error occurred'));
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[10000] bg-surface-bright text-on-surface font-body-md antialiased flex flex-col">

        {/* --- TopAppBar --- */}
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 h-20 transition-all duration-300 header-ui border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 rounded-full active:scale-95 duration-150 hover:bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">close</span>
            </button>
            <h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-on-surface text-xl sm:text-2xl">{group.name}</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-label-md text-label-md text-outline cursor-pointer hover:text-primary transition-colors hidden md:block">{t('blog.drafts', 'Drafts')}</span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && media.length === 0) || media.some(m => m.status === 'uploading')}
              className="bg-primary text-on-primary px-8 py-2.5 rounded-full font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40"
            >
              {isSubmitting ? (post ? t('common.updating') : t('common.posting')) : (post ? t('common.update') : t('common.post') || 'Publish')}
            </button>
          </div>
        </header>

        {/* --- Scrollable Canvas --- */}
        <main className="flex-1 overflow-y-auto pt-24 pb-32 px-6 max-w-4xl mx-auto w-full space-y-8 no-scrollbar">

          {/* Media Section: Cover Image Area */}
          <section className="relative mb-8 group">
            {coverImageUrl ? (
              <div className="relative w-full aspect-[21/9] bg-surface-container rounded-xl overflow-hidden shadow-sm border border-outline-variant/15 flex items-center justify-center">
                <img 
                  src={coverImageUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                     type="button"
                     onClick={() => coverImageInputRef.current?.click()}
                     className="px-4 py-2 bg-black/65 hover:bg-black/85 text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    {t('blog.change_cover', 'Change Cover')}
                  </button>
                  <button
                     type="button"
                     onClick={() => setCoverImageUrl(null)}
                     className="w-8 h-8 bg-error text-on-error rounded-full flex items-center justify-center hover:opacity-90 transition-all shadow-md active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => coverImageInputRef.current?.click()}
                className="relative w-full aspect-[21/9] bg-surface-container rounded-xl overflow-hidden flex flex-col items-center justify-center border border-dashed border-outline-variant/50 hover:border-primary/50 transition-colors cursor-pointer group-hover:bg-surface-container-high"
              >
                <div className="rhombus-mask w-16 h-16 bg-primary-container flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-500">
                  <span className="material-symbols-outlined text-on-primary-container text-2xl">add</span>
                </div>
                <p className="font-label-md text-label-md text-on-surface-variant tracking-wide">{t('blog.cover_prompt', 'Let your moments speak')}</p>
                <span className="absolute bottom-4 right-4 font-label-sm text-label-sm text-outline opacity-0 group-hover:opacity-100 transition-opacity">{t('blog.add_cover', 'Add Cover Image')}</span>
              </div>
            )}
            <input ref={coverImageInputRef} type="file" className="hidden" accept="image/*" onChange={handleCoverSelect} />
          </section>

          {/* Content Area */}
          <section className="space-y-6 distraction-free-focus">
            {/* Title Input */}
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-display-lg text-4xl sm:text-5xl font-black text-on-surface placeholder:text-outline-variant p-0 selection:bg-primary-fixed/30 tracking-tight leading-tight outline-none"
              placeholder={t('blog.title_placeholder_sample', 'A Night at Milonga Paraiso')}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            {/* Metadata / Category Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest mr-2">{t('blog.categories', 'Categories')}</span>
              {boards.map((board) => {
                const isSelected = category === board.id;
                return (
                  <button
                    key={board.id}
                    type="button"
                    onClick={() => setCategory(board.id)}
                    className={`px-5 py-1.5 rounded-full border font-label-md text-[13px] font-bold transition-all active:scale-95 duration-100 ${
                      isSelected 
                        ? 'bg-primary/10 text-primary border-primary' 
                        : 'border-outline-variant text-on-surface-variant hover:bg-primary/5 hover:border-primary/50'
                    }`}
                  >
                    {board.id === 'notice' ? (t('group.board.editor.notice_title') || board.title) : board.title}
                  </button>
                );
              })}
            </div>
            
            <hr className="border-outline-variant/20"/>

            {/* Manual Link Input Form */}
            {showLinkInput && (
              <div className="flex gap-2 p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm animate-in fade-in duration-200">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkInputVal}
                  onChange={e => setLinkInputVal(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm font-body-md text-on-surface placeholder:text-outline-variant/50 focus:ring-0 outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLinkSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleLinkSubmit}
                  className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 duration-100 transition-all shrink-0"
                >
                  {t('feed.add')}
                </button>
              </div>
            )}
            
            {/* Body Content */}
            <textarea
              ref={contentRef}
              className="w-full min-h-[400px] bg-transparent border-none focus:ring-0 font-body-lg text-lg text-on-surface-variant leading-relaxed p-0 outline-none selection:bg-primary-fixed/30 resize-none overflow-hidden placeholder:text-outline/50"
              placeholder={t('blog.content_placeholder', 'Write your story...')}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </section>

          {/* Additional Media List (for non-cover files like videos or sub-images) */}
          {media.filter(m => m.status === 'completed').length > 0 && (
            <section className="space-y-4 pt-4 border-t border-outline-variant/10">
              <h3 className="font-label-xs text-label-xs text-outline tracking-[0.1em] uppercase">{t('blog.gallery', 'Gallery')}</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
                {media.map(item => {
                  const isCover = coverImageId === item.id;
                  // Skip main cover image to avoid duplication
                  if (isCover) return null;
                  return (
                    <div key={item.id} className="relative flex-shrink-0 w-32 h-40 rounded-xl overflow-hidden snap-start group shadow border border-outline-variant/20">
                      {item.type === 'link' ? (
                        <div className="w-full h-full bg-surface-container flex flex-col justify-between p-3 relative select-none">
                          {item.linkMetadata?.image ? (
                            <img alt="" className="absolute inset-0 w-full h-full object-cover brightness-75" src={item.linkMetadata.image} />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-tertiary-container/20" />
                          )}
                          <div className="relative z-10 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded-full w-fit max-w-full">
                            <span className="text-[8px] text-white font-bold truncate">{item.linkMetadata?.domain || 'LINK'}</span>
                          </div>
                          <div className="relative z-10 bg-black/50 p-1.5 rounded text-left mt-auto">
                            <p className="text-white text-[9px] font-bold line-clamp-2">{item.linkMetadata?.title || item.url}</p>
                          </div>
                        </div>
                      ) : (
                        item.type === 'video'
                          ? <video className="w-full h-full object-cover" src={item.url} muted playsInline />
                          : <img alt="" className="w-full h-full object-cover" src={item.url} />
                      )}
                      {item.status === 'completed' && (
                        <button onClick={() => removeMedia(item.id)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </main>

        {/* Floating Formatting Bar (Brunch style) - 모바일 반응형 간격 슬림화 개정 */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] px-2 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-surface/90 backdrop-blur-xl shadow-2xl rounded-full px-4 md:px-6 py-3 md:py-3.5 flex items-center gap-3.5 md:gap-6 border border-outline-variant/15">
            <div className="flex items-center gap-3 md:gap-5 border-r border-outline-variant/30 pr-3.5 md:pr-5">
              <button 
                type="button"
                onClick={() => insertText('**', '**')}
                className="text-outline hover:text-primary transition-colors p-1 flex items-center justify-center active:scale-95 duration-100" 
                title="Bold"
              >
                <span className="material-symbols-outlined text-[20px]">format_bold</span>
              </button>
              <button 
                type="button"
                onClick={() => insertText('*', '*')}
                className="text-outline hover:text-primary transition-colors p-1 flex items-center justify-center active:scale-95 duration-100" 
                title="Italic"
              >
                <span className="material-symbols-outlined text-[20px]">format_italic</span>
              </button>
              <button 
                type="button"
                onClick={() => insertText('## ', '\n')}
                className="text-outline hover:text-primary transition-colors p-1 flex items-center justify-center active:scale-95 duration-100" 
                title="Heading"
              >
                <span className="material-symbols-outlined text-[20px]">format_size</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3 md:gap-5 border-r border-outline-variant/30 pr-3.5 md:pr-5">
              <button 
                type="button"
                onClick={() => insertText('> ', '\n')}
                className="text-outline hover:text-primary transition-colors p-1 flex items-center justify-center active:scale-95 duration-100" 
                title="Quote"
              >
                <span className="material-symbols-outlined text-[20px]">format_quote</span>
              </button>
              <button 
                type="button"
                onClick={() => insertText('- ', '\n')}
                className="text-outline hover:text-primary transition-colors p-1 flex items-center justify-center active:scale-95 duration-100" 
                title="List"
              >
                <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3 md:gap-5">
              <button 
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="text-outline hover:text-primary transition-colors p-1 flex items-center justify-center active:scale-95 duration-100" 
                title="Insert Image"
              >
                <span className="material-symbols-outlined text-[20px]">image</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowLinkInput(prev => !prev)}
                className={`text-outline hover:text-primary transition-colors p-1 flex items-center justify-center active:scale-95 duration-100 ${showLinkInput ? 'text-primary font-bold' : ''}`}
                title="Insert Link"
              >
                <span className="material-symbols-outlined text-[20px]">link</span>
              </button>
            </div>
          </div>
        </div>

      </div>
      <input ref={mediaInputRef} type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleMediaSelect} />
    </Portal>
  );
}

