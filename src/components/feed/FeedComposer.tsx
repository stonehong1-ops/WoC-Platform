'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X, Send, Loader2 } from 'lucide-react';
import { feedService } from '@/lib/firebase/feedService';

interface FeedComposerProps {
  onPost: (content: string, images: string[]) => Promise<any>;
  currentUser: any;
  placeholder?: string;
}

export default function FeedComposer({ onPost, currentUser, placeholder }: FeedComposerProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => feedService.uploadMedia(file, 'feeds'));
      const urls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...urls]);
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;
    
    setIsPosting(true);
    try {
      await onPost(content, images);
      setContent('');
      setImages([]);
    } catch (error) {
      console.error("Posting failed:", error);
      alert("게시글 작성에 실패했습니다.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm p-4 sm:p-6 flex gap-4 items-start border border-outline-variant/10 mb-8">
      <img 
        alt={currentUser?.displayName || "User"} 
        className="w-12 h-12 rounded-full object-cover shrink-0 border border-outline-variant/10" 
        src={currentUser?.photoURL || "https://lh3.googleusercontent.com/a/default-user"} 
      />
      <div className="flex-1 flex flex-col gap-3">
        <textarea 
          className="w-full bg-surface resize-none rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border-none placeholder-on-surface-variant/50 transition-all min-h-[100px]" 
          placeholder={placeholder || "Share your latest moves or thoughts..."} 
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        
        {/* Image Preview Area - Keep design consistent even when images are added */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {images.map((url, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                <img src={url} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || images.length >= 4}
              className="text-on-surface-variant hover:text-primary hover:bg-primary/5 p-2 rounded-full transition-colors disabled:opacity-30"
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <span className="material-symbols-outlined !text-[22px]">image</span>
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
            <button type="button" className="text-on-surface-variant hover:text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined !text-[22px]">videocam</span>
            </button>
            <button type="button" className="text-on-surface-variant hover:text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined !text-[22px]">location_on</span>
            </button>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isPosting || isUploading || (!content.trim() && images.length === 0)}
            className="bg-primary text-on-primary font-label text-[11px] font-bold uppercase tracking-wider px-6 py-2 rounded-full shadow-md shadow-primary/20 hover:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </section>
  );
}
