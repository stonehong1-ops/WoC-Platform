'use client';
import { useLanguage } from '@/contexts/LanguageContext';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Portal from '@/components/common/Portal';
import { useAuth } from '@/components/providers/AuthProvider';
import { storageService } from '@/lib/firebase/storageService';
import { userService } from '@/lib/firebase/userService';
import { feedService } from '@/lib/firebase/feedService';
import { venueService } from '@/lib/firebase/venueService';
import { eventService } from '@/lib/firebase/eventService';
import { socialService } from '@/lib/firebase/socialService';
import { groupService } from '@/lib/firebase/groupService';
import { FeedContext, Post } from '@/types/feed';
import { useLocation } from '@/components/providers/LocationProvider';
import { helpDeskAIService } from '@/lib/ai/helpDeskAI';
import { KIND_ICON, KIND_COLOR } from '@/constants/tags';
import UserBadge from '@/components/common/UserBadge';

/* ?€?€?€ Types ?€?€?€ */
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
interface TagItem { id: string; label: string; kind: 'people' | 'venue' | 'event' | 'social' | 'group'; photo?: string; }
interface Props { isOpen: boolean; onClose: () => void; context?: FeedContext; editingPost?: Post | null; }

const T_COLOR: Record<string, string> = {
  group: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  social: 'bg-purple-50 text-purple-700 border-purple-200',
  event: 'bg-amber-50 text-amber-700 border-amber-200',
  venue: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  people: 'bg-pink-50 text-pink-700 border-pink-200',
};
const T_ICON: Record<string, string> = {
  group: 'corporate_fare',
  social: 'music_note',
  event: 'calendar_today',
  venue: 'location_on',
  people: 'person',
};

/* ?€?€?€ Style config ?€?€?€ */
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

export default function CreateFeedPopup({ isOpen, onClose, context, editingPost }: Props) {
  const { t } = useLanguage();

  const { user, profile } = useAuth();
  const { location } = useLocation();
  const isHelpDesk = context?.scope === 'helpdesk';
  const handleClose = onClose;

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<typeof COLOR_PALETTE[0] | null>(null);
  const [selectedImpact, setSelectedImpact] = useState(0);
  const [selectedEmphasis, setSelectedEmphasis] = useState<number[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagKeyword, setTagKeyword] = useState('');
  const [tagResults, setTagResults] = useState<TagItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const tagCacheRef = useRef<{
    people: { id: string; nickname: string; nativeNickname?: string; photoURL?: string }[];
    venues: { id: string; name: string }[];
    socials: { id: string; title: string; organizerName?: string }[];
    groups: { id: string; name: string }[];
  }>({ people: [], venues: [], socials: [], groups: [] });
  const tagCacheLoaded = useRef(false);

  const isShort = content.length <= 150 && content.length > 0;
  const colorActive = selectedColor && !selectedColor.isDefault;
  const showColorPreview = isShort && colorActive;
  const showMedia = !showColorPreview;

  const previewClass = [IMPACT_SIZES[selectedImpact].cls, ...selectedEmphasis.map(i => EMPHASIS_OPTIONS[i].cls)].join(' ');
  const imageCount = media.filter(m => m.type === 'image').length;
  const videoCount = media.filter(m => m.type === 'video').length;

  /* ⚙ Reset ⚙ */
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content || '');
      setMedia((editingPost.media || []).map((m: any, i: number) => ({
        id: `e-${i}`, url: typeof m === 'string' ? m : m.url,
        type: typeof m === 'string' ? 'image' : (m.type || 'image'),
        status: 'completed', progress: 100,
      })));
    } else {
      setContent(''); setMedia([]); setTags([]);
      setSelectedColor(null); setSelectedImpact(0); setSelectedEmphasis([]);
    }
    setTagKeyword(''); setTagResults([]);
  }, [editingPost, isOpen]);

  // Manage history stack for Android/Device back button in CreateFeedPopup
  useEffect(() => {
    if (!isOpen) return;

    const stateKey = `create_feed_${Date.now()}`;
    window.history.pushState({ stateKey }, '');

    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.stateKey === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

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
    // 이미 존재하는 링크가 있으면 스킵
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

  /* ⚙ Tag Cache (load all once on open) ⚙ */
  useEffect(() => {
    if (!isOpen || tagCacheLoaded.current) return;
    Promise.allSettled([
      userService.getAllUsers(),
      venueService.getVenues(),
      socialService.searchSocials(''),
      groupService.getGroups(),
    ]).then(([usersRes, venuesRes, socialsRes, groupsRes]) => {
      if (usersRes.status === 'fulfilled') {
        tagCacheRef.current.people = usersRes.value.map((u: any) => ({
          id: u.id, nickname: u.nickname || '', nativeNickname: u.nativeNickname || '',
          photoURL: u.photoURL && u.photoURL !== 'https://lh3.googleusercontent.com/a/default-user' ? u.photoURL : undefined,
        }));
      }
      if (venuesRes.status === 'fulfilled') {
        tagCacheRef.current.venues = (venuesRes.value as any[]).map(v => ({ id: v.id, name: v.name || '' }));
      }
      if (socialsRes.status === 'fulfilled') {
        tagCacheRef.current.socials = (socialsRes.value as any[]).map(s => ({ id: s.id, title: s.title || '', organizerName: s.organizerName || '' }));
      }
      if (groupsRes.status === 'fulfilled') {
        tagCacheRef.current.groups = (groupsRes.value as any[]).map(g => ({ id: g.id, name: g.name || '' }));
      }
      tagCacheLoaded.current = true;
    });
  }, [isOpen]);

  /* ⚙ Tag search (cached, case-insensitive, Korean-aware) ⚙ */
  useEffect(() => {
    if (tagKeyword.trim().length < 2) { setTagResults([]); return; }
    const kw = tagKeyword.trim().toLowerCase();
    const timer = setTimeout(() => {
      setIsSearching(true);
      try {
        const results: TagItem[] = [];
        // People: match nickname (EN) or nativeNickname (KR), case-insensitive
        tagCacheRef.current.people
          .filter(u => u.nickname?.toLowerCase().includes(kw) || u.nativeNickname?.toLowerCase().includes(kw))
          .slice(0, 5)
          .forEach(u => results.push({ id: u.id, label: u.nickname || u.id, kind: 'people', photo: u.photoURL }));
        // Venues: match name, case-insensitive
        tagCacheRef.current.venues
          .filter(v => v.name?.toLowerCase().includes(kw))
          .slice(0, 3)
          .forEach(v => results.push({ id: v.id, label: v.name, kind: 'venue' }));
        // Socials: match title or organizerName, case-insensitive
        tagCacheRef.current.socials
          .filter(s => s.title?.toLowerCase().includes(kw) || s.organizerName?.toLowerCase().includes(kw))
          .slice(0, 3)
          .forEach(s => results.push({ id: s.id, label: s.title, kind: 'social' }));
        // Groups: match name, case-insensitive
        tagCacheRef.current.groups
          .filter(g => g.name?.toLowerCase().includes(kw))
          .slice(0, 3)
          .forEach(g => results.push({ id: g.id, label: g.name, kind: 'group' }));
        setTagResults(results);
      } finally { setIsSearching(false); }
    }, 150);
    return () => clearTimeout(timer);
  }, [tagKeyword]);

  /* ?€ Media ?€ */
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const curVideos = media.filter(m => m.type === 'video').length;
    const curImages = media.filter(m => m.type === 'image').length;
    files.forEach(file => {
      if (file.type.startsWith('video/') && curVideos >= 1) { alert(t('feed.max_video')); return; }
      if (file.type.startsWith('image/') && curImages >= 20) { alert(t('feed.max_images')); return; }
      if (file.type.startsWith('video/')) handleUpload(file, 'video');
      else if (file.type.startsWith('image/')) handleUpload(file, 'image');
    });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };
  // Canvas API를 활용한 초경량 클라이언트 사이드 이미지 압축
  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleUpload = async (file: File, type: 'image' | 'video') => {
    const id = Math.random().toString(36).slice(7);
    setMedia(prev => [...prev, { id, url: URL.createObjectURL(file), type, progress: 0, status: 'uploading', file }]);
    try {
      let fileToUpload = file;
      if (type === 'image') {
        fileToUpload = await compressImage(file);
      }
      const path = `feeds/${user?.uid || 'anon'}/${Date.now()}_${fileToUpload.name}`;
      const url = await storageService.uploadFile(fileToUpload, path, p => setMedia(prev => prev.map(m => m.id === id ? { ...m, progress: Math.round(p) } : m)));
      setMedia(prev => prev.map(m => m.id === id ? { ...m, url, status: 'completed', progress: 100 } : m));
    } catch {
      setMedia(prev => prev.map(m => m.id === id ? { ...m, status: 'error' } : m));
    }
  };
  const removeMedia = (id: string) => setMedia(prev => prev.filter(m => m.id !== id));

  /* ?€ Tags ?€ */
  const addTag = (item: TagItem) => {
    if (!tags.find(t => t.id === item.id)) setTags(prev => [...prev, item]);
    setTagKeyword(''); setTagResults([]);
  };
  const removeTag = (id: string) => setTags(prev => prev.filter(t => t.id !== id));

  /* ?€ Submit ?€ */
  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    if (!content.trim() && media.length === 0) return;
    if (media.some(m => m.status === 'uploading')) { alert(t('feed.upload_in_progress')); return; }
    setIsSubmitting(true);
    try {
      const finalTargets = context?.scope === 'plaza' ? ['plaza', context.scopeId] : [context?.scopeId || 'freestyle-tango'];
      const mediaData = media.filter(m => m.status === 'completed').map(m => ({
        url: m.url,
        type: m.type,
        ...(m.type === 'link' ? { linkMetadata: m.linkMetadata } : {})
      }));
      const styleData = showColorPreview ? {
        shortTextStyle: {
          bgColor: selectedColor!.bg, textColor: selectedColor!.text,
          impactClass: IMPACT_SIZES[selectedImpact].cls,
          emphasisClasses: selectedEmphasis.map(i => EMPHASIS_OPTIONS[i].cls),
        }
      } : {};
      const tagData = { taggedIds: tags.map(t => t.id), tags: tags.map(t => ({ id: t.id, label: t.label, kind: t.kind })) };
      
      if (editingPost) {
        await feedService.updatePost(editingPost.id, { content, media: mediaData, ...tagData, ...styleData });
      } else {
        const postId = await feedService.createPost({
          userId: user.uid, 
          userName: isHelpDesk ? t('help_desk.anonymous', 'Anonymous') : (profile?.nickname || user.displayName || 'Anonymous'),
          userPhoto: isHelpDesk ? '' : (profile?.photoURL || user.photoURL || ''),
          content, media: mediaData, taggedUserIds: tags.filter(t => t.kind === 'people').map(t => t.id),
          targets: finalTargets, category: context?.scopeId?.toUpperCase() || 'SOCIAL',
          location: { country: location.country, city: location.city },
          ...tagData, ...styleData,
        });

        // Trigger AI Response for Help Desk
        if (isHelpDesk) {
          helpDeskAIService.processNewPost(postId, content);
        }
      }
      onClose();
    } catch (e: any) {
      alert(`Error: ${e?.message || e}`);
    } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
        <div className="w-full max-w-md h-[100dvh] bg-white flex flex-col overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
            <button 
              type="button" 
              onClick={handleClose} 
              className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700 hover:bg-slate-50 rounded-full"
            >
              <span className="material-symbols-rounded text-2xl">close</span>
            </button>
            <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
              {editingPost ? t('feed.edit_post') : t('feed.create_post')}
            </h1>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && media.length === 0) || media.some(m => m.status === 'uploading')}
              className="text-[14px] font-bold text-primary active:scale-95 disabled:opacity-40"
            >
              {isSubmitting ? (editingPost ? t('feed.updating') : t('feed.posting')) : (editingPost ? t('feed.update') : t('feed.post'))}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 text-left no-scrollbar">
            
            {/* Profile Section */}
            <section className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full shadow-sm border border-slate-100 flex-shrink-0 overflow-hidden bg-slate-50 relative flex items-center justify-center">
                <span className="material-symbols-rounded text-slate-400 absolute" style={{ fontSize: '24px' }}>person</span>
                {!isHelpDesk && ((profile?.photoURL && profile.photoURL !== 'https://lh3.googleusercontent.com/a/default-user') || (user?.photoURL && user.photoURL !== 'https://lh3.googleusercontent.com/a/default-user')) && (
                  <img
                    alt={profile?.nickname || 'User'}
                    className="w-full h-full object-cover relative z-10"
                    src={(profile?.photoURL && profile.photoURL !== 'https://lh3.googleusercontent.com/a/default-user') ? profile.photoURL : user?.photoURL!}
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1">
                  <h2 className="text-sm font-bold text-slate-800">{isHelpDesk ? t('help_desk.anonymous', 'Anonymous') : (profile?.nickname || user?.displayName || 'Anonymous')}</h2>
                  {!isHelpDesk && profile?.nativeNickname && <span className="text-[10px] text-slate-400 font-medium">({profile.nativeNickname})</span>}
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100 w-fit cursor-default">
                  <span className="material-symbols-rounded text-[14px] text-primary">groups</span>
                  <span className="text-[10px] font-bold text-slate-500">{context?.scopeId || 'Freestyle Tango'}</span>
                </div>
              </div>
            </section>

            {/* Text Area */}
            <section className="w-full">
              {showColorPreview ? (
                <div
                  className="rounded-2xl p-5 min-h-[120px] flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-100"
                  style={{ background: selectedColor!.bg, color: selectedColor!.text }}
                  onClick={() => setSelectedColor(null)}
                  title={t('feed.click_to_edit')}
                >
                  <p className={`text-center break-words w-full ${previewClass}`} style={{ color: selectedColor!.text }}>{content}</p>
                </div>
              ) : (
                <textarea
                  className="w-full min-h-[100px] bg-transparent border-none focus:ring-0 text-base font-normal text-slate-800 placeholder:text-slate-400 resize-none outline-none"
                  placeholder={t('plaza.compose_prompt')}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              )}
              {content.length > 0 && (
                <p className={`text-[10px] mt-1 text-right font-bold tracking-wide ${content.length <= 150 ? 'text-primary' : 'text-slate-400'}`}>
                  {content.length}/150 {content.length <= 150 ? t('feed.style_available') : ''}
                </p>
              )}
            </section>

            {/* Palette + Style Section */}
            <section className="flex flex-col gap-3 py-2 border-t border-b border-slate-50">
              {/* Color Row */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase shrink-0 w-[42px]">{t('feed.palette')}</span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {COLOR_PALETTE.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedColor(selectedColor?.name === c.name ? null : c)}
                      title={c.name}
                      className={`rounded-full border flex-shrink-0 transition-all hover:scale-110 active:scale-95 duration-150 ${
                        selectedColor?.name === c.name
                          ? 'ring-2 ring-primary ring-offset-1 border-primary scale-110'
                          : 'border-slate-200'
                      } ${i === 0 ? 'w-5 h-5 bg-transparent relative flex items-center justify-center before:w-3 before:h-px before:bg-slate-300 before:rotate-45 after:w-3 after:h-px after:bg-slate-300 after:-rotate-45' : 'w-[18px] h-[18px]'}`}
                      style={c.isDefault ? {} : { backgroundColor: c.bg }}
                    />
                  ))}
                </div>
              </div>

              {/* Style Row */}
              {isShort && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase shrink-0 w-[42px]">{t('feed.style')}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {IMPACT_SIZES.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImpact(i)}
                        title={[t('feed.style_normal'), t('feed.style_bold'), t('feed.style_impact')][i]}
                        style={{ fontWeight: s.weight, fontSize: s.size }}
                        className={`w-7 h-7 rounded-lg border transition-all active:scale-95 flex items-center justify-center leading-none ${
                          selectedImpact === i
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        A
                      </button>
                    ))}
                  </div>
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  <div className="flex items-center gap-1 shrink-0">
                    {EMPHASIS_OPTIONS.map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        title={[t('feed.style_bold'), t('feed.style_italic'), t('feed.style_uppercase')][i]}
                        onClick={() => setSelectedEmphasis(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                        className={`w-7 h-7 rounded-lg text-[10px] border transition-all active:scale-95 flex items-center justify-center ${
                          selectedEmphasis.includes(i)
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
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
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t('feed.media')} ({media.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold hover:bg-slate-100 transition-colors active:scale-95 duration-100 shrink-0"
                  >
                    <span className="material-symbols-rounded text-[14px]">link</span> {t('feed.add_link', 'Link')}
                  </button>
                </div>

                {/* Manual Link Input Form */}
                {showLinkInput && (
                  <div className="flex gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm animate-in fade-in duration-200">
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={linkInputVal}
                      onChange={e => setLinkInputVal(e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLinkSubmit();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleLinkSubmit}
                      className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:opacity-90 active:scale-95 duration-100 transition-all shrink-0"
                    >
                      {t('common.add', 'Add')}
                    </button>
                  </div>
                )}

                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {/* Plus Add Button */}
                  <button 
                    type="button" 
                    onClick={() => mediaInputRef.current?.click()}
                    className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-[#acb3b4] rounded-xl text-[#596061] bg-[#f8f9fa] active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-rounded text-2xl mb-1">add_a_photo</span>
                  </button>
                  <input ref={mediaInputRef} type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleMediaSelect} />

                  {/* Loaded Media Items */}
                  {media.map(item => (
                    <div key={item.id} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-50">
                      {item.type === 'link' ? (
                        <div className="w-full h-full relative select-none bg-slate-100 flex items-center justify-center">
                          {item.linkMetadata?.image ? (
                            <img alt="" className="w-full h-full object-cover brightness-95" src={item.linkMetadata.image} />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                              <span className="material-symbols-rounded text-slate-400 text-lg">link</span>
                            </div>
                          )}
                          {/* YouTube Video Play Icon */}
                          {item.linkMetadata?.domain?.includes('youtube') && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                                <span className="material-symbols-rounded text-white text-xs leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                          )}
                          {/* Tiny Link Domain Overlay */}
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-center">
                            <p className="text-[7px] text-white font-bold tracking-wide uppercase truncate">{item.linkMetadata?.domain || 'LINK'}</p>
                          </div>
                        </div>
                      ) : item.type === 'video' ? (
                        <div className="w-full h-full relative">
                          <video className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`} src={item.url} muted playsInline />
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[7px] px-1 py-0.5 rounded font-bold">VIDEO</div>
                        </div>
                      ) : (
                        <img alt="" className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`} src={item.url} />
                      )}

                      {/* Uploading Progress */}
                      {item.status === 'uploading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                          <p className="text-white font-bold text-[9px] mb-1">{item.progress}%</p>
                          <div className="w-12 bg-white/30 h-[3px] rounded-full overflow-hidden">
                            <div className="bg-white h-full transition-all" style={{ width: `${item.progress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Error Badge */}
                      {item.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                          <span className="material-symbols-rounded text-red-500 text-lg">error</span>
                        </div>
                      )}

                      {/* Remove Button */}
                      {item.status === 'completed' && (
                        <button 
                          type="button"
                          onClick={() => removeMedia(item.id)} 
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-white active:scale-90 transition-transform z-20"
                        >
                          <span className="material-symbols-rounded text-[12px] leading-none">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tagging Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-slate-400 text-lg">sell</span>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('feed.tags')}</h3>
              </div>

              {/* Selected Tags as Premium Pastel Chips */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <div key={t.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${T_COLOR[t.kind] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                      {t.kind === 'people' ? (
                        <UserBadge
                          uid={t.id}
                          nickname={t.label}
                          avatarSize="w-5 h-5"
                          nameClassName="font-bold text-[10px] text-slate-600 truncate max-w-[60px]"
                          nativeClassName="text-[8px] font-semibold text-slate-400 ml-1 truncate max-w-[40px]"
                        />
                      ) : (
                        <>
                          <span className="material-symbols-rounded text-[13px]">{T_ICON[t.kind] || 'sell'}</span>
                          <span>{t.label}</span>
                        </>
                      )}
                      <button type="button" onClick={() => removeTag(t.id)} className="ml-0.5 opacity-55 hover:opacity-100 transition-opacity active:scale-90">
                        <span className="material-symbols-rounded text-[12px] leading-none">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Trigger Bar */}
              <div className="pt-1">
                <div 
                  className="relative cursor-pointer"
                  onClick={() => setSearchMode(true)}
                >
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-400 text-left shadow-sm flex items-center gap-2 active:scale-[0.99] transition-transform">
                    <span className="material-symbols-rounded text-slate-400 text-base">search</span>
                    <span>{t('feed.tag_placeholder', 'Search group, social, event, people...')}</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Search Bottom Sheet */}
      <AnimatePresence>
        {searchMode && (
          <div className="fixed inset-0 z-[20000] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => { setSearchMode(false); setTagKeyword(''); setTagResults([]); }} 
            />
            {/* Sheet Body */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-[80vh] bg-white rounded-t-[2rem] flex flex-col overflow-hidden shadow-2xl z-10"
            >
              {/* Handle bar */}
              <div className="w-full flex justify-center pt-3 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>
              
              {/* Header */}
              <div className="px-6 pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">{t('gallery.search_add', 'Search & add')}</h2>
                <button 
                  type="button"
                  onClick={() => { setSearchMode(false); setTagKeyword(''); setTagResults([]); }} 
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 active:scale-95"
                >
                  <span className="material-symbols-rounded text-xl leading-none">close</span>
                </button>
              </div>
              
              {/* Search Input Bar */}
              <div className="p-4 bg-slate-50 shrink-0">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-rounded text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-xs focus:outline-none focus:border-primary shadow-sm outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder={t('feed.tag_placeholder', 'Search group, social, event, people...')}
                    value={tagKeyword}
                    onChange={e => setTagKeyword(e.target.value)}
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                </div>
              </div>
              
              {/* Results List */}
              <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar">
                {tagResults.length > 0 ? (
                  <div className="space-y-1">
                    {tagResults.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addTag(item)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.kind === 'people' ? (
                            <UserBadge
                              uid={item.id}
                              nickname={item.label}
                              photoURL={item.photo}
                              avatarSize="w-8 h-8"
                              nameClassName="font-bold text-sm text-slate-800 truncate"
                              nativeClassName="text-[11px] font-semibold text-slate-400 ml-1.5 truncate"
                            />
                          ) : (
                            <>
                              {item.photo ? (
                                <img src={item.photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${T_COLOR[item.kind] || 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                  <span className="material-symbols-rounded text-sm">{T_ICON[item.kind]}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{item.label}</p>
                                <p className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${T_COLOR[item.kind] ? T_COLOR[item.kind].split(' ')[1] : 'text-slate-400'}`}>
                                  {item.kind}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        {tags.find(t => t.id === item.id) && (
                          <span className="material-symbols-rounded text-primary text-lg shrink-0">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <span className="material-symbols-rounded text-4xl mb-3 opacity-20">search</span>
                    <p className="text-xs font-bold">{t('gallery.find_tag_resources', 'Find and tag resources')}</p>
                    <p className="text-[11px] opacity-70 mt-1">{t('gallery.type_to_start', 'Type to start searching')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
