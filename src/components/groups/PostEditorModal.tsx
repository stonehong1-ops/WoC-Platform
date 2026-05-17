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

/* --- Types --- */
interface MediaItem {
  id: string; url: string; type: 'image' | 'video';
  progress: number; status: 'uploading' | 'completed' | 'error'; file?: File;
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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<typeof COLOR_PALETTE[0] | null>(null);
  const [selectedImpact, setSelectedImpact] = useState(0);
  const [selectedEmphasis, setSelectedEmphasis] = useState<number[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagKeyword, setTagKeyword] = useState('');
  const [tagResults, setTagResults] = useState<TagItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const isShort = content.length <= 70 && content.length > 0;
  const colorActive = selectedColor && !selectedColor.isDefault;
  const showColorPreview = isShort && colorActive;
  const showMedia = !showColorPreview;

  const previewClass = [IMPACT_SIZES[selectedImpact].cls, ...selectedEmphasis.map(i => EMPHASIS_OPTIONS[i].cls)].join(' ');
  const imageCount = media.filter(m => m.type === 'image').length;
  const videoCount = media.filter(m => m.type === 'video').length;

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
      
      // Setup media
      const existingMedia: MediaItem[] = [];
      if (post.media && post.media.length > 0) {
        post.media.forEach((url, i) => {
          existingMedia.push({
            id: `e-${i}`, url, type: post.type === 'video' ? 'video' : 'image', status: 'completed', progress: 100
          });
        });
      } else if (post.image || post.video) {
        const url = post.image || post.video;
        if (url) {
          existingMedia.push({
            id: `e-0`, url, type: post.video ? 'video' : 'image', status: 'completed', progress: 100
          });
        }
      }
      setMedia(existingMedia);
      setTags((post.postTags as TagItem[]) || []);
    } else {
      setTitle('');
      setContent('');
      setCategory(boards[0]?.id || 'notice');
      setMedia([]);
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
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const curVideos = media.filter(m => m.type === 'video').length;
    const curImages = media.filter(m => m.type === 'image').length;
    files.forEach(file => {
      if (file.type.startsWith('video/') && curVideos >= 1) { toast.error(t('feed.max_video', 'Maximum 1 video allowed')); return; }
      if (file.type.startsWith('image/') && curImages >= 20) { toast.error(t('feed.max_images', 'Maximum 20 images allowed')); return; }
      if (file.type.startsWith('video/')) handleUpload(file, 'video');
      else if (file.type.startsWith('image/')) handleUpload(file, 'image');
    });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleUpload = async (file: File, type: 'image' | 'video') => {
    const id = Math.random().toString(36).slice(7);
    setMedia(prev => [...prev, { id, url: URL.createObjectURL(file), type, progress: 0, status: 'uploading', file }]);
    try {
      const path = `groups/${group.id}/posts/${user?.uid || 'anon'}/${Date.now()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, p => setMedia(prev => prev.map(m => m.id === id ? { ...m, progress: Math.round(p) } : m)));
      setMedia(prev => prev.map(m => m.id === id ? { ...m, url, status: 'completed', progress: 100 } : m));
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
    if (!content.trim() && media.length === 0) return;
    if (media.some(m => m.status === 'uploading')) { toast.error(t('feed.upload_in_progress', 'Please wait for upload to complete')); return; }
    
    setIsSubmitting(true);
    try {
      const mediaUrls = media.filter(m => m.status === 'completed').map(m => m.url);
      const isVideo = media.some(m => m.status === 'completed' && m.type === 'video');
      const hasImage = media.some(m => m.status === 'completed' && m.type === 'image');
      
      const postType = isVideo ? 'video' : (hasImage ? 'image' : (showColorPreview ? 'text-card' : 'text'));

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
        media: mediaUrls,
        image: isVideo ? null : (mediaUrls[0] || null),
        video: isVideo ? mediaUrls[0] : null,
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
        <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-white shadow-sm border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-full active:scale-95 duration-150 hover:bg-slate-50">
              <span className="material-symbols-outlined text-slate-500">close</span>
            </button>
            <h1 className="font-title-md text-title-md text-on-surface">{post ? t('group.edit_post', 'Edit Post') : t('group.create_post', 'Create Post')}</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && media.length === 0) || media.some(m => m.status === 'uploading')}
            className="px-5 py-2 rounded-xl bg-primary-container text-white font-title-md text-body-md hover:opacity-90 active:scale-95 duration-150 transition-all disabled:opacity-40"
          >
            {isSubmitting ? (post ? t('common.updating', 'Updating...') : t('common.posting', 'Posting...')) : (post ? t('common.update', 'Update') : t('common.post', 'Post'))}
          </button>
        </header>

        {/* --- Scrollable Canvas --- */}
        <main className="flex-1 overflow-y-auto pt-20 pb-32 px-[1.5rem] max-w-[56rem] mx-auto w-full space-y-4 no-scrollbar">

          {/* Profile & Board Section */}
          <section className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-12 h-12 rounded-full shadow-sm border-2 border-primary-container/20 flex-shrink-0 overflow-hidden bg-surface-container relative flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant absolute" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>person</span>
              {((profile?.photoURL && profile.photoURL !== 'https://lh3.googleusercontent.com/a/default-user') || (user?.photoURL && user.photoURL !== 'https://lh3.googleusercontent.com/a/default-user')) && (
                <img
                  alt={profile?.nickname || 'User'}
                  className="w-full h-full object-cover relative z-10"
                  src={(profile?.photoURL && profile.photoURL !== 'https://lh3.googleusercontent.com/a/default-user') ? profile.photoURL : user?.photoURL!}
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              )}
            </div>
            <div className="space-y-1 w-full max-w-[200px]">
              <div className="flex items-baseline gap-1">
                <h2 className="font-title-md text-title-sm">{profile?.nickname || user?.displayName || t('common.anonymous', 'Anonymous')}</h2>
                {profile?.nativeNickname && <span className="text-[11px] text-on-surface-variant font-medium">({profile.nativeNickname})</span>}
              </div>
              
              {/* Category Dropdown */}
              <div className="relative w-full">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/30 w-full font-label-sm text-[12px] text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.id === 'notice' ? (t('group.board.editor.notice_title') || board.title) : board.title}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[14px] text-outline absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
              </div>
            </div>
          </section>

          {/* Title Input */}
          <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('group.title_placeholder', 'Title (Optional)')}
              className="w-full bg-transparent border-none px-1 py-2 text-xl font-title-lg text-on-surface focus:ring-0 outline-none placeholder:text-outline-variant/70 border-b border-transparent focus:border-outline-variant/30 transition-colors"
            />
          </section>

          {/* Text Input / Color Preview */}
          <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {showColorPreview ? (
              <div
                className="rounded-2xl p-5 min-h-[120px] flex items-center justify-center transition-all cursor-pointer"
                style={{ background: selectedColor!.bg, color: selectedColor!.text }}
                onClick={() => setSelectedColor(null)}
                title={t('feed.click_to_edit', 'Click to edit text')}
              >
                <p className={`text-center break-words w-full ${previewClass}`} style={{ color: selectedColor!.text }}>{content}</p>
              </div>
            ) : (
              <textarea
                className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 text-lg font-body-md text-on-surface placeholder:text-outline/60 resize-none outline-none"
                placeholder={t('group.compose_prompt', 'What do you want to share with the group?')}
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            )}
            {content.length > 0 && (
              <p className={`text-[10px] mt-1 text-right font-bold tracking-wide ${content.length <= 70 ? 'text-primary' : 'text-outline'}`}>
                {content.length}/70 {content.length <= 70 ? t('feed.style_available', 'Style available') : ''}
              </p>
            )}
          </section>

          {/* Palette + Style Section */}
          <section className="flex flex-col gap-2 animate-in fade-in duration-700 delay-150">
            {/* Color Row */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-outline tracking-wider uppercase shrink-0 w-[42px]">{t('feed.palette', 'Palette')}</span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 no-scrollbar">
                {COLOR_PALETTE.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(selectedColor?.name === c.name ? null : c)}
                    title={c.name}
                    className={`rounded-full border-2 flex-shrink-0 transition-all hover:scale-110 active:scale-95 duration-150 ${
                      selectedColor?.name === c.name
                        ? 'ring-2 ring-primary ring-offset-1 border-primary scale-110'
                        : 'border-outline-variant/50'
                    } ${i === 0 ? 'w-6 h-6' : 'w-[20px] h-[20px]'}`}
                    style={c.isDefault ? {} : { backgroundColor: c.bg }}
                  />
                ))}
              </div>
            </div>

            {/* Style Row */}
            {isShort && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-outline tracking-wider uppercase shrink-0 w-[42px]">{t('feed.style', 'Style')}</span>
                <div className="flex items-center gap-1">
                  {IMPACT_SIZES.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImpact(i)}
                      title={[t('feed.style_normal', 'Normal'), t('feed.style_bold', 'Bold'), t('feed.style_impact', 'Impact')][i]}
                      style={{ fontWeight: s.weight, fontSize: s.size }}
                      className={`w-8 h-7 rounded-md border transition-all active:scale-95 flex items-center justify-center leading-none ${
                        selectedImpact === i
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'border-outline-variant/40 text-outline hover:bg-surface-container'
                      }`}
                    >
                      A
                    </button>
                  ))}
                </div>
                <div className="w-px h-4 bg-outline-variant/30 mx-1" />
                <div className="flex items-center gap-1">
                  {EMPHASIS_OPTIONS.map((o, i) => (
                    <button
                      key={i}
                      title={[t('feed.style_bold', 'Bold'), t('feed.style_italic', 'Italic'), t('feed.style_uppercase', 'Uppercase')][i]}
                      onClick={() => setSelectedEmphasis(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                      className={`w-7 h-7 rounded-md text-[11px] border transition-all active:scale-95 flex items-center justify-center ${
                        selectedEmphasis.includes(i)
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'border-outline-variant/40 text-outline hover:bg-surface-container'
                      } ${o.cls}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Media Section */}
          {showMedia && (
            <section className="space-y-4 pt-2 animate-in fade-in duration-700 delay-200">
              <div className="flex items-center justify-between">
                <h3 className="font-label-xs text-label-xs text-outline tracking-[0.1em] uppercase">{t('feed.media', 'Media')}</h3>
                {media.length > 0 && (
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add_photo_alternate</span> {t('feed.add', 'Add')}
                  </button>
                )}
              </div>
              {media.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
                  {media.map(item => (
                    <div key={item.id} className="relative flex-shrink-0 w-40 h-52 rounded-xl overflow-hidden snap-start group shadow border border-outline-variant/20">
                      {item.type === 'video'
                        ? <video className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`} src={item.url} muted playsInline />
                        : <img alt="" className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`} src={item.url} />}
                      {item.status === 'uploading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <p className="text-white font-bold text-xs mb-2">{item.progress}%</p>
                          <div className="w-full bg-white/30 h-1 rounded-full">
                            <div className="bg-white h-full rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <button onClick={() => removeMedia(item.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                      {item.type === 'video' && item.status === 'completed' && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{t('feed.video_badge', 'VIDEO')}</div>
                      )}
                      {item.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                          <span className="material-symbols-outlined text-red-500">error</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => mediaInputRef.current?.click()}
                  className="relative group h-48 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary-container hover:bg-primary-container/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden shadow-sm active:scale-[0.98] duration-150"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary-container text-[28px]">add_photo_alternate</span>
                  </div>
                  <p className="font-title-md text-body-md text-on-surface-variant">{t('feed.add_photos_video', 'Add photos or video')}</p>
                  <span className="text-[10px] text-on-surface-variant/60 font-medium">{imageCount}/20 {t('feed.photo_count', 'Photos')} · {videoCount}/1 {t('feed.video_count', 'Video')}</span>
                  <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[120px] text-primary-container/5 pointer-events-none select-none">cloud_upload</span>
                </div>
              )}
              <input ref={mediaInputRef} type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleMediaSelect} />
            </section>
          )}

          {/* Tagging Section */}
          <section className="space-y-4 pt-2 pb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[20px]">sell</span>
              <h3 className="font-label-xs text-label-xs text-outline tracking-[0.1em] uppercase">{t('feed.tags', 'Tags')}</h3>
            </div>

            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <div key={t.id} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
                    <span className={`material-symbols-outlined text-[13px] ${KIND_COLOR[t.kind]}`}>{KIND_ICON[t.kind]}</span>
                    <span>{t.label}</span>
                    <button onClick={() => removeTag(t.id)} className="ml-0.5 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none h-14">
                <span className={`material-symbols-outlined text-outline group-focus-within:text-primary-container transition-colors ${isSearching ? 'animate-spin' : ''}`}>
                  {isSearching ? 'progress_activity' : 'search'}
                </span>
              </div>
              <input
                type="text"
                value={tagKeyword}
                onChange={e => setTagKeyword(e.target.value)}
                placeholder={t('feed.tag_placeholder', 'Search people, places, events, or groups to tag')}
                className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all outline-none font-body-md"
              />

              {/* Search Results Dropdown */}
              {tagResults.length > 0 && (
                <div className="absolute top-16 left-0 right-0 z-10 bg-white rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden max-h-64 overflow-y-auto">
                  {tagResults.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addTag(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left"
                    >
                      {item.photo
                        ? <img src={item.photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-surface-container flex-shrink-0 ${KIND_COLOR[item.kind]}`}>
                            <span className="material-symbols-outlined text-base">{KIND_ICON[item.kind]}</span>
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{item.label}</p>
                        <p className={`text-xs capitalize ${KIND_COLOR[item.kind]}`}>{item.kind}</p>
                      </div>
                      {tags.find(t => t.id === item.id) && (
                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {tagKeyword.length >= 2 && !isSearching && tagResults.length === 0 && (
                <div className="absolute top-16 left-0 right-0 z-10 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-4">
                  <p className="text-center text-xs text-outline">{t('search.no_results', 'No results found')}</p>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>
    </Portal>
  );
}

