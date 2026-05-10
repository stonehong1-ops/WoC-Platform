'use client';

import '../live.css';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  X, Camera, ChevronLeft, Search, Check, ChevronDown, ChevronUp,
  Music, GraduationCap, Calendar, Users, User, Building2, Hash
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { galleryService, GalleryTag } from '@/lib/firebase/galleryService';
import { tagSearchService, TagSearchResult } from '@/lib/firebase/tagSearchService';
import { useLocation } from '@/components/providers/LocationProvider';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const ICON: Record<string, React.ReactNode> = {
  group: <Building2 size={14} />,
  social: <Music size={14} />,
  event: <Calendar size={14} />,
  class: <GraduationCap size={14} />,
  people: <User size={14} />,
};
const CLR: Record<string, string> = {
  group: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  social: 'bg-purple-50 text-purple-700 border-purple-200',
  event: 'bg-amber-50 text-amber-700 border-amber-200',
  class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  people: 'bg-pink-50 text-pink-700 border-pink-200',
};
const MAX_CAPTION = 50;

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
const GalleryCreateContent = () => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { location } = useLocation();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{url: string; type: 'image'|'video'}[]>([]);
  const [existingImages, setExistingImages] = useState<{url: string; type: 'image'|'video'}[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // === TAG States ===
  const [selectedGroup, setSelectedGroup] = useState<TagSearchResult | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<TagSearchResult | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<TagSearchResult[]>([]);
  const [showInLive, setShowInLive] = useState(true);

  // Data pools
  const [userGroups, setUserGroups] = useState<TagSearchResult[]>([]);
  const [activities, setActivities] = useState<TagSearchResult[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);

  // Search (1% power user)
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TagSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ---- Load today's groups + activities on mount ----
  useEffect(() => {
    const load = async () => {
      setLoadingGroups(true);
      try {
        const joinedGroups = profile?.joinedGroups || [];
        // Load ALL groups with today's activities (socials/events/classes via venueId reverse-map)
        const groups = await tagSearchService.getTodayGroups(location.country, location.city, joinedGroups);
        setUserGroups(groups);

        // Also load today's smart suggestions as default activities (if no group selected)
        const suggestions = await tagSearchService.getSmartSuggestions(location.country, location.city);
        const all = [
          ...suggestions.socialsToday,
          ...suggestions.eventsInProgress,
          ...suggestions.classesToday,
        ];
        setActivities(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingGroups(false);
      }
    };
    load();
  }, [profile, location.country, location.city]);

  // ---- When group is selected, load its activities ----
  useEffect(() => {
    if (!selectedGroup) return;
    const load = async () => {
      setLoadingActivities(true);
      setSelectedActivity(null);
      setSelectedPeople(prev => prev.filter(p => p.role === 'me'));
      try {
        const data = await tagSearchService.getGroupActivities(selectedGroup.id);
        setActivities([...data.socials, ...data.events, ...data.classes]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingActivities(false);
      }
    };
    load();
  }, [selectedGroup]);

  // ---- When activity is selected, auto-add people ----
  useEffect(() => {
    if (!selectedActivity) return;
    const load = async () => {
      setLoadingPeople(true);
      try {
        const autoPeople = await tagSearchService.getAutoPeople(
          selectedActivity.type as 'social' | 'event' | 'class',
          selectedActivity.id,
          selectedActivity.groupId || selectedGroup?.id
        );
        // Keep "me" and add auto people
        setSelectedPeople(prev => {
          const me = prev.find(p => p.role === 'me');
          const merged = me ? [me, ...autoPeople.filter(p => p.id !== me.id)] : autoPeople;
          return merged;
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPeople(false);
      }
    };
    load();
  }, [selectedActivity]);

  // ---- Add "me" by default ----
  useEffect(() => {
    if (user && !selectedPeople.find(p => p.role === 'me')) {
      setSelectedPeople(prev => [{
        type: 'people',
        id: user.uid,
        name: user.displayName || profile?.nickname || 'Me',
        subtitle: 'Me',
        avatar: user.photoURL || '',
        role: 'me',
      }, ...prev]);
    }
  }, [user, profile]);

  // ---- Edit mode load ----
  useEffect(() => {
    if (!editId) return;
    setIsEditMode(true);
    galleryService.getPost(editId).then(post => {
      if (!post) return;
      if (user && post.authorId !== user.uid) {
        alert('You do not have permission to edit.');
        router.push('/live');
        return;
      }
      setCaption(post.caption);
      const loadedMedia = post.media.map((url, i) => ({
        url,
        type: post.mediaTypes ? post.mediaTypes[i] : (url.toLowerCase().includes('video') ? 'video' : 'image')
      })) as { url: string; type: 'image' | 'video' }[];
      setExistingImages(loadedMedia);
      setPreviews(loadedMedia);
      // Restore tags
      if (post.tags) {
        const groupTag = post.tags.find(t => t.type === 'group');
        if (groupTag) setSelectedGroup({ ...groupTag, subtitle: '' });
        const activityTag = post.tags.find(t => ['social', 'event', 'class'].includes(t.type));
        if (activityTag) setSelectedActivity({ ...activityTag, subtitle: activityTag.instructors || '' });
        const peopleTags = post.tags.filter(t => t.type === 'people');
        if (peopleTags.length > 0) {
          setSelectedPeople(peopleTags.map(t => ({ ...t, subtitle: t.role || '' })));
        }
      }
      // Restore showInLive (default true for backward compat)
      setShowInLive(post.showInLive !== false);
    });
  }, [editId, user]);

  // ---- Search (1% power user) ----
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 1) {
        setIsSearching(true);
        try {
          const results = await tagSearchService.searchAll(searchQuery);
          setSearchResults(results);
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addSearchResult = (r: TagSearchResult) => {
    if (r.type === 'group') { setSelectedGroup(r); }
    else if (['social', 'event', 'class'].includes(r.type)) { setSelectedActivity(r); }
    else if (r.type === 'people' && !selectedPeople.find(p => p.id === r.id)) {
      setSelectedPeople(prev => [...prev, r]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setSearchMode(false);
  };

  // ---- Media ----
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length + existingImages.length > 10) return alert('Maximum 10 files.');
    const newP = files.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' as const : 'image' as const }));
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newP]);
  };
  const removeImage = (idx: number) => {
    const p = previews[idx];
    const eIdx = existingImages.findIndex(img => img.url === p.url);
    if (eIdx >= 0) setExistingImages(prev => prev.filter((_, i) => i !== eIdx));
    else {
      const fIdx = idx - existingImages.length;
      if (fIdx >= 0) setImages(prev => { const n = [...prev]; n.splice(fIdx, 1); return n; });
    }
    setPreviews(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
  };

  // ---- Post ----
  const handlePost = async () => {
    if (!user) return alert('Please sign in first.');
    if (images.length === 0 && existingImages.length === 0) return alert('At least 1 media file is required.');

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let totalTransferred = 0;
      const totalBytes = images.reduce((a, f) => a + f.size, 0);
      const newMedia = await Promise.all(images.map(file =>
        new Promise<{url: string; type: 'image'|'video'}>((resolve, reject) => {
          const sRef = ref(storage, `gallery/${user.uid}/${Date.now()}_${file.name}`);
          const task = uploadBytesResumable(sRef, file);
          let last = 0;
          task.on('state_changed',
            s => { const d = s.bytesTransferred - last; last = s.bytesTransferred; totalTransferred += d; setUploadProgress(Math.min(100, Math.round(totalTransferred / totalBytes * 100))); },
            reject,
            async () => resolve({ url: await getDownloadURL(task.snapshot.ref), type: file.type.startsWith('video/') ? 'video' : 'image' })
          );
        })
      ));

      const finalUrls = [...existingImages.map(i => i.url), ...newMedia.map(m => m.url)];
      const finalTypes = [...existingImages.map(i => i.type), ...newMedia.map(m => m.type)];

      // Build tags array — strip undefined fields (Firestore rejects undefined)
      const clean = (obj: Record<string, any>) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
      const tags: GalleryTag[] = [];
      if (selectedGroup) tags.push(clean({ type: 'group', id: selectedGroup.id, name: selectedGroup.name, avatar: selectedGroup.avatar }) as GalleryTag);
      if (selectedActivity) tags.push(clean({
        type: selectedActivity.type,
        id: selectedActivity.id,
        name: selectedActivity.name,
        groupId: selectedActivity.groupId || selectedGroup?.id,
        instructors: selectedActivity.instructors,
      }) as GalleryTag);
      selectedPeople.forEach(p => tags.push(clean({ type: 'people', id: p.id, name: p.name, avatar: p.avatar, role: p.role }) as GalleryTag));

      const postData = {
        media: finalUrls,
        mediaTypes: finalTypes,
        caption,
        tags,
        showInLive,
        venueId: '', venueName: '', eventId: '', eventName: '',
      };

      if (isEditMode && editId) {
        await galleryService.updatePost(editId, postData);
      } else {
        await galleryService.createPost({ authorId: user.uid, authorName: user.displayName || profile?.nickname || 'Anonymous', authorPhoto: user.photoURL || '', ...postData });
      }
      router.push('/live');
    } catch (err) {
      console.error(err);
      alert('Error saving post.');
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Render ----
  return (
    <div className="fixed inset-0 z-[100] bg-white md:bg-black/80 flex justify-center backdrop-blur-sm">
      <div className="gallery-create-container w-full h-full overflow-y-auto bg-white shadow-xl flex flex-col relative">
        {/* Header */}
        <div className="create-header">
          <button onClick={() => router.back()}><ChevronLeft size={24} /></button>
          <span className="create-title">{isEditMode ? 'Edit Post' : 'New Post'}</span>
          <button className="btn-post" onClick={handlePost} disabled={isUploading || (images.length === 0 && existingImages.length === 0)}>
            {isUploading ? `${uploadProgress}%` : (isEditMode ? 'Update' : 'Post')}
          </button>
        </div>

        {isUploading && <div className="w-full bg-gray-100 h-1"><div className="bg-primary h-1 transition-all" style={{ width: `${uploadProgress}%` }} /></div>}

        {/* Media Upload */}
        <div className="upload-section" style={{ padding: '12px 16px' }}>
          <div className="image-preview-scroll">
            {previews.map((item, idx) => (
              <div key={idx} className="preview-item" style={{ flex: '0 0 80px', height: '100px' }}>
                {item.type === 'video'
                  ? <video src={item.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  : <img src={item.url} alt="" className="w-full h-full object-cover" />}
                <button className="btn-remove-image" onClick={() => removeImage(idx)}><X size={12} /></button>
              </div>
            ))}
            <button className="btn-add-more" style={{ flex: '0 0 80px', height: '100px', fontSize: '10px' }} onClick={() => fileInputRef.current?.click()}>
              <Camera size={18} /><span>Add</span>
            </button>
          </div>
          <input type="file" multiple accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleImageChange} />
        </div>

        {/* Caption - compact single line */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <input
            type="text"
            className="flex-1 text-sm bg-transparent border-none focus:outline-none placeholder:text-gray-400"
            placeholder="Write a caption..."
            value={caption}
            maxLength={MAX_CAPTION}
            onChange={e => setCaption(e.target.value)}
          />
          <span className={`text-[10px] font-bold shrink-0 ${caption.length >= MAX_CAPTION ? 'text-red-500' : 'text-gray-300'}`}>
            {caption.length}/{MAX_CAPTION}
          </span>
        </div>

        {/* ===== TAG SYSTEM v2 ===== */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* TAG section title */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Hash size={12} className="text-white" />
            </div>
            <span className="text-sm font-extrabold text-gray-800 tracking-wide">TAG</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-2.5">
          {/* ── TIER 1: GROUP ── */}
          <TierSection
            label="GROUP"
            icon={<Building2 size={14} />}
            color="indigo"
            selected={selectedGroup}
            onClear={() => { setSelectedGroup(null); setSelectedActivity(null); setSelectedPeople(prev => prev.filter(p => p.role === 'me')); }}
          >
            {!selectedGroup && (
              loadingGroups
                ? <Spinner />
                : userGroups.length > 0
                  ? <div className="flex flex-wrap gap-1.5">
                      {userGroups.map(g => (
                        <Chip key={g.id} label={g.name} avatar={g.avatar} onClick={() => setSelectedGroup(g)} />
                      ))}
                    </div>
                  : <p className="text-xs text-gray-400">No active groups today</p>
            )}
          </TierSection>

          {/* ── TIER 2: SOCIAL / EVENT / CLASS ── */}
          <TierSection
            label="SOCIAL · EVENT · CLASS"
            icon={<Music size={14} />}
            color="purple"
            selected={selectedActivity}
            onClear={() => { setSelectedActivity(null); setSelectedPeople(prev => prev.filter(p => p.role === 'me')); }}
          >
            {!selectedActivity && (
              loadingActivities
                ? <Spinner />
                : activities.length > 0
                  ? <div className="flex flex-wrap gap-1.5">
                      {activities.map(a => (
                        <Chip
                          key={`${a.type}-${a.id}`}
                          label={a.name}
                          sub={a.subtitle}
                          icon={ICON[a.type]}
                          color={CLR[a.type]}
                          onClick={() => setSelectedActivity(a)}
                        />
                      ))}
                    </div>
                  : <p className="text-xs text-gray-400">{selectedGroup ? 'No activities today' : 'No activities today'}</p>
            )}
          </TierSection>

          {/* ── TIER 3: PEOPLE ── */}
          <div className="rounded-xl border border-gray-100 bg-white">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
              <Users size={14} className="text-pink-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">People</span>
            </div>
            <div className="px-3 py-2">
              {loadingPeople ? <Spinner /> : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPeople.map(p => (
                    <div key={p.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${CLR.people}`}>
                      {p.avatar
                        ? <img src={p.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                        : <User size={12} />}
                      <span>{p.name}</span>
                      <span className="text-[10px] opacity-50">{p.role === 'me' ? '(me)' : p.role === 'organizer' ? '(org)' : p.role === 'instructor' ? '(inst)' : ''}</span>
                      {p.role !== 'me' && (
                        <button onClick={() => setSelectedPeople(prev => prev.filter(x => x.id !== p.id))} className="opacity-50 hover:opacity-100">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── SEARCH (1% power user) ── */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400"
              onClick={() => setSearchMode(!searchMode)}
            >
              <Search size={14} />
              <span>Search & add any resource</span>
              {searchMode ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>
            {searchMode && (
              <div className="px-3 pb-3">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="Search group, social, event, class, people..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {isSearching && <div className="absolute right-2 top-2.5 w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-1 bg-white rounded-lg border border-gray-100 shadow-sm max-h-40 overflow-y-auto">
                    {searchResults.map(r => (
                      <button
                        key={`${r.type}-${r.id}`}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => addSearchResult(r)}
                      >
                        <span className="text-gray-400">{ICON[r.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">{r.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">{r.type} · {r.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── LIVE TOGGLE ── */}
          <div className="rounded-xl border border-gray-100 bg-white">
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5"
              onClick={() => setShowInLive(!showInLive)}
            >
              <span className="material-symbols-outlined text-[16px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              <span className="text-xs font-bold text-gray-700 flex-1 text-left">Also show in Live</span>
              <div className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${showInLive ? 'bg-red-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showInLive ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          {/* Selected Tags Summary */}
          {(selectedGroup || selectedActivity || selectedPeople.length > 0) && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedGroup && <MiniTag type="group" name={selectedGroup.name} />}
              {selectedActivity && <MiniTag type={selectedActivity.type} name={selectedActivity.name} />}
              {selectedPeople.map(p => <MiniTag key={p.id} type="people" name={p.name} />)}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Tier Section: collapsible group with selected indicator */
const TierSection = ({ label, icon, color, selected, onClear, children }: {
  label: string; icon: React.ReactNode; color: string;
  selected: TagSearchResult | null; onClear: () => void;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-gray-100 bg-white">
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
      <span className={`text-${color}-500`}>{icon}</span>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      {selected && (
        <div className="ml-auto flex items-center gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${CLR[selected.type]}`}>
            {ICON[selected.type]}
            {selected.name}
          </span>
          <button onClick={onClear} className="text-gray-300 hover:text-gray-500"><X size={12} /></button>
        </div>
      )}
    </div>
    {!selected && <div className="px-3 py-2">{children}</div>}
  </div>
);

/** Selectable chip */
const Chip = ({ label, sub, avatar, icon, color, onClick }: {
  label: string; sub?: string; avatar?: string;
  icon?: React.ReactNode; color?: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700`}
  >
    {avatar && <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover" />}
    {icon && <span className="opacity-60">{icon}</span>}
    <span className="truncate max-w-[120px]">{label}</span>
    {sub && <span className="text-[10px] opacity-50 truncate max-w-[80px]">{sub}</span>}
  </button>
);

/** Mini tag badge for summary */
const MiniTag = ({ type, name }: { type: string; name: string }) => (
  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${CLR[type] || 'bg-gray-100 text-gray-600 border-gray-200'} border`}>
    {ICON[type]}<span>{name}</span>
  </span>
);

/** Loading spinner */
const Spinner = () => (
  <div className="flex items-center gap-2 py-1 text-gray-300">
    <div className="w-3 h-3 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
    <span className="text-[10px]">Loading...</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Page wrapper                                                       */
/* ------------------------------------------------------------------ */
const GalleryCreatePage = () => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
    <GalleryCreateContent />
  </Suspense>
);

export default GalleryCreatePage;
