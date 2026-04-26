import React, { useState, useRef, useEffect } from 'react';
import Portal from '@/components/common/Portal';
import { useAuth } from '@/components/providers/AuthProvider';
import { storageService } from '@/lib/firebase/storageService';
import { userService } from '@/lib/firebase/userService';
import { feedService } from '@/lib/firebase/feedService';
import { PlatformUser } from '@/types/user';
import { FeedContext, Post } from '@/types/feed';
import { useLocation } from '@/components/providers/LocationProvider';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  file?: File;
}

interface FeedCreatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any; 
  context?: FeedContext;
  editingPost?: Post | null;
}

export default function FeedCreatePopup({ isOpen, onClose, context, editingPost }: FeedCreatePopupProps) {
  const { user, profile } = useAuth();
  const { location } = useLocation();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<PlatformUser[]>([]);
  const [isTagging, setIsTagging] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PlatformUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Initialize state when editingPost changes
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content || '');
      setMedia((editingPost.media || []).map((m: any, idx: number) => ({
        id: `existing-${idx}`,
        url: typeof m === 'string' ? m : m.url,
        type: typeof m === 'string' ? 'image' : (m.type || 'image'),
        status: 'completed',
        progress: 100
      })));
      // Note: taggedUsers mapping would require fetching user objects or storing them in post
    } else {
      setContent('');
      setMedia([]);
      setTaggedUsers([]);
    }
  }, [editingPost, isOpen]);

  useEffect(() => {
    if (isTagging && searchKeyword.trim().length >= 2) {
      const search = async () => {
        const results = await userService.searchUsers(searchKeyword);
        setSearchResults(results);
      };
      const timer = setTimeout(search, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchKeyword, isTagging]);

  if (!isOpen) return null;

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (media.length + files.length > 10) {
      alert('최대 10개까지만 업로드 가능합니다.');
      return;
    }

    files.forEach(file => {
      const MAX_SIZE = 300 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert(`파일당 300MB 이하만 업로드 가능합니다: ${file.name}`);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (isImage) handleUpload(file, 'image');
      else if (isVideo) handleUpload(file, 'video');
    });

    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleUpload = async (file: File, type: 'image' | 'video') => {
    const id = Math.random().toString(36).substring(7);
    const newMedia: MediaItem = {
      id,
      url: URL.createObjectURL(file),
      type,
      progress: 0,
      status: 'uploading',
      file
    };
    
    setMedia(prev => [...prev, newMedia]);

    try {
      const path = `feeds/${user?.uid || 'anonymous'}/${Date.now()}_${file.name}`;
      const downloadURL = await storageService.uploadFile(file, path, (progress) => {
        setMedia(prev => prev.map(item => 
          item.id === id ? { ...item, progress: Math.round(progress) } : item
        ));
      });

      setMedia(prev => prev.map(item => 
        item.id === id ? { ...item, url: downloadURL, status: 'completed', progress: 100 } : item
      ));
    } catch (error) {
      console.error('Upload error:', error);
      setMedia(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'error' } : item
      ));
    }
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(item => item.id !== id));
  };

  const toggleTagUser = (targetUser: PlatformUser) => {
    setTaggedUsers(prev => {
      const isExist = prev.find(u => u.id === targetUser.id);
      if (isExist) return prev.filter(u => u.id !== targetUser.id);
      return [...prev, targetUser];
    });
  };

  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    if (!content.trim() && media.length === 0) return;

    if (media.some(m => m.status === 'uploading')) {
      alert('Please wait for media uploads to finish.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTargets = context?.scope === 'plaza' 
        ? ['plaza', context.scopeId] 
        : [context?.scopeId || 'freestyle-tango'];

      const finalCategory = context?.scopeId?.toUpperCase() || 'SOCIAL';

      const mediaData = media.filter(m => m.status === 'completed').map(m => ({
        url: m.url,
        type: m.type
      }));

      if (editingPost) {
        // UPDATE Logic
        const updatePayload = {
          content,
          media: mediaData,
          taggedUserIds: taggedUsers.map(u => u.id),
          // targets and category typically don't change on edit, but could be updated if needed
        };

        console.log('--- Feed Update Payload Check ---');
        console.log('PostId:', editingPost.id);
        console.log('Payload:', updatePayload);

        await feedService.updatePost(editingPost.id, updatePayload);
      } else {
        // CREATE Logic
        const payload = {
          userId: user.uid,
          userName: profile?.nickname || user.displayName || 'Anonymous',
          userPhoto: profile?.photoURL || user.photoURL || '',
          content,
          media: mediaData,
          taggedUserIds: taggedUsers.map(u => u.id),
          targets: finalTargets,
          category: finalCategory,
          location: {
            country: location.country,
            city: location.city
          }
        };

        console.log('--- Feed Create Payload Check ---');
        console.log('Payload:', payload);

        await feedService.createPost(payload);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Post action error details:', error);
      const errorMessage = error?.message || String(error);
      alert(`Failed to ${editingPost ? 'update' : 'create'} post: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[10000] bg-white dark:bg-slate-900 font-body overflow-y-auto selection:bg-primary-container selection:text-on-primary-container">
      {/* TopAppBar Shell */}
      <header className="fixed top-0 w-full z-[10001] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-16 w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors p-2 rounded-full active:opacity-70"
            >
              <span className="material-symbols-outlined text-on-surface">close</span>
            </button>
            <h1 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900 dark:text-slate-50">
              {editingPost ? 'Edit Post' : 'Create Post'}
            </h1>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || (media.some(m => m.status === 'uploading'))}
            className="text-blue-700 dark:text-blue-400 font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg active:opacity-70 disabled:opacity-30"
          >
            {isSubmitting ? (editingPost ? 'Updating...' : 'Posting...') : (editingPost ? 'Update' : 'Post')}
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-20 pb-24 px-4 max-w-2xl mx-auto min-h-screen">
        {/* User Profile Summary */}
        <section className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container border-2 border-primary-container">
            <img 
              alt="Profile Avatar" 
              className="w-full h-full object-cover" 
              src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nickname || user?.displayName || 'A')}&background=0A0A0A&color=fff`}
            />
          </div>
          <div>
            <h2 className="font-headline font-bold text-on-surface text-lg leading-tight">{profile?.nickname || user?.displayName || "Anonymous"}</h2>
            <div className="flex items-center gap-1.5 py-0.5 px-2 bg-secondary-container rounded-full w-fit mt-1">
              <span className="material-symbols-outlined text-[14px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
              <span className="text-[12px] font-semibold text-on-secondary-container">Freestyle Tango</span>
            </div>
          </div>
        </section>

        {/* Post Content Input */}
        <section className="mb-8">
          <textarea 
            className="w-full bg-transparent border-none focus:ring-0 text-xl font-body text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none min-h-[140px]" 
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
          
          {taggedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {taggedUsers.map(u => (
                <div key={u.id} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">
                  <span>@{u.nickname || u.id}</span>
                  <button onClick={() => toggleTagUser(u)} className="material-symbols-outlined !text-[14px] hover:text-red-500 transition-colors">close</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Media Section - Horizontal Scroll */}
        <section className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 ml-1">Media</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
            {media.map((item) => (
              <div key={item.id} className="relative flex-shrink-0 w-48 h-64 rounded-xl overflow-hidden snap-start group shadow-md border border-outline-variant/30">
                {item.type === 'video' ? (
                  <video 
                    className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`}
                    src={item.url}
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    alt="Media Content" 
                    className={`w-full h-full object-cover ${item.status === 'uploading' ? 'brightness-50' : ''}`} 
                    src={item.url}
                  />
                )}
                
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.type === 'image' ? 'image' : 'videocam'}
                      </span>
                    </div>
                    <p className="text-white font-bold text-sm mb-2">Uploading {item.progress}%</p>
                    <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary-fixed-dim h-full rounded-full shadow-[0_0_8px_rgba(83,145,255,0.8)] transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {item.status === 'completed' && (
                  <button 
                    onClick={() => removeMedia(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
                
                {item.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">Error</span>
                    <button onClick={() => removeMedia(item.id)} className="absolute top-2 right-2"><span className="material-symbols-outlined text-white">close</span></button>
                  </div>
                )}
              </div>
            ))}

            {/* Add Placeholder Card */}
            <button 
              onClick={() => mediaInputRef.current?.click()}
              className="flex-shrink-0 w-48 h-64 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-2 hover:bg-surface-container transition-colors snap-start"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">add</span>
              </div>
              <span className="text-xs font-bold text-outline">Add Media</span>
            </button>
          </div>
        </section>

        {/* Actions Section - Bento-style Grid */}
        <section className="grid grid-cols-2 gap-3">
          <input 
            type="file" 
            ref={mediaInputRef} 
            className="hidden" 
            accept="image/*, video/*" 
            multiple
            onChange={handleMediaSelect}
          />

          <button 
            onClick={() => mediaInputRef.current?.click()}
            className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
          >
            <span className="font-bold text-on-surface text-base">Add Media</span>
          </button>
          
          <button 
            onClick={() => setIsTagging(true)}
            className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
          >
            <span className="font-bold text-on-surface text-base">Tag People</span>
          </button>
        </section>

        {/* Tagging Overlay UI */}
        {isTagging && (
          <div className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Tag People</h3>
                <button onClick={() => setIsTagging(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                  <input 
                    type="text" 
                    placeholder="Search people..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {searchResults.map(u => (
                    <button 
                      key={u.id} 
                      onClick={() => toggleTagUser(u)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors mb-1"
                    >
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || "https://www.woc.today/images/default-avatar.png"} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div className="text-left">
                          <p className="font-bold text-sm">@{u.nickname || u.id}</p>
                          <p className="text-xs text-slate-500">{u.nickname}</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${taggedUsers.find(tu => tu.id === u.id) ? 'bg-primary border-primary' : 'border-slate-200'}`}>
                        {taggedUsers.find(tu => tu.id === u.id) && <span className="material-symbols-outlined text-white !text-[16px] font-black">check</span>}
                      </div>
                    </button>
                  ))}
                  {searchKeyword.length >= 2 && searchResults.length === 0 && (
                    <p className="text-center py-10 text-slate-400 text-sm">No results found</p>
                  )}
                  {searchKeyword.length < 2 && (
                    <p className="text-center py-10 text-slate-400 text-sm">Type at least 2 characters to search</p>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                <button 
                  onClick={() => setIsTagging(false)}
                  className="px-6 py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #a3abd7;
            border-radius: 10px;
        }
      `}</style>
      </div>
    </Portal>
  );
}
