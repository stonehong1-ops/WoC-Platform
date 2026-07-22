'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  /* ⚙ Step State ⚙ */
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 2;

  const handleHeaderBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      const isDirty = content || media.length > 0;
      if (isDirty) {
        if (confirm(t('common.confirm_discard') || "작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
          handleClose();
        }
      } else {
        handleClose();
      }
    }
  };

  const stepTitles: Record<number, string> = {
    1: t('feed.step1_title', '본문 & 미디어'),
    2: t('feed.step2_title', '태그 & 연관 설정'),
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] bg-black/60 flex justify-center items-center backdrop-blur-sm p-0 md:p-4">
        <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />
        
        <div className="w-full max-w-lg h-[100dvh] md:h-[90vh] md:max-h-[760px] bg-white md:rounded-3xl flex flex-col overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          
          <header 
            className="flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-50 sticky top-0"
            style={{
              height: Capacitor.isNativePlatform() ? 'calc(56px + env(safe-area-inset-top))' : '56px',
              paddingTop: Capacitor.isNativePlatform() ? 'env(safe-area-inset-top)' : '0px'
            }}
          >
            <button 
              type="button" 
              onClick={handleHeaderBack} 
              className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700 hover:bg-slate-50 rounded-full"
            >
              <span className="material-symbols-rounded text-2xl">arrow_back</span>
            </button>
            <h1 className="text-[16px] font-bold text-slate-800">
              {editingPost ? (t('feed.edit_post') || '게시글 수정') : (t('feed.create_post') || '새 광장 글 작성')}
            </h1>
            <div className="w-10" />
          </header>

          <div className="w-full px-4 mt-3 shrink-0">
            <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-700">
                  {step} / {TOTAL_STEPS} 단계
                </span>
                <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                  {stepTitles[step]}
                </span>
              </div>
              <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007AFF] transition-all duration-300"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 카드 1: 본문 작성 */}
                <div className="border border-[#e0e4e5] rounded-2xl bg-white">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-primary">edit_note</span>
                      <p className="text-[14px] font-bold text-primary">{t('feed.content_title') || '본문 작성'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white text-slate-700 border border-[#e0e4e5] rounded-full text-xs font-bold hover:bg-[#f8f9fa] transition-colors active:scale-95 shrink-0"
                    >
                      <span className="material-symbols-rounded text-sm text-primary">add_a_photo</span> 사진/동영상
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder={t('feed.placeholder_write') || '이야기하고 싶은 소식이나 정보를 자유롭게 공유해보세요...'}
                      rows={5}
                      className="w-full text-[14px] leading-relaxed border-none focus:ring-0 resize-none text-slate-900 placeholder:text-slate-400 p-0 outline-none"
                    />
                  </div>
                </div>

                {/* 카드 2: 미디어 및 링크 첨부 */}
                {showMedia && (
                  <div className="border border-[#e0e4e5] rounded-2xl bg-white">
                    <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-sm text-primary">add_a_photo</span>
                        <p className="text-[14px] font-bold text-primary">미디어 첨부 ({media.length})</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white text-slate-700 border border-[#e0e4e5] rounded-full text-xs font-bold hover:bg-[#f8f9fa] transition-colors active:scale-95 shrink-0"
                      >
                        <span className="material-symbols-rounded text-sm text-primary">link</span> 링크 추가
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      {showLinkInput && (
                        <div className="flex gap-2 p-2.5 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl shadow-sm animate-in fade-in duration-200">
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
                            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shrink-0"
                          >
                            추가
                          </button>
                        </div>
                      )}

                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        <button 
                          type="button" 
                          onClick={() => mediaInputRef.current?.click()}
                          className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-[#acb3b4] rounded-xl text-[#596061] bg-[#f8f9fa] active:scale-95 transition-transform"
                        >
                          <span className="material-symbols-rounded text-2xl mb-1">add_a_photo</span>
                        </button>
                        <input ref={mediaInputRef} type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleMediaSelect} />

                        {media.map(item => (
                          <div key={item.id} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-50">
                            {item.type === 'link' ? (
                              <div className="w-full h-full relative select-none bg-slate-100 flex items-center justify-center">
                                {item.linkMetadata?.image ? (
                                  <img alt="" className="w-full h-full object-cover brightness-95" src={item.linkMetadata.image} />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-slate-400 text-lg">link</span>
                                  </div>
                                )}
                              </div>
                            ) : item.type === 'video' ? (
                              <div className="w-full h-full relative">
                                <video className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`} src={item.url} muted playsInline />
                              </div>
                            ) : (
                              <img alt="" className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`} src={item.url} />
                            )}

                            {item.status === 'uploading' && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1" />
                                <span className="text-[8px] text-white font-bold">{item.progress}%</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => removeMedia(item.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
                            >
                              <span className="material-symbols-rounded text-[12px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 카드 1: 태그 검색 */}
                <div className="border border-[#e0e4e5] rounded-2xl bg-white relative z-30">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                    <span className="material-symbols-rounded text-sm text-primary">search</span>
                    <p className="text-[14px] font-bold text-primary">태그 검색 (장소, 인물, 소셜, 이벤트, 그룹)</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                      <input
                        type="text"
                        className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-[16px] font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                        placeholder={t('feed.search_tag_placeholder', '태그할 장소, 사람, 이벤트 검색...')}
                        value={tagKeyword}
                        onChange={e => setTagKeyword(e.target.value)}
                      />
                      {isSearching && (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                      )}
                    </div>

                    {tagResults.length > 0 && (
                      <div className="absolute left-4 right-4 mt-1 bg-white border border-[#e0e4e5] rounded-xl max-h-56 overflow-y-auto shadow-lg divide-y divide-[#f2f4f4] z-50">
                        {tagResults.map(item => (
                          <button
                            key={`${item.kind}-${item.id}`}
                            type="button"
                            onClick={() => addTag(item)}
                            className="w-full px-4 py-3 hover:bg-[#f8f9fa] flex items-center justify-between text-left transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {item.photo ? (
                                <img src={item.photo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                              ) : (
                                <span className={`material-symbols-rounded text-xs p-1 rounded-full ${T_COLOR[item.kind]}`}>
                                  {T_ICON[item.kind]}
                                </span>
                              )}
                              <span className="font-bold text-sm text-[#2d3435]">{item.label}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider">{item.kind}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 카드 2: 선택된 태그 목록 */}
                <div className="border border-[#e0e4e5] rounded-2xl bg-white">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                    <span className="material-symbols-rounded text-sm text-primary">sell</span>
                    <p className="text-[14px] font-bold text-primary">선택된 태그 배지 ({tags.length})</p>
                  </div>
                  <div className="p-4 min-h-[100px]">
                    {tags.length === 0 ? (
                      <p className="text-xs text-[#acb3b4] font-medium py-2">
                        태그된 정보가 없습니다. 상단 검색창에 키워드를 입력해 등록해보세요.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <div
                            key={tag.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${T_COLOR[tag.kind] || 'bg-slate-50 text-slate-700 border-slate-200'}`}
                          >
                            {tag.photo ? (
                              <img src={tag.photo} alt="" className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <span className="material-symbols-rounded text-xs">{T_ICON[tag.kind]}</span>
                            )}
                            <span>{tag.label}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag.id)}
                              className="hover:opacity-100 opacity-60 ml-0.5 text-red-500"
                            >
                              <span className="material-symbols-rounded text-[14px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 소셜 100% 동일 하단 네비게이션 버튼 바 */}
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 shadow-lg flex gap-3 items-center justify-between"
            style={{
              paddingTop: '16px',
              paddingBottom: Capacitor.isNativePlatform() ? 'calc(16px + env(safe-area-inset-bottom))' : '16px',
              height: Capacitor.isNativePlatform() ? 'calc(76px + env(safe-area-inset-bottom))' : '76px'
            }}
          >
            {step > 1 && (
              <button
                type="button"
                onClick={handleHeaderBack}
                className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
              >
                {t('common.previous') || '이전 단계'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (step < TOTAL_STEPS) {
                  setStep(prev => prev + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={isSubmitting || (step === 1 && !content.trim() && media.length === 0) || media.some(m => m.status === 'uploading')}
              className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {step < TOTAL_STEPS
                ? (t('common.next_step') || '다음 단계')
                : (isSubmitting ? (editingPost ? t('feed.updating') : t('feed.posting')) : (editingPost ? (t('feed.update') || "수정 완료") : (t('feed.post') || "게시글 등록")))}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}
