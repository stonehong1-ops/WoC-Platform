'use client';

import React, { useState, useRef } from 'react';
import { communityService } from '@/lib/firebase/communityService';
import { storageService } from '@/lib/firebase/storageService';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePostProps {
  communityId: string;
  onSuccess?: () => void;
}

export default function CreatePost({ communityId, onSuccess }: CreatePostProps) {
  const { user, profile, setShowLogin } = useAuth();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'video' | 'question' | 'event' | 'info'>('text');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!content.trim() && !image) return;

    setIsUploading(true);
    try {
      let imageUrl = '';
      if (image) {
        const path = `communities/${communityId}/posts/${Date.now()}_${image.name}`;
        imageUrl = await storageService.uploadFile(image, path, (progress) => {
          setUploadProgress(progress);
        });
      }

      await communityService.createPost(communityId, {
        content,
        type: image ? 'image' : type,
        image: imageUrl || undefined,
        author: {
          id: user.uid,
          name: profile?.nickname || user.displayName || 'Anonymous',
          avatar: profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          role: profile?.isInstructor ? 'Instructor' : 'Curator'
        },
        likes: 0,
        comments: 0
      });

      // Clear form
      setContent('');
      setImage(null);
      setImagePreview(null);
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to upload image. Please check your storage rules.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 shadow-xl border border-outline-variant/10">
      {!isOpen ? (
        <div 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-4 cursor-pointer group"
        >
          <img 
            src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} 
            className="w-12 h-12 rounded-2xl object-cover shadow-md" 
            alt="User" 
          />
          <div className="flex-1 h-12 bg-surface-container-low rounded-2xl flex items-center px-6 text-on-surface-variant font-bold group-hover:bg-surface-container-high transition-colors">
            Share your thoughts in this space...
          </div>
          <button className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
             <div className="flex gap-2">
                {(['text', 'question', 'info', 'event'] as const).map((t) => (
                  <button 
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
                      ${type === t 
                        ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' 
                        : 'bg-surface text-on-surface-variant border-outline-variant/20 hover:border-primary/40'}
                    `}
                  >
                    {t}
                  </button>
                ))}
             </div>
             <button 
              onClick={() => setIsOpen(false)}
              className="text-on-surface-variant/40 hover:text-on-surface"
             >
                <span className="material-symbols-outlined">close</span>
             </button>
          </div>

          <textarea 
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === 'question' ? 'What do you want to ask?' : 'What is on your mind?'}
            className="w-full bg-transparent border-none focus:ring-0 text-xl font-bold text-on-surface placeholder:text-on-surface-variant/30 min-h-[120px] resize-none"
          />

          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative rounded-3xl overflow-hidden group aspect-video bg-black"
              >
                <img src={imagePreview} className="w-full h-full object-contain" alt="Preview" />
                <button 
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-primary transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined">image</span>
              </button>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*"
                onChange={handleImageChange}
              />
              <button className="w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-primary transition-all flex items-center justify-center">
                <span className="material-symbols-outlined">attachment</span>
              </button>
            </div>

            <button 
              disabled={isUploading || (!content.trim() && !image)}
              onClick={handleSubmit}
              className="px-8 h-12 rounded-[1.5rem] bg-primary text-on-primary font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span> Post
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
