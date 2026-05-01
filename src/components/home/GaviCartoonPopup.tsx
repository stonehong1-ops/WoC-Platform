"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, limit, updateDoc, doc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';

interface GaviCartoonPopupProps {
  onClose: () => void;
}

interface Cartoon {
  id: string;
  imageUrl: string;
  episodeNumber: number;
  category: string;
  createdAt: any;
  likeCount?: number;
}

interface Review {
  id: string;
  content: string;
  createdAt: any;
}

const CATEGORIES = [
  { id: 'imagination', label: '상상 그 이상' },
  { id: 'wheres_gavi', label: '가비씨 어디가?' },
  { id: 'fur_mood', label: '에세이 톡' }
];

export default function GaviCartoonPopup({ onClose }: GaviCartoonPopupProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartoons, setCartoons] = useState<Cartoon[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [latestGlobalCartoon, setLatestGlobalCartoon] = useState<Cartoon | null>(null);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // New state for Bottom Sheet
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
  // Set to track liked episodes in this session
  const [likedCartoons, setLikedCartoons] = useState<Set<string>>(new Set());
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>(CATEGORIES[0].id);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fetch all cartoons to avoid composite index requirements for now
  const fetchCartoons = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'cartoons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cartoon));
      // Client-side filtering
      const filtered = all.filter(c => {
        const cat = c.category || 'imagination';
        return cat === selectedCategory;
      });
      setCartoons(filtered);
      if (filtered.length > 0) {
        setCurrentIndex(0); // Latest first
      } else {
        setCurrentIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching cartoons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartoons();
    // Reset bottom sheet when category changes
    setShowBottomSheet(false);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const q = query(collection(db, 'cartoons'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setLatestGlobalCartoon({ id: snap.docs[0].id, ...snap.docs[0].data() } as Cartoon);
        }
      } catch (error) {
        console.error("Failed to fetch latest cartoon", error);
      }
    };
    if (!selectedCategory) {
      fetchLatest();
    }
  }, [selectedCategory]);

  const currentCartoon = currentIndex >= 0 && currentIndex < cartoons.length ? cartoons[currentIndex] : null;

  // Listen to reviews
  useEffect(() => {
    if (!currentCartoon) {
      setReviews([]);
      return;
    }
    const reviewsRef = collection(db, 'cartoons', currentCartoon.id, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    });
    return () => unsubscribe();
  }, [currentCartoon]);

  // Preload adjacent images for seamless transitions
  useEffect(() => {
    if (cartoons.length > 0 && currentIndex >= 0) {
      const preloadIndexes = [currentIndex - 1, currentIndex + 1];
      preloadIndexes.forEach(index => {
        if (index >= 0 && index < cartoons.length) {
          const img = new Image();
          img.src = cartoons[index].imageUrl;
        }
      });
    }
  }, [currentIndex, cartoons]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'gavi') {
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
      // Find max episode number for this category
      const q = query(collection(db, 'cartoons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const catCartoons = snap.docs
        .map(d => d.data() as Cartoon)
        .filter(c => (c.category || 'imagination') === uploadCategory);
      
      let nextEpisodeNumber = 1;
      if (catCartoons.length > 0 && catCartoons[0].episodeNumber) {
        nextEpisodeNumber = catCartoons[0].episodeNumber + 1;
      }

      const fileRef = ref(storage, `cartoons/${uploadCategory}_ep${nextEpisodeNumber}_${Date.now()}_${uploadFile.name}`);
      await uploadBytes(fileRef, uploadFile);
      const imageUrl = await getDownloadURL(fileRef);
      
      await addDoc(collection(db, 'cartoons'), {
        imageUrl,
        episodeNumber: nextEpisodeNumber,
        category: uploadCategory,
        createdAt: serverTimestamp()
      });
      
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      if (selectedCategory === uploadCategory) {
        await fetchCartoons();
      }
      alert('Upload complete!');
      setIsAdmin(false);
    } catch (error) {
      console.error("Error uploading cartoon:", error);
      alert('An error occurred during upload. Please check Firebase Storage rules.');
    } finally {
      setUploading(false);
    }
  };

  // Touch and Swipe Handlers
  const minSwipeDistance = 50;
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    // Don't swipe if bottom sheet is open
    if (showBottomSheet) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Left swipe means Next Episode (Newer) -> currentIndex decreases
    if (isLeftSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    // Right swipe means Prev Episode (Older) -> currentIndex increases
    if (isRightSwipe && currentIndex < cartoons.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !currentCartoon) return;
    
    setSubmittingReview(true);
    try {
      const reviewsRef = collection(db, 'cartoons', currentCartoon.id, 'reviews');
      await addDoc(reviewsRef, {
        content: newReview.trim(),
        createdAt: serverTimestamp()
      });
      setNewReview('');
    } catch (error) {
      console.error("Error submitting review:", error);
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleLike = async () => {
    if (!currentCartoon) return;
    
    const cartoonRef = doc(db, 'cartoons', currentCartoon.id);
    const currentlyLiked = likedCartoons.has(currentCartoon.id);
    
    try {
      if (currentlyLiked) {
        // Unlike
        await updateDoc(cartoonRef, {
          likeCount: increment(-1)
        });
        setLikedCartoons(prev => {
          const next = new Set(prev);
          next.delete(currentCartoon.id);
          return next;
        });
        setCartoons(prev => prev.map(c => c.id === currentCartoon.id ? { ...c, likeCount: Math.max(0, (c.likeCount || 0) - 1) } : c));
      } else {
        // Like
        await updateDoc(cartoonRef, {
          likeCount: increment(1)
        });
        setLikedCartoons(prev => {
          const next = new Set(prev);
          next.add(currentCartoon.id);
          return next;
        });
        setCartoons(prev => prev.map(c => c.id === currentCartoon.id ? { ...c, likeCount: (c.likeCount || 0) + 1 } : c));
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const currentLikeCount = currentCartoon?.likeCount || 0;
  const isLiked = currentCartoon ? likedCartoons.has(currentCartoon.id) : false;

  // Handle popstate for back button support
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Logic is reversed: popstate happens AFTER the back button is pressed
      // We check our current state and close the top-most layer
      if (showBottomSheet) {
        setShowBottomSheet(false);
      } else if (selectedCategory) {
        setSelectedCategory(null);
      } else {
        onClose();
      }
    };
    
    // Initial state for the popup
    window.history.pushState({ popup: 'gaviCartoon' }, '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onClose, selectedCategory, showBottomSheet]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    window.history.pushState({ popup: 'gaviCartoonCategory' }, '');
  };

  const closeFullscreen = () => {
    window.history.back();
  };

  const handleHubClose = () => {
    // Remove our pushed history state and close
    window.history.back();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-full flex flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden" style={{ height: '100dvh', zIndex: 99999 }}>
      
      {/* Background Cover Image */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 opacity-100`}>
        <img src="/cartoonhome.png" alt="Gavi's Cartoon Hub" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
      </div>

      {/* Header (Top Right Overlay) */}
      <div className="absolute top-0 right-0 p-4 sm:p-6 flex items-center gap-3 z-30">
        {!isAdmin && !showAdminLogin && (
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 text-black/50 backdrop-blur-md hover:bg-black/20 hover:text-black/80 transition-colors shadow-sm"
            title="Admin Login"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        )}
        <button 
          onClick={handleHubClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 text-black/50 backdrop-blur-md hover:bg-black/20 hover:text-black/80 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Admin Login Dropdown */}
      {showAdminLogin && !isAdmin && (
        <div className="absolute top-20 right-6 z-40 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
          <form onSubmit={handleAdminLogin} className="flex items-center gap-2">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Admin Password" 
              className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 bg-white/50 w-40 text-sm font-medium"
              autoFocus
            />
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-md">
              Unlock
            </button>
            <button type="button" onClick={() => setShowAdminLogin(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Admin Upload Section */}
      {isAdmin && (
        <div className="absolute top-20 right-6 z-40 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-slate-200 flex flex-col gap-5 w-[340px] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
              Upload
            </span>
            <button onClick={() => setIsAdmin(false)} className="text-sm text-slate-400 hover:text-slate-900 font-bold transition-colors">Exit</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Category</label>
              <select 
                value={uploadCategory} 
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/20 font-medium text-slate-900"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Image File</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                ref={fileInputRef}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-colors bg-slate-50 rounded-xl border border-slate-200 p-1"
              />
            </div>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!uploadFile || uploading}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 mt-2"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                Upload Episode
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Layout Area - Shows only when NO category is selected */}
      {!selectedCategory && (
        <div className="relative z-10 flex flex-1 w-full h-full pointer-events-none">
          {/* Left Sidebar Menu */}
          <div className="w-full md:w-[320px] lg:w-[400px] flex flex-col justify-between p-6 sm:p-10 lg:p-16 h-full pt-16 pb-24 sm:pt-20 sm:pb-32 gap-6 pointer-events-auto">
            <div className="animate-in fade-in slide-in-from-left-8 duration-500 delay-100 fill-mode-both">
              <span className="px-3 py-1 bg-white/80 text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block backdrop-blur-md border border-white/50 shadow-sm">Gavi's Cartoons</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight font-headline whitespace-nowrap">
                가비의 만화방
              </h2>
            </div>
            
            <div className="flex flex-col gap-2">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`group relative w-fit text-left px-3.5 py-2 rounded-xl font-bold text-xs transition-all duration-300 shadow-sm backdrop-blur-md border flex items-center gap-2 animate-in fade-in slide-in-from-left-8 fill-mode-both`}
                  style={{ animationDelay: `${(i + 2) * 100}ms` }}
                >
                  <span className="text-slate-800 group-hover:text-slate-900">{cat.label}</span>
                  <span className="material-symbols-outlined text-[14px] transition-transform duration-300 text-slate-400 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                  
                  {/* Background Pill */}
                  <div className="absolute inset-0 bg-white/80 group-hover:bg-white rounded-xl -z-10 border border-white/50" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Latest Update */}
      {!selectedCategory && latestGlobalCartoon && (
        <div className="fixed bottom-[90px] md:bottom-8 right-4 md:right-8 z-40 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 pointer-events-auto">
          <button 
            onClick={() => handleCategorySelect(latestGlobalCartoon.category || 'imagination')}
            className="flex items-center gap-2 text-[10px] text-slate-900 font-bold uppercase tracking-widest bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200 hover:bg-white hover:scale-105 active:scale-95 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            latest update : {latestGlobalCartoon.createdAt?.toDate ? latestGlobalCartoon.createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toLowerCase() : 'today'}
          </button>
        </div>
      )}

      {/* Fullscreen Viewer (Portal) - Replaces the intermediate view entirely */}
      {selectedCategory && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-white flex flex-col animate-in fade-in duration-300" style={{ zIndex: 100000 }}>
          
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pb-20 pointer-events-none">
            <span className="text-white font-black tracking-widest uppercase bg-slate-900/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-sm pointer-events-auto shadow-lg flex items-center gap-3">
              <span>{loading ? 'Loading...' : currentCartoon ? `Ep. ${currentCartoon.episodeNumber}` : 'No Episodes'}</span>
            </span>
            <button 
              onClick={closeFullscreen}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 backdrop-blur-md transition-all hover:scale-110 active:scale-95 pointer-events-auto border border-white/20 shadow-lg"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div 
            className="flex-1 w-full h-full relative flex items-center justify-center p-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
             {loading ? (
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
             ) : currentCartoon ? (
               <>
                 <button 
                   onClick={() => setCurrentIndex(prev => prev + 1)}
                   disabled={currentIndex === cartoons.length - 1 || loading}
                   className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 items-center justify-center rounded-full bg-slate-900/50 text-white hover:bg-slate-900/80 backdrop-blur-md transition-all hover:scale-110 disabled:opacity-0 disabled:pointer-events-none z-10 border border-white/10"
                 >
                   <span className="material-symbols-outlined text-4xl">chevron_left</span>
                 </button>

                 <img 
                   src={currentCartoon.imageUrl}
                   alt={`Episode ${currentCartoon.episodeNumber}`}
                   className="w-full h-full object-contain"
                   draggable={false}
                 />

                 <button 
                   onClick={() => setCurrentIndex(prev => prev - 1)}
                   disabled={currentIndex === 0 || loading}
                   className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 items-center justify-center rounded-full bg-slate-900/50 text-white hover:bg-slate-900/80 backdrop-blur-md transition-all hover:scale-110 disabled:opacity-0 disabled:pointer-events-none z-10 border border-white/10"
                 >
                   <span className="material-symbols-outlined text-4xl">chevron_right</span>
                 </button>
               </>
             ) : (
                <div className="flex flex-col items-center gap-4 text-white/50">
                   <span className="material-symbols-outlined text-5xl">photo_library</span>
                   <p className="font-bold">등록된 에피소드가 없습니다.</p>
                </div>
             )}
          </div>

          {/* FAB for Comments & Likes (Visible only when cartoon exists and bottom sheet is closed) */}
          {currentCartoon && !showBottomSheet && (
            <div className="absolute bottom-8 right-6 z-20 flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
              {/* Like FAB */}
              <button 
                onClick={toggleLike}
                className="relative w-14 h-14 bg-white/95 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-slate-900 hover:scale-105 active:scale-95 transition-transform border border-slate-200"
              >
                <span className={`material-symbols-outlined text-2xl ${isLiked ? 'text-red-500' : 'text-slate-400'}`} style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-black min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {currentLikeCount}
                </span>
              </button>

              {/* Comments FAB */}
              <button 
                onClick={() => {
                  setShowBottomSheet(true);
                  window.history.pushState({ popup: 'gaviCartoonSheet' }, '');
                }}
                className="relative w-14 h-14 bg-slate-900/95 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform border border-white/20"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                
                {/* Always show comment count */}
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[11px] font-black min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-sm">
                  {reviews.length}
                </span>
              </button>
            </div>
          )}

          {/* Bottom Sheet for Comments & Likes */}
          {showBottomSheet && currentCartoon && (
            <>
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 z-30 animate-in fade-in duration-300"
                onClick={closeFullscreen}
              />
              
              {/* Sheet container */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-40 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
                {/* Drag Handle Area */}
                <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-pointer" onClick={closeFullscreen}>
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                </div>
                
                {/* Header with Like Button */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <h3 className="text-xl font-extrabold text-slate-900 font-headline flex items-center gap-2">
                    Comments
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">{reviews.length}</span>
                  </h3>
                  
                  {/* Like Button */}
                  <button 
                    onClick={toggleLike}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                      isLiked ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                      favorite
                    </span>
                    좋아요 {currentLikeCount}
                  </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  
                  {/* Comment Input */}
                  <form onSubmit={handleSubmitReview} className="flex flex-col sm:flex-row items-end gap-3 mb-8 bg-slate-50 p-3 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex-1 w-full relative">
                      <textarea 
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        placeholder="Leave an anonymous comment..."
                        className="w-full px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-0 bg-transparent text-slate-900 resize-none h-[50px] min-h-[50px] max-h-[100px] custom-scrollbar text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitReview(e);
                          }
                        }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={!newReview.trim() || submittingReview}
                      className="w-full sm:w-auto h-[44px] px-6 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center transition-all active:scale-95 shrink-0"
                    >
                      {submittingReview ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : 'Post'}
                    </button>
                  </form>

                  {/* Comment List */}
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-[24px] border border-slate-100 border-dashed">
                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                        <p className="text-slate-500 text-sm font-medium">Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-slate-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900 text-[13px]">Anonymous</span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                            <p className="text-slate-600 break-words whitespace-pre-wrap leading-relaxed text-sm">{review.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Padding to allow scrolling past the bottom on mobile */}
                  <div className="h-8"></div>
                </div>
              </div>
            </>
          )}

        </div>,
        document.body
      )}

    </div>,
    document.body
  );
}
