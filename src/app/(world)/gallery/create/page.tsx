'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../gallery.css';

const GalleryCreatePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Search States
  const [venueSearch, setVenueSearch] = useState('');
  const [venueResults, setVenueResults] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);

  const [socialSearch, setSocialSearch] = useState('');
  const [socialResults, setSocialResults] = useState<any[]>([]);
  const [selectedSocial, setSelectedSocial] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (files.length + images.length > 10) return alert('Maximum 10 images allowed.');

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...files]);
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handlePost = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    if (images.length === 0) return alert('최소 1장의 사진이 필요합니다.');
    if (!caption.trim()) return alert('설명을 입력해주세요.');

    setIsUploading(true);
    try {
      // 1. Upload Images to Storage
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const storageRef = ref(storage, `gallery/${user.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          return await getDownloadURL(snapshot.ref);
        })
      );

      // 2. Save to Firestore
      await galleryService.createPost({
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        media: imageUrls,
        caption: caption,
        venueId: selectedVenue?.id || '',
        venueName: selectedVenue?.name || '',
        eventId: selectedSocial?.id || '',
        eventName: selectedSocial?.name || '',
      });

      router.push('/gallery');
    } catch (error) {
      console.error(error);
      alert('게시 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="gallery-create-container">
      {/* Header */}
      <div className="create-header">
        <button onClick={() => router.back()}><ChevronLeft size={24} /></button>
        <span className="create-title">New Post</span>
        <button 
          className="btn-post" 
          onClick={handlePost} 
          disabled={isUploading || images.length === 0}
        >
          {isUploading ? 'Posting...' : 'Post'}
        </button>
      </div>

      {/* Image Upload Area */}
      <div className="upload-section">
        <div className="image-preview-scroll">
          {previews.map((src, idx) => (
            <div key={idx} className="preview-item">
              <img src={src} alt="" />
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
          accept="image/*" 
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
  );
};

export default GalleryCreatePage;
