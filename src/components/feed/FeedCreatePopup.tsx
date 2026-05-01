'use client';
import React, { useState, useRef, useEffect } from 'react';
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
import { useHistoryBack } from '@/hooks/useHistoryBack';

/* ─── Types ─── */
interface MediaItem {
  id: string; url: string; type: 'image' | 'video';
  progress: number; status: 'uploading' | 'completed' | 'error'; file?: File;
}
interface TagItem { id: string; label: string; kind: 'people' | 'venue' | 'event' | 'social' | 'group'; photo?: string; }
interface Props { isOpen: boolean; onClose: () => void; context?: FeedContext; editingPost?: Post | null; }

/* ─── Style config ─── */
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
const KIND_ICON: Record<string, string> = { people: 'person', venue: 'location_on', event: 'event', social: 'share', group: 'groups' };
const KIND_COLOR: Record<string, string> = { people: 'text-blue-500', venue: 'text-emerald-500', event: 'text-orange-500', social: 'text-purple-500', group: 'text-pink-500' };

export default function FeedCreatePopup({ isOpen, onClose, context, editingPost }: Props) {
  const { user, profile } = useAuth();
  const { location } = useLocation();
  const { handleClose } = useHistoryBack(isOpen, onClose);

  const [content, setContent] = useState('');
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

  /* ─ Reset ─ */
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

  /* ─ Tag search ─ */
  useEffect(() => {
    if (tagKeyword.trim().length < 2) { setTagResults([]); return; }
    const kw = tagKeyword.trim();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [users, venues, events, socials, groups] = await Promise.allSettled([
          userService.searchUsers(kw, 5),
          venueService.searchVenues(kw),
          eventService.searchEvents(kw),
          socialService.searchSocials(kw),
          groupService.getGroups(),
        ]);
        const results: TagItem[] = [];
        if (users.status === 'fulfilled') users.value.slice(0, 5).forEach(u => results.push({ id: u.id, label: u.nickname || u.id, kind: 'people', photo: u.photoURL && u.photoURL !== 'https://lh3.googleusercontent.com/a/default-user' ? u.photoURL : undefined }));
        if (venues.status === 'fulfilled') (venues.value as any[]).slice(0, 3).forEach(v => results.push({ id: v.id, label: v.name, kind: 'venue' }));
        if (events.status === 'fulfilled') (events.value as any[]).slice(0, 3).forEach(e => results.push({ id: e.id, label: e.title || e.titleNative, kind: 'event' }));
        if (socials.status === 'fulfilled') (socials.value as any[]).slice(0, 3).forEach(s => results.push({ id: s.id, label: s.title, kind: 'social' }));
        if (groups.status === 'fulfilled') {
          (groups.value as any[]).filter(g => g.name?.toLowerCase().includes(kw.toLowerCase())).slice(0, 3).forEach(g => results.push({ id: g.id, label: g.name, kind: 'group' }));
        }
        setTagResults(results);
      } finally { setIsSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [tagKeyword]);

  /* ─ Media ─ */
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const curVideos = media.filter(m => m.type === 'video').length;
    const curImages = media.filter(m => m.type === 'image').length;
    files.forEach(file => {
      if (file.type.startsWith('video/') && curVideos >= 1) { alert('You can add up to 1 video.'); return; }
      if (file.type.startsWith('image/') && curImages >= 20) { alert('You can add up to 20 images.'); return; }
      if (file.type.startsWith('video/')) handleUpload(file, 'video');
      else if (file.type.startsWith('image/')) handleUpload(file, 'image');
    });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };
  const handleUpload = async (file: File, type: 'image' | 'video') => {
    const id = Math.random().toString(36).slice(7);
    setMedia(prev => [...prev, { id, url: URL.createObjectURL(file), type, progress: 0, status: 'uploading', file }]);
    try {
      const path = `feeds/${user?.uid || 'anon'}/${Date.now()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, p => setMedia(prev => prev.map(m => m.id === id ? { ...m, progress: Math.round(p) } : m)));
      setMedia(prev => prev.map(m => m.id === id ? { ...m, url, status: 'completed', progress: 100 } : m));
    } catch {
      setMedia(prev => prev.map(m => m.id === id ? { ...m, status: 'error' } : m));
    }
  };
  const removeMedia = (id: string) => setMedia(prev => prev.filter(m => m.id !== id));

  /* ─ Tags ─ */
  const addTag = (item: TagItem) => {
    if (!tags.find(t => t.id === item.id)) setTags(prev => [...prev, item]);
    setTagKeyword(''); setTagResults([]);
  };
  const removeTag = (id: string) => setTags(prev => prev.filter(t => t.id !== id));

  /* ─ Submit ─ */
  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    if (!content.trim() && media.length === 0) return;
    if (media.some(m => m.status === 'uploading')) { alert('Upload in progress. Please wait and try again.'); return; }
    setIsSubmitting(true);
    try {
      const finalTargets = context?.scope === 'plaza' ? ['plaza', context.scopeId] : [context?.scopeId || 'freestyle-tango'];
      const mediaData = media.filter(m => m.status === 'completed').map(m => ({ url: m.url, type: m.type }));
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
        await feedService.createPost({
          userId: user.uid, userName: profile?.nickname || user.displayName || 'Anonymous',
          userPhoto: profile?.photoURL || user.photoURL || '',
          content, media: mediaData, taggedUserIds: tags.filter(t => t.kind === 'people').map(t => t.id),
          targets: finalTargets, category: context?.scopeId?.toUpperCase() || 'SOCIAL',
          location: { country: location.country, city: location.city },
          ...tagData, ...styleData,
        });
      }
      onClose();
    } catch (e: any) {
      alert(`Error: ${e?.message || e}`);
    } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[10000] bg-surface-bright text-on-surface font-body-md antialiased flex flex-col">

        {/* ── TopAppBar ── */}
        <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-white shadow-sm border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="p-2 rounded-full active:scale-95 duration-150 hover:bg-slate-50">
              <span className="material-symbols-outlined text-slate-500">close</span>
            </button>
            <h1 className="font-title-md text-title-md text-on-surface">{editingPost ? 'Edit Post' : 'Create Post'}</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && media.length === 0) || media.some(m => m.status === 'uploading')}
            className="px-5 py-2 rounded-xl bg-primary-container text-white font-title-md text-body-md hover:opacity-90 active:scale-95 duration-150 transition-all disabled:opacity-40"
          >
            {isSubmitting ? (editingPost ? 'Updating...' : 'Posting...') : (editingPost ? 'Update' : 'Post')}
          </button>
        </header>

        {/* ── Scrollable Canvas ── */}
        <main className="flex-1 overflow-y-auto pt-20 pb-32 px-[1.5rem] max-w-[56rem] mx-auto w-full space-y-[2.5rem]">

          {/* Profile Section */}
          <section className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-14 h-14 rounded-full shadow-sm border-2 border-primary-container/20 flex-shrink-0 overflow-hidden bg-surface-container relative flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant absolute" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>person</span>
            {((profile?.photoURL && profile.photoURL !== 'https://lh3.googleusercontent.com/a/default-user') || (user?.photoURL && user.photoURL !== 'https://lh3.googleusercontent.com/a/default-user')) && (
              <img
                alt={profile?.nickname || 'User'}
                className="w-full h-full object-cover relative z-10"
                src={(profile?.photoURL && profile.photoURL !== 'https://lh3.googleusercontent.com/a/default-user') ? profile.photoURL : user?.photoURL!}
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
          </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <h2 className="font-title-md text-title-md">{profile?.nickname || user?.displayName || 'Anonymous'}</h2>
                {profile?.nativeNickname && <span className="text-[12px] text-on-surface-variant font-medium">({profile.nativeNickname})</span>}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/30 w-fit cursor-default">
                <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{context?.scopeId || 'Freestyle Tango'}</span>
                <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
              </div>
            </div>
          </section>

          {/* Text Input / Color Preview */}
          <section className="w-full">
            {showColorPreview ? (
              <div
                className="rounded-2xl p-6 min-h-[160px] flex items-center justify-center transition-all"
                style={{ background: selectedColor!.bg, color: selectedColor!.text }}
              >
                <p className={`text-center break-words w-full ${previewClass}`} style={{ color: selectedColor!.text }}>{content}</p>
              </div>
            ) : (
              <textarea
                className="w-full min-h-[160px] bg-transparent border-none focus:ring-0 text-xl font-body-md text-on-surface placeholder:text-outline/60 resize-none"
                placeholder="What's on your mind?"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            )}
            {content.length > 0 && (
              <p className={`text-[10px] mt-1 text-right font-bold tracking-wide ${content.length <= 70 ? 'text-primary' : 'text-outline'}`}>
                {content.length}/70 {content.length <= 70 ? '✦ Style available' : ''}
              </p>
            )}
          </section>

          {/* Palette + Style Section */}
          <section className="flex flex-col gap-3 px-1 py-2 animate-in fade-in duration-700">
          {/* Color Row */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-outline tracking-wider uppercase shrink-0">Palette</span>
              <div className="flex items-center gap-[5px] overflow-x-auto scrollbar-none">
                {COLOR_PALETTE.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(selectedColor?.name === c.name ? null : c)}
                    title={c.name}
                    className={`rounded-full border-2 flex-shrink-0 transition-all hover:scale-110 active:scale-95 duration-150 ${
                      selectedColor?.name === c.name
                        ? 'ring-2 ring-primary ring-offset-1 border-primary scale-110'
                        : 'border-outline-variant/50'
                    } ${i === 0 ? 'w-5 h-5' : 'w-[14px] h-[14px]'}`}
                    style={c.isDefault ? {} : { backgroundColor: c.bg }}
                  />
                ))}
              </div>
            </div>

            {/* Style Row — Impact + Emphasis 한 줄 (≤70자 시 표시) */}
            {isShort && (
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                <span className="text-[10px] font-bold text-outline tracking-wider uppercase shrink-0">Style</span>
                <div className="flex items-center gap-1">
                  {IMPACT_SIZES.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImpact(i)}
                      title={['Normal', 'Bold', 'Impact'][i]}
                      style={{ fontWeight: s.weight, fontSize: s.size }}
                      className={`w-9 h-8 rounded-lg border transition-all active:scale-95 flex items-center justify-center leading-none ${
                        selectedImpact === i
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'border-outline-variant/40 text-outline hover:bg-surface-container'
                      }`}
                    >
                      A
                    </button>
                  ))}
                </div>
                <div className="w-px h-5 bg-outline-variant/30 mx-0.5" />
                <div className="flex items-center gap-1">
                  {EMPHASIS_OPTIONS.map((o, i) => (
                    <button
                      key={i}
                      title={o.title}
                      onClick={() => setSelectedEmphasis(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                      className={`w-8 h-8 rounded-lg text-[12px] border transition-all active:scale-95 flex items-center justify-center ${
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
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-label-xs text-label-xs text-outline tracking-[0.1em] uppercase">MEDIA</h3>
                {media.length > 0 && (
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add_photo_alternate</span> Add
                  </button>
                )}
              </div>
              {media.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
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
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">VIDEO</div>
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
                  <p className="font-title-md text-body-md text-on-surface-variant">Add Photos or Video</p>
                  <span className="text-[10px] text-on-surface-variant/60 font-medium">{imageCount}/20 Photos · {videoCount}/1 Video</span>
                  <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[120px] text-primary-container/5 pointer-events-none select-none">cloud_upload</span>
                </div>
              )}
              <input ref={mediaInputRef} type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleMediaSelect} />
            </section>
          )}

          {/* Tagging Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[20px]">sell</span>
              <h3 className="font-label-xs text-label-xs text-outline tracking-[0.1em] uppercase">TAGS</h3>
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
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className={`material-symbols-outlined text-outline group-focus-within:text-primary-container transition-colors ${isSearching ? 'animate-spin' : ''}`}>
                  {isSearching ? 'progress_activity' : 'search'}
                </span>
              </div>
              <input
                type="text"
                value={tagKeyword}
                onChange={e => setTagKeyword(e.target.value)}
                placeholder="people, group, event, social..."
                className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all outline-none font-body-md"
              />
            </div>

            {/* Search Results Dropdown */}
            {tagResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden max-h-64 overflow-y-auto">
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
              <p className="text-center text-xs text-outline py-4">검색 결과가 없습니다</p>
            )}
          </section>

        </main>
      </div>
    </Portal>
  );
}
