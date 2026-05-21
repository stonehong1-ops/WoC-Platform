"use client";
// 홈 대시보드의 미디어 및 히스토리 콘텐츠를 렌더링하고 관리하는 공통 팝업 컴포넌트

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, updateDoc, doc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/clientApp';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentEntry {
  id: string;
  imageUrl: string;
  episodeNumber: number;
  title?: string;
  createdAt: any;
  likeCount?: number;
}

interface Review {
  id: string;
  content: string;
  createdAt: any;
}

interface ContentViewerPopupProps {
  collectionName: string;
  adminPassword: string;
  themeColor: 'amber' | 'indigo';
  navTitleKey: string;
  subtitleKey: string;
  adminUploadKey: string;
  viewerDayPrefixKey: string;
  viewerDaySuffixKey?: string;
  noPostsKey: string;
  decoratorIcon: string;
  popupHistoryKey: string;
  popupSheetHistoryKey: string;
  decoratorIconFontSetting?: string;
  onClose: () => void;
}

const themeStyles = {
  amber: {
    bgGradient: 'bg-gradient-to-br from-amber-950 via-stone-900 to-slate-900',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    buttonBg: 'bg-amber-600',
    textBrand: 'text-amber-400',
    borderBrand: 'border-t-amber-400',
    avatarBg: 'bg-amber-50',
    spinner: 'border-t-amber-400',
    fabBg: 'bg-amber-600/95 border-amber-500/30',
    progressDot: 'bg-amber-400',
  },
  indigo: {
    bgGradient: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-stone-900',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    buttonBg: 'bg-indigo-600',
    textBrand: 'text-indigo-400',
    borderBrand: 'border-t-indigo-400',
    avatarBg: 'bg-indigo-50',
    spinner: 'border-t-indigo-400',
    fabBg: 'bg-indigo-600/95 border-indigo-500/30',
    progressDot: 'bg-indigo-400',
  }
};

export default function ContentViewerPopup({
  collectionName,
  adminPassword,
  themeColor,
  navTitleKey,
  subtitleKey,
  adminUploadKey,
  viewerDayPrefixKey,
  viewerDaySuffixKey,
  noPostsKey,
  decoratorIcon,
  popupHistoryKey,
  popupSheetHistoryKey,
  decoratorIconFontSetting = "'FILL' 1",
  onClose,
}: ContentViewerPopupProps) {
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [likedEntries, setLikedEntries] = useState<Set<string>>(new Set());

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const styles = themeStyles[themeColor];

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentEntry));
      setEntries(all);
      if (all.length > 0) setCurrentIndex(0);
      else setCurrentIndex(-1);
    } catch (error) {
      console.error(`[${collectionName}] fetch error:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const currentEntry = currentIndex >= 0 && currentIndex < entries.length ? entries[currentIndex] : null;

  // Listen to reviews
  useEffect(() => {
    if (!currentEntry) {
      setReviews([]);
      return;
    }
    const reviewsRef = collection(db, collectionName, currentEntry.id, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    });
    return () => unsubscribe();
  }, [currentEntry, collectionName]);

  // Preload adjacent images
  useEffect(() => {
    if (entries.length > 0 && currentIndex >= 0) {
      [currentIndex - 1, currentIndex + 1].forEach(i => {
        if (i >= 0 && i < entries.length) {
          const img = new Image();
          img.src = entries[i].imageUrl;
        }
      });
    }
  }, [currentIndex, entries]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === adminPassword) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPasswordInput('');
    } else {
      alert('Incorrect password.');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => d.data() as ContentEntry);
      const nextEp = all.length > 0 && all[0].episodeNumber ? all[0].episodeNumber + 1 : 1;

      const fileRef = ref(storage, `${collectionName}/ep${nextEp}_${Date.now()}_${uploadFile.name}`);
      await uploadBytes(fileRef, uploadFile);
      const imageUrl = await getDownloadURL(fileRef);

      await addDoc(collection(db, collectionName), {
        imageUrl,
        episodeNumber: nextEp,
        createdAt: serverTimestamp(),
        likeCount: 0,
      });

      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchEntries();
      alert('Upload complete!');
      setIsAdmin(false);
    } catch (error) {
      console.error(`[${collectionName}] upload error:`, error);
      alert('Upload failed. Check Firebase Storage rules.');
    } finally {
      setUploading(false);
    }
  };

  // Swipe
  const minSwipeDistance = 50;
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null || showBottomSheet) return;
    const dist = touchStartX.current - touchEndX.current;
    if (dist > minSwipeDistance && currentIndex > 0) setCurrentIndex(p => p - 1);
    if (dist < -minSwipeDistance && currentIndex < entries.length - 1) setCurrentIndex(p => p + 1);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !currentEntry) return;
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, collectionName, currentEntry.id, 'reviews'), {
        content: newReview.trim(),
        createdAt: serverTimestamp()
      });
      setNewReview('');
    } catch (error) {
      console.error(`[${collectionName}] review error:`, error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleLike = async () => {
    if (!currentEntry) return;
    const entryRef = doc(db, collectionName, currentEntry.id);
    const liked = likedEntries.has(currentEntry.id);
    try {
      await updateDoc(entryRef, { likeCount: increment(liked ? -1 : 1) });
      setLikedEntries(prev => {
        const next = new Set(prev);
        liked ? next.delete(currentEntry.id) : next.add(currentEntry.id);
        return next;
      });
      setEntries(prev => prev.map(e => e.id === currentEntry.id ? { ...e, likeCount: Math.max(0, (e.likeCount || 0) + (liked ? -1 : 1)) } : e));
    } catch (error) {
      console.error(`[${collectionName}] like error:`, error);
    }
  };

  const currentLikeCount = currentEntry?.likeCount || 0;
  const isLiked = currentEntry ? likedEntries.has(currentEntry.id) : false;

  // History management
  useEffect(() => {
    const handlePopState = () => {
      if (showBottomSheet) setShowBottomSheet(false);
      else onClose();
    };
    window.history.pushState({ popup: popupHistoryKey }, '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onClose, showBottomSheet, popupHistoryKey]);

  const handleClose = () => {
    window.history.back();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed inset-0 ${styles.bgGradient} flex flex-col animate-in fade-in duration-300 overflow-hidden`} style={{ zIndex: 99999 }}>

      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-map.png')" }} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-30">
        <div className="flex flex-col">
          <span className={`px-3 py-1 ${styles.badgeBg} text-[10px] font-bold uppercase tracking-widest rounded-full mb-1 inline-block backdrop-blur-md w-fit`}>
            {t(navTitleKey)}
          </span>
          <h2 className="text-xl font-black text-white/90 font-headline">
            {t(subtitleKey)}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {!isAdmin && !showAdminLogin && (
            <button onClick={() => setShowAdminLogin(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/50 backdrop-blur-md hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
          )}
          <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/50 backdrop-blur-md hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>

      {/* Admin Login */}
      {showAdminLogin && !isAdmin && (
        <div className="absolute top-20 right-6 z-40 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
          <form onSubmit={handleAdminLogin} className="flex items-center gap-2">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder={t('home.cartoon.admin.passwordPlaceholder')} className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 bg-white/50 w-40 text-sm font-medium" autoFocus />
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">{t('home.cartoon.admin.unlock')}</button>
            <button type="button" onClick={() => setShowAdminLogin(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">{t('home.cartoon.admin.cancel')}</button>
          </form>
        </div>
      )}

      {/* Admin Upload */}
      {isAdmin && (
        <div className="absolute top-20 right-6 z-40 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-slate-200 flex flex-col gap-5 w-[340px] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className={`text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2`}>
              <span className={`material-symbols-outlined ${styles.textBrand} text-xl`}>upload_file</span>
              {t(adminUploadKey)}
            </span>
            <button onClick={() => setIsAdmin(false)} className="text-sm text-slate-400 hover:text-slate-900 font-bold">{t('home.cartoon.admin.exit')}</button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t('home.cartoon.admin.imageFileLabel')}</label>
            <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} ref={fileInputRef} className="w-full text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white bg-slate-50 rounded-xl border border-slate-200 p-1" />
          </div>
          <button onClick={handleUpload} disabled={!uploadFile || uploading} className={`w-full py-3.5 ${styles.buttonBg} text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95`}>
            {uploading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-lg">cloud_upload</span>{t('home.cartoon.admin.upload')}</>}
          </button>
        </div>
      )}

      {/* Main Viewer */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center pt-24 pb-8" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {loading ? (
          <div className={`w-10 h-10 border-4 border-white/20 ${styles.spinner} rounded-full animate-spin`} />
        ) : currentEntry ? (
          <>
            {/* Episode indicator */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
              <span className="text-white/60 font-black tracking-widest uppercase text-xs bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                {t(viewerDayPrefixKey)} {currentEntry.episodeNumber}{viewerDaySuffixKey ? ` ${t(viewerDaySuffixKey)}` : ''}
              </span>
            </div>

            <button onClick={() => setCurrentIndex(p => p + 1)} disabled={currentIndex === entries.length - 1} className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all disabled:opacity-0 z-10 border border-white/10">
              <span className="material-symbols-outlined text-3xl">chevron_left</span>
            </button>

            <div className="relative max-w-lg w-full mx-4">
              <img src={currentEntry.imageUrl} alt={`Day ${currentEntry.episodeNumber}`} className="w-full rounded-3xl shadow-2xl object-contain max-h-[65vh]" draggable={false} />
              {/* Vinyl / Scroll overlay decoration */}
              <div className={`absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg`}>
                <span className={`material-symbols-outlined ${styles.textBrand} text-2xl`} style={{ fontVariationSettings: decoratorIconFontSetting }}>{decoratorIcon}</span>
              </div>
            </div>

            <button onClick={() => setCurrentIndex(p => p - 1)} disabled={currentIndex === 0} className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all disabled:opacity-0 z-10 border border-white/10">
              <span className="material-symbols-outlined text-3xl">chevron_right</span>
            </button>

            {/* Progress dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {entries.slice(Math.max(0, currentIndex - 3), Math.min(entries.length, currentIndex + 4)).map((_, i) => {
                const idx = Math.max(0, currentIndex - 3) + i;
                return <div key={idx} className={`rounded-full transition-all duration-300 ${idx === currentIndex ? `w-6 h-2 ${styles.progressDot}` : 'w-2 h-2 bg-white/30'}`} />;
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/50">
            <span className="material-symbols-outlined text-5xl">auto_stories</span>
            <p className="font-bold">{t(noPostsKey)}</p>
          </div>
        )}
      </div>

      {/* FABs */}
      {currentEntry && !showBottomSheet && (
        <div className="absolute bottom-8 right-6 z-20 flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button onClick={toggleLike} className="relative w-14 h-14 bg-white/95 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border border-slate-200">
            <span className={`material-symbols-outlined text-2xl ${isLiked ? 'text-red-500' : 'text-slate-400'}`} style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-black min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{currentLikeCount}</span>
          </button>
          <button onClick={() => { setShowBottomSheet(true); window.history.pushState({ popup: popupSheetHistoryKey }, ''); }} className={`relative w-14 h-14 ${styles.fabBg} backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
            <span className={`absolute -top-1.5 -right-1.5 ${styles.buttonBg} text-white text-[11px] font-black min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded-full border-2 border-white shadow-sm`}>{reviews.length}</span>
          </button>
        </div>
      )}

      {/* Bottom Sheet */}
      {showBottomSheet && currentEntry && (
        <>
          <div className="absolute inset-0 bg-black/60 z-30 animate-in fade-in duration-300" onClick={handleClose} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-40 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-pointer" onClick={handleClose}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-extrabold text-slate-900 font-headline flex items-center gap-2">
                {t('home.cartoon.comments.title')} <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">{reviews.length}</span>
              </h3>
              <button onClick={toggleLike} className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-colors ${isLiked ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                {t('home.cartoon.like')} {currentLikeCount}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form onSubmit={handleSubmitReview} className="flex flex-col sm:flex-row items-end gap-3 mb-8 bg-slate-50 p-3 rounded-3xl border border-slate-100 shadow-sm">
                <textarea value={newReview} onChange={(e) => setNewReview(e.target.value)} placeholder={t('home.cartoon.comments.placeholder')} className="flex-1 w-full px-4 py-3 rounded-2xl border-none focus:outline-none bg-transparent text-slate-900 resize-none h-[50px] text-sm" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitReview(e); } }} />
                <button type="submit" disabled={!newReview.trim() || submittingReview} className={`w-full sm:w-auto h-[44px] px-6 ${styles.buttonBg} text-white rounded-2xl font-bold text-sm disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center transition-all active:scale-95 shrink-0`}>
                  {submittingReview ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : t('home.cartoon.comments.post')}
                </button>
              </form>
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-[24px] border border-slate-100 border-dashed">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                    <p className="text-slate-500 text-sm font-medium">{t('home.cartoon.comments.empty')}</p>
                  </div>
                ) : reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${styles.avatarBg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${styles.textBrand} text-sm`} style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-[13px]">{t('home.cartoon.comments.anonymous')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : t('home.cartoon.comments.justNow')}</span>
                      </div>
                      <p className="text-slate-600 break-words whitespace-pre-wrap leading-relaxed text-sm">{review.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-8" />
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
