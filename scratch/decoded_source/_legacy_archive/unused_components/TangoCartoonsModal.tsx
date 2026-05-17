"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, onSnapshot, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';

interface TangoCartoonsModalProps {
  onClose: () => void;
}

interface Cartoon {
  id: string;
  imageUrl: string;
  episodeNumber: number;
  createdAt: any;
}

interface Review {
  id: string;
  content: string;
  createdAt: any;
}

export default function TangoCartoonsModal({ onClose }: TangoCartoonsModalProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [currentCartoon, setCurrentCartoon] = useState<Cartoon | null>(null);
  const [latestCartoonId, setLatestCartoonId] = useState<string | null>(null);
  const [firstCartoonId, setFirstCartoonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevCartoon, setPrevCartoon] = useState<Cartoon | null>(null);
  const [nextCartoon, setNextCartoon] = useState<Cartoon | null>(null);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isFullscreen]);

  const openFullscreen = () => {
    setIsFullscreen(true);
    window.history.pushState({ fullscreenCartoon: true }, '');
  };

  const closeFullscreen = () => {
    window.history.back();
  };

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentCartoon?.id !== latestCartoonId && !loading) {
      handleNext();
    }
    if (isRightSwipe && currentCartoon?.id !== firstCartoonId && !loading) {
      handlePrev();
    }
  };

  // Fetch initial boundary cartoons
  const fetchInitialCartoons = async () => {
    setLoading(true);
    try {
      // Get latest
      const qLatest = query(collection(db, 'cartoons'), orderBy('createdAt', 'desc'), limit(1));
      const snapLatest = await getDocs(qLatest);
      if (!snapLatest.empty) {
        const latestDoc = snapLatest.docs[0];
        setLatestCartoonId(latestDoc.id);
        const cartoonData = { id: latestDoc.id, ...latestDoc.data() } as Cartoon;
        setCurrentCartoon(cartoonData);
      } else {
        setCurrentCartoon(null);
        setLatestCartoonId(null);
      }

      // Get oldest
      const qOldest = query(collection(db, 'cartoons'), orderBy('createdAt', 'asc'), limit(1));
      const snapOldest = await getDocs(qOldest);
      if (!snapOldest.empty) {
        setFirstCartoonId(snapOldest.docs[0].id);
      } else {
        setFirstCartoonId(null);
      }
    } catch (error) {
      console.error("Error fetching cartoons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialCartoons();
  }, []);

  // Preload next and prev cartoons
  useEffect(() => {
    if (!currentCartoon) return;

    const preloadImage = (url: string) => {
      const img = new Image();
      img.src = url;
    };

    const fetchNeighbors = async () => {
      // Fetch Prev
      if (currentCartoon.id !== firstCartoonId) {
        try {
          const qPrev = query(
            collection(db, 'cartoons'), 
            where('createdAt', '<', currentCartoon.createdAt), 
            orderBy('createdAt', 'desc'), 
            limit(1)
          );
          const snapPrev = await getDocs(qPrev);
          if (!snapPrev.empty) {
            const doc = snapPrev.docs[0];
            const cartoon = { id: doc.id, ...doc.data() } as Cartoon;
            setPrevCartoon(cartoon);
            preloadImage(cartoon.imageUrl);
          } else {
            setPrevCartoon(null);
          }
        } catch (error) {
          console.error("Error prefetching prev:", error);
        }
      } else {
        setPrevCartoon(null);
      }

      // Fetch Next
      if (currentCartoon.id !== latestCartoonId) {
        try {
          const qNext = query(
            collection(db, 'cartoons'), 
            where('createdAt', '>', currentCartoon.createdAt), 
            orderBy('createdAt', 'asc'), 
            limit(1)
          );
          const snapNext = await getDocs(qNext);
          if (!snapNext.empty) {
            const doc = snapNext.docs[0];
            const cartoon = { id: doc.id, ...doc.data() } as Cartoon;
            setNextCartoon(cartoon);
            preloadImage(cartoon.imageUrl);
          } else {
            setNextCartoon(null);
          }
        } catch (error) {
          console.error("Error prefetching next:", error);
        }
      } else {
        setNextCartoon(null);
      }
    };

    fetchNeighbors();
  }, [currentCartoon, firstCartoonId, latestCartoonId]);

  const handlePrev = async () => {
    if (!currentCartoon || currentCartoon.id === firstCartoonId) return;
    
    if (prevCartoon) {
      setCurrentCartoon(prevCartoon);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'cartoons'), 
        where('createdAt', '<', currentCartoon.createdAt), 
        orderBy('createdAt', 'desc'), 
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setCurrentCartoon({ id: doc.id, ...doc.data() } as Cartoon);
      }
    } catch (error) {
      console.error("Error fetching previous cartoon:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!currentCartoon || currentCartoon.id === latestCartoonId) return;
    
    if (nextCartoon) {
      setCurrentCartoon(nextCartoon);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'cartoons'), 
        where('createdAt', '>', currentCartoon.createdAt), 
        orderBy('createdAt', 'asc'), 
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setCurrentCartoon({ id: doc.id, ...doc.data() } as Cartoon);
      }
    } catch (error) {
      console.error("Error fetching next cartoon:", error);
    } finally {
      setLoading(false);
    }
  };

  // Listen to reviews for the current cartoon
  useEffect(() => {
    if (!currentCartoon) return;
    
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    try {
      const qLatest = query(collection(db, 'cartoons'), orderBy('createdAt', 'desc'), limit(1));
      const snapLatest = await getDocs(qLatest);
      let nextEpisodeNumber = 1;
      if (!snapLatest.empty) {
        nextEpisodeNumber = snapLatest.docs[0].data().episodeNumber + 1;
      }

      const fileRef = ref(storage, `cartoons/ep${nextEpisodeNumber}_${Date.now()}_${uploadFile.name}`);
      
      await uploadBytes(fileRef, uploadFile);
      const imageUrl = await getDownloadURL(fileRef);
      
      await addDoc(collection(db, 'cartoons'), {
        imageUrl,
        episodeNumber: nextEpisodeNumber,
        createdAt: serverTimestamp()
      });
      
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh to show the newly uploaded cartoon
      await fetchInitialCartoons();
      alert('Upload complete!');
      setIsAdmin(false); // Optionally close admin mode after upload
    } catch (error) {
      console.error("Error uploading cartoon:", error);
      alert('An error occurred during upload.');
    } finally {
      setUploading(false);
    }
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
      alert('Failed to submit review. Please check Firebase Security Rules.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-container/10 text-primary-container shrink-0">
              <span className="material-symbols-outlined text-[20px]">palette</span>
            </div>
            <div className="flex items-baseline gap-2 truncate">
              <h2 className="text-lg font-extrabold text-on-surface font-headline truncate">상상 그 이상</h2>
              <span className="text-[11px] text-on-surface-variant font-medium shrink-0">
                {currentCartoon ? `Ep. ${currentCartoon.episodeNumber}` : 'New Episodes'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isAdmin && !showAdminLogin && (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
                title="Admin Login"
              >
                <span className="material-symbols-outlined text-xl">settings</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Admin Login Dropdown */}
        {showAdminLogin && !isAdmin && (
          <div className="bg-surface-container-highest p-4 border-b border-outline-variant/30">
            <form onSubmit={handleAdminLogin} className="flex items-center gap-2">
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Admin Password" 
                className="flex-1 px-4 py-2 rounded-xl border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface text-body-md"
                autoFocus
              />
              <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-label-sm">
                Unlock
              </button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="px-4 py-2 bg-surface-variant text-on-surface-variant rounded-xl font-bold text-label-sm">
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Admin Upload Section */}
        {isAdmin && (
          <div className="bg-primary-container/10 p-4 border-b border-primary/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-bold text-primary uppercase tracking-wider">Admin Upload Mode</span>
              <button onClick={() => setIsAdmin(false)} className="text-label-sm text-outline hover:text-on-surface">Exit Admin</button>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="flex-1 text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary/90"
              />
              <button 
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="px-5 py-2 bg-primary text-on-primary rounded-xl font-bold text-label-sm disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Uploading
                  </>
                ) : 'Upload Episode'}
              </button>
            </div>
          </div>
        )}
        
        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-lowest">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : currentCartoon ? (
            <div className="flex flex-col">
              {/* Cartoon Image */}
              <div 
                className="w-full bg-surface-container relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <button 
                  onClick={handlePrev}
                  disabled={currentCartoon.id === firstCartoonId || loading}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors disabled:opacity-0 disabled:pointer-events-none"
                  title="Previous Episode"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>

                <img 
                  src={currentCartoon.imageUrl} 
                  alt={`Episode ${currentCartoon.episodeNumber}`} 
                  className="w-full h-auto object-contain max-h-[70vh] cursor-pointer"
                  draggable={false}
                  onClick={openFullscreen}
                />

                <button 
                  onClick={handleNext}
                  disabled={currentCartoon.id === latestCartoonId || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors disabled:opacity-0 disabled:pointer-events-none"
                  title="Next Episode"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>
              
              {/* Review Input */}
              <div className="p-4 sm:p-6 bg-surface-container-lowest border-b border-outline-variant/30">
                <form onSubmit={handleSubmitReview} className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea 
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="Leave an anonymous review..."
                      className="w-full pl-4 pr-4 py-3 rounded-2xl border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low text-body-md resize-none h-[50px] min-h-[50px] max-h-[120px] custom-scrollbar"
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
                    className="h-[50px] px-5 bg-primary text-on-primary rounded-2xl font-bold text-label-sm hover:bg-primary/90 disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-outline flex items-center justify-center transition-colors"
                  >
                    {submittingReview ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Reviews Section */}
              <div className="p-4 sm:p-6 bg-surface-container-lowest">
                <h3 className="font-title-md text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                  Anonymous Reviews ({reviews.length})
                </h3>
                
                <div className="space-y-3 mb-6">
                  {reviews.length === 0 ? (
                    <p className="text-body-md text-outline italic text-center py-4 bg-surface-container-low rounded-xl">No reviews yet. Be the first to leave one!</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                        <p className="text-body-md text-on-surface break-words whitespace-pre-wrap">{review.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4">image_not_supported</span>
              <h3 className="font-title-md text-on-surface mb-2">No Cartoons Yet</h3>
              <p className="text-body-md text-on-surface-variant">Check back later for new episodes.</p>
            </div>
          )}
        </div>


      </div>

      {isFullscreen && currentCartoon && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300"
        >
          {/* Header with Close Button */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white/80 text-sm font-medium">Ep. {currentCartoon.episodeNumber}</span>
            <button 
              onClick={closeFullscreen}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Image Container with swipe */}
          <div 
            className="flex-1 w-full h-full relative flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
             <button 
               onClick={handlePrev}
               disabled={currentCartoon.id === firstCartoonId || loading}
               className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors disabled:opacity-0 disabled:pointer-events-none z-10"
             >
               <span className="material-symbols-outlined text-3xl">chevron_left</span>
             </button>

             <img 
               src={currentCartoon.imageUrl}
               alt={`Episode ${currentCartoon.episodeNumber}`}
               className="w-full h-full object-contain"
               draggable={false}
             />

             <button 
               onClick={handleNext}
               disabled={currentCartoon.id === latestCartoonId || loading}
               className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors disabled:opacity-0 disabled:pointer-events-none z-10"
             >
               <span className="material-symbols-outlined text-3xl">chevron_right</span>
             </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
