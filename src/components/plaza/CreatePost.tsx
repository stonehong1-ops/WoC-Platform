"use client";

import React, { useState } from 'react';
import { plazaService } from '@/lib/firebase/plazaService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import UserAvatar from '@/components/common/UserAvatar';
import UniversalCompose from '@/components/common/UniversalCompose';

interface CreatePostProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePost({ isOpen, onClose, onSuccess }: CreatePostProps) {
  const { user } = useAuth();
  const { location } = useLocation();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{url: string, type: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleSubmit = async () => {
    if (!user || (!content.trim() && mediaFiles.length === 0)) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Track progress for each file
      const fileProgresses = new Array(mediaFiles.length).fill(0);
      
      const uploadPromises = mediaFiles.map((file, idx) => 
        plazaService.uploadMedia(file, (p) => {
          fileProgresses[idx] = p;
          const totalProgress = fileProgresses.reduce((a, b) => a + b, 0) / (mediaFiles.length || 1);
          setUploadProgress(Math.round(totalProgress));
        })
      );
      
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
      setUploadProgress(0);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      setUploadProgress(0);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UniversalCompose
      id="plaza"
      title="Share Story"
      label="New Moment"
      submitLabel="Post Moment"
      submittingLabel={uploadProgress > 0 ? `Posting... ${uploadProgress}%` : "Posting..."}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-6">
        <div className="flex gap-4">
          <UserAvatar 
            photoURL={user?.photoURL} 
            className="w-12 h-12 shrink-0 ring-1 ring-gray-100" 
          />
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

        <div className="flex items-center justify-between pt-4">
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
        </div>
      </div>
    </UniversalCompose>
  );
}
