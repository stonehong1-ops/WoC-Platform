'use client';

import '../gallery.css';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  X, 
  Camera, 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Search,
  Check
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { galleryService } from '@/lib/firebase/galleryService';
import { venueService } from '@/lib/firebase/venueService';
import { socialService } from '@/lib/firebase/socialService';
import { eventService } from '@/lib/firebase/eventService';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const GalleryCreateContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{url: string, type: 'image'|'video'}[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingImages, setExistingImages] = useState<{url: string, type: 'image'|'video'}[]>([]);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  // Search States
  const [venueSearch, setVenueSearch] = useState('');
  const [venueResults, setVenueResults] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);

  const [socialSearch, setSocialSearch] = useState('');
  const [socialResults, setSocialResults] = useState<any[]>([]);
  const [selectedSocial, setSelectedSocial] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Load for Edit Mode
  useEffect(() => {
    if (editId) {
      setIsEditMode(true);
      galleryService.getPost(editId).then(post => {
        if (post) {
          if (user && post.authorId !== user.uid) {
            alert('You do not have permission to edit.');
            router.push('/gallery');
            return;
          }
          setCaption(post.caption);
          
          const loadedMedia = post.media.map((url, i) => ({
             url,
             type: post.mediaTypes ? post.mediaTypes[i] : (url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('.webm') || url.toLowerCase().includes('video') ? 'video' : 'image')
          })) as { url: string; type: 'image' | 'video' }[];
          
          setExistingImages(loadedMedia);
          setPreviews(loadedMedia);
          if (post.venueId) setSelectedVenue({ id: post.venueId, name: post.venueName });
          if (post.eventId) setSelectedSocial({ id: post.eventId, name: post.eventName });
        }
      });
    }
  }, [editId, user]);

  // Venue Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (venueSearch.length >= 1) {
        // Try original and capitalized to overcome Firestore case-sensitivity
        const capitalized = venueSearch.charAt(0).toUpperCase() + venueSearch.slice(1);
        const results = await venueService.searchVenues(venueSearch);
        const capResults = await venueService.searchVenues(capitalized);
        
        const combined = [...results, ...capResults];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setVenueResults(unique);
      } else {
        setVenueResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [venueSearch]);

  // Social (Event) Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (socialSearch.length >= 1) {
        const capitalized = socialSearch.charAt(0).toUpperCase() + socialSearch.slice(1);
        
        // Search BOTH events and socials
        const [evResults, evCapResults, socResults, socCapResults] = await Promise.all([
          eventService.searchEvents(socialSearch),
          eventService.searchEvents(capitalized),
          socialService.searchSocials(socialSearch),
          socialService.searchSocials(capitalized)
        ]);
        
        const combined = [...evResults, ...evCapResults, ...socResults, ...socCapResults];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setSocialResults(unique.map(e => ({ id: e.id, name: (e as any).title })));
      } else {
        setSocialResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [socialSearch]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length + existingImages.length > 10) return alert('Maximum 10 files allowed.');

    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
    }));
    setImages([...images, ...files]);
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const previewToRemove = previews[index];
    
    // If it's an existing image (URL)
    const existingIndex = existingImages.findIndex(img => img.url === previewToRemove.url);
    if (existingIndex >= 0) {
      setExistingImages(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // It's a new file. Find its index in the 'images' array.
      // We need to know which of the 'previews' are new files.
      const newImagesStartIndex = existingImages.length;
      const fileIndex = index - newImagesStartIndex;
      if (fileIndex >= 0) {
        setImages(prev => {
          const next = [...prev];
          next.splice(fileIndex, 1);
          return next;
        });
      }
    }

    setPreviews(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handlePost = async () => {
    if (!user) return alert('Please sign in first.');
    if (images.length === 0 && existingImages.length === 0) return alert('At least 1 media file is required.');
    if (!caption.trim()) return alert('Please enter a description.');

    setIsUploading(true);
    setUploadProgress(0);
    try {
      // 1. Upload NEW Images/Videos to Storage
      let totalBytesTransferred = 0;
      let totalBytes = images.reduce((acc, file) => acc + file.size, 0);

      const newMediaData = await Promise.all(
        images.map((file) => {
          return new Promise<{url: string, type: 'image'|'video'}>((resolve, reject) => {
            const storageRef = ref(storage, `gallery/${user.uid}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            let lastTransferred = 0;
            uploadTask.on('state_changed', 
              (snapshot) => {
                const diff = snapshot.bytesTransferred - lastTransferred;
                lastTransferred = snapshot.bytesTransferred;
                totalBytesTransferred += diff;
                const progress = Math.round((totalBytesTransferred / totalBytes) * 100);
                setUploadProgress(progress > 100 ? 100 : progress);
              },
              (error) => reject(error),
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ url, type: file.type.startsWith('video/') ? 'video' : 'image' });
              }
            );
          });
        })
      );

      const finalMediaUrls = [...existingImages.map(img => img.url), ...newMediaData.map(m => m.url)];
      const finalMediaTypes = [...existingImages.map(img => img.type), ...newMediaData.map(m => m.type)];

      if (isEditMode && editId) {
        // Update existing post
        await galleryService.updatePost(editId, {
          media: finalMediaUrls,
          mediaTypes: finalMediaTypes,
          caption: caption,
          venueId: selectedVenue?.id || '',
          venueName: selectedVenue?.name || '',
          eventId: selectedSocial?.id || '',
          eventName: selectedSocial?.name || '',
        });
      } else {
        // Create NEW post
        await galleryService.createPost({
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
          media: finalMediaUrls,
          mediaTypes: finalMediaTypes,
          caption: caption,
          venueId: selectedVenue?.id || '',
          venueName: selectedVenue?.name || '',
          eventId: selectedSocial?.id || '',
          eventName: selectedSocial?.name || '',
        });
      }

      router.push('/gallery');
    } catch (error) {
      console.error(error);
      alert(isEditMode ? '수정 중 오류가 발생했습니다.' : '게시 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white md:bg-black/80 flex justify-center backdrop-blur-sm">
      <div className="gallery-create-container w-full h-full overflow-y-auto bg-white shadow-xl flex flex-col relative">
      {/* Header */}
      <div className="create-header">
        <button onClick={() => router.back()}><ChevronLeft size={24} /></button>
        <span className="create-title">{isEditMode ? 'Edit Post' : 'New Post'}</span>
        <button 
          className="btn-post" 
          onClick={handlePost} 
          disabled={isUploading || (images.length === 0 && existingImages.length === 0)}
        >
          {isUploading ? `${uploadProgress}%` : (isEditMode ? 'Update' : 'Post')}
        </button>
      </div>

      {isUploading && (
        <div className="w-full bg-gray-100 h-1">
          <div className="bg-primary h-1 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}

      {/* Image Upload Area */}
      <div className="upload-section">
        <div className="image-preview-scroll">
          {previews.map((item, idx) => (
            <div key={idx} className="preview-item">
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
              <button className="btn-remove-image" onClick={() => removeImage(idx)}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button className="btn-add-more" onClick={() => fileInputRef.current?.click()}>
            <Camera size={24} />
            <span>Add More</span>
          </button>
        </div>
        <input 
          type="file" 
          multiple 
          accept="image/*,video/*" 
          hidden 
          ref={fileInputRef} 
          onChange={handleImageChange} 
        />
      </div>

      {/* Form Fields */}
      <div className="form-section">
        <textarea 
          className="caption-input" 
          placeholder="Write a caption..." 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {/* Venue Tagging (Real DB Search) */}
        <div className="tag-search-container border-t pt-6">
          <div className="tag-label">
            <MapPin size={18} />
            <span>Place</span>
          </div>
          {selectedVenue ? (
            <div className="selected-tag-chip">
              <span>{selectedVenue.name}</span>
              <button onClick={() => setSelectedVenue(null)}><X size={14} /></button>
            </div>
          ) : (
            <div className="search-input-wrapper">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search venue..." 
                value={venueSearch}
                onChange={(e) => setVenueSearch(e.target.value)}
              />
              {venueResults.length > 0 && (
                <div className="search-results">
                  {venueResults.map(v => (
                    <div key={v.id} className="search-item" onClick={() => {
                      setSelectedVenue(v);
                      setVenueResults([]);
                      setVenueSearch('');
                    }}>
                      <MapPin size={16} className="text-gray-400" />
                      <div>
                        <div className="font-semibold text-sm">{v.name}</div>
                        <div className="text-xs text-gray-400">{v.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Social Tagging (Real DB Search) */}
        <div className="tag-search-container pt-4">
          <div className="tag-label">
            <Calendar size={18} />
            <span>Event / Social</span>
          </div>
          {selectedSocial ? (
            <div className="selected-tag-chip">
              <span>{selectedSocial.name}</span>
              <button onClick={() => setSelectedSocial(null)}><X size={14} /></button>
            </div>
          ) : (
            <div className="search-input-wrapper">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search event or organizer..." 
                value={socialSearch}
                onChange={(e) => setSocialSearch(e.target.value)}
              />
              {socialResults.length > 0 && (
                <div className="search-results">
                  {socialResults.map(s => (
                    <div key={s.id} className="search-item" onClick={() => {
                      setSelectedSocial(s);
                      setSocialResults([]);
                      setSocialSearch('');
                    }}>
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

const GalleryCreatePage = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }>
    <GalleryCreateContent />
  </Suspense>
);

export default GalleryCreatePage;
