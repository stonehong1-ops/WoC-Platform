"use client";

import React, { useState } from 'react';
import { plazaService } from '@/lib/firebase/plazaService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePost({ isOpen, onClose }: CreatePostProps) {
  const { user } = useAuth();
  const { location } = useLocation();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{url: string, type: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 배경 스크롤 차단
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...mediaFiles, ...files];
      setMediaFiles(newFiles);
      
      const newPreviews = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setMediaPreviews([...mediaPreviews, ...newPreviews]);
    }
  };

  const removeMedia = (index: number) => {
    const updatedFiles = [...mediaFiles];
    updatedFiles.splice(index, 1);
    setMediaFiles(updatedFiles);

    const updatedPreviews = [...mediaPreviews];
    URL.revokeObjectURL(updatedPreviews[index].url);
    updatedPreviews.splice(index, 1);
    setMediaPreviews(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!content.trim() && mediaFiles.length === 0)) return;

    setIsSubmitting(true);
    try {
      const uploadPromises = mediaFiles.map(file => plazaService.uploadMedia(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      await plazaService.createPost({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL || '',
        content: content.trim(),
        images: uploadedUrls,
        location: `${(location?.city || 'Globe').toUpperCase()}, ${(location?.country || '').toUpperCase()}`,
      });
      
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 font-manrope">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">New Moment</span>
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">Share Story</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-100">
              <img src={user?.photoURL || "https://lh3.googleusercontent.com/a/default-user"} alt="profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="w-full min-h-[140px] text-[15px] font-medium border-none focus:ring-0 placeholder:text-gray-300 resize-none p-0"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Multiple Media Preview */}
          {mediaPreviews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative flex-shrink-0 w-48 aspect-[4/5] rounded-[24px] overflow-hidden bg-gray-50 group">
                  {preview.type.startsWith('video') ? (
                    <video src={preview.url} className="w-full h-full object-cover" controls={false} muted autoPlay loop />
                  ) : (
                    <img src={preview.url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                  )}
                  <button 
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-all shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-48 aspect-[4/5] rounded-[24px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
              >
                <span className="material-symbols-outlined text-3xl">add</span>
                <span className="text-[11px] font-black uppercase tracking-widest">Add more</span>
              </button>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            multiple
            className="hidden"
          />

          <div className="flex items-center justify-between pt-4 sticky bottom-0 bg-white">
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full transition-colors ${mediaFiles.length > 0 ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-primary hover:bg-primary/5'}`}
              >
                <span className="material-symbols-outlined">image</span>
              </button>
              <button type="button" className="p-2 text-gray-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">location_on</span>
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all shadow-lg ${
                (content.trim() || mediaFiles.length > 0)
                ? 'bg-[#0061ff] text-white shadow-[#0061ff]/20 hover:scale-105 active:scale-95' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Posting...' : 'Post Moment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
