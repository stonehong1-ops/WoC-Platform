'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupService } from '@/lib/firebase/groupService';
import { storageService } from '@/lib/firebase/storageService';
import { useAuth } from '@/components/providers/AuthProvider';
import { Group, Post, GroupBoard as GroupBoardType, DEFAULT_BOARDS } from '@/types/group';

interface PostEditorModalProps {
  group: Group;
  post?: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostEditorModal({ group, post, isOpen, onClose }: PostEditorModalProps) {
  const { user, profile, setShowLogin } = useAuth();
  const boards = (group.boards && group.boards.length > 0) ? group.boards : DEFAULT_BOARDS;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(boards[0]?.id || 'notice');
  const [bgTheme, setBgTheme] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [type, setType] = useState<Post['type']>('text');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const themes = [
    { id: 'blue-gradient', class: 'bg-gradient-to-br from-[#60a5fa] to-[#3b82f6]' },
    { id: 'purple-gradient', class: 'bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6]' },
    { id: 'pink-gradient', class: 'bg-gradient-to-br from-[#f472b6] to-[#ec4899]' },
    { id: 'orange-gradient', class: 'bg-gradient-to-br from-[#fb923c] to-[#f97316]' },
    { id: 'green-gradient', class: 'bg-gradient-to-br from-[#4ade80] to-[#22c55e]' },
    { id: 'dark-gradient', class: 'bg-gradient-to-br from-[#475569] to-[#1e293b]' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!post;

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content);
      setCategory(post.category || boards[0]?.id || 'notice');
      setType(post.type);
      setMediaPreview(post.image || post.video || null);
      setBgTheme(post.bgTheme || null);
    } else {
      setTitle('');
      setContent('');
      setCategory(boards[0]?.id || 'notice');
      setType('text');
      setMediaPreview(null);
      setBgTheme(null);
    }
  }, [post, boards]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setBgTheme(null); // 테마 해제
      const isVideo = file.type.startsWith('video/');
      setType(isVideo ? 'video' : 'image');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTheme = (themeId: string) => {
    if (bgTheme === themeId) {
      setBgTheme(null);
      setType('text');
    } else {
      setBgTheme(themeId);
      setType('text-card');
      setMediaPreview(null); // 이미지 제거
      setMediaFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!content.trim()) {
      alert('Content is required');
      return;
    }

    setIsUploading(true);
    try {
      let mediaUrl = mediaPreview || '';
      
      if (mediaFile) {
        const path = `groups/${group.id}/posts/${Date.now()}_${mediaFile.name}`;
        mediaUrl = await storageService.uploadFile(mediaFile, path, (progress) => {
          setUploadProgress(progress);
        });
      }

      const postData: Partial<Post> = {
        title,
        content,
        category,
        type,
        bgTheme: bgTheme || undefined,
        [type === 'video' ? 'video' : 'image']: mediaUrl,
        author: {
          id: user.uid,
          name: profile?.nickname || user.displayName || 'Anonymous',
          avatar: profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          role: profile?.isInstructor ? 'Instructor' : 'Curator'
        }
      };

      if (isEditing && post) {
        await groupService.updatePost(group.id, post.id, postData);
      } else {
        await groupService.createPost(group.id, postData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Failed to save post. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[#f7f5ff] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-[#a3abd7]/10">
            <div className="flex items-center gap-4">
               <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
               >
                  <span className="material-symbols-outlined text-[#515981]">close</span>
               </button>
               <h2 className="text-xl font-headline font-black text-[#242c51]">
                 {isEditing ? 'Edit Post' : 'Create New Post'}
               </h2>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={isUploading}
              className="px-6 py-2.5 bg-primary text-on-primary font-black rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isUploading ? `${Math.round(uploadProgress)}%` : (isEditing ? 'Save' : 'Post')}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
            <div className="space-y-8">
              {/* Category & Type Selectors */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#515981] mb-2 px-1">Board Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold text-[#242c51] shadow-sm ring-1 ring-[#a3abd7]/10 focus:ring-2 focus:ring-primary outline-none"
                  >
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>{board.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#515981] mb-2 px-1">Title (Optional)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a title..."
                  className="w-full bg-white border-none rounded-2xl px-6 py-4 text-lg font-headline font-bold text-[#242c51] shadow-sm ring-1 ring-[#a3abd7]/10 focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-300"
                />
              </div>

              {/* Body */}
              <div className="relative">
                <div className={`relative w-full rounded-[2rem] shadow-sm ring-1 ring-[#a3abd7]/10 overflow-hidden min-h-[250px] ${bgTheme ? themes.find(t => t.id === bgTheme)?.class : 'bg-white'}`}>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's happening in the community?"
                    className={`w-full h-full bg-transparent border-none px-8 py-8 text-lg font-medium outline-none placeholder:text-slate-300 min-h-[250px] resize-none transition-all duration-500 ${bgTheme ? 'text-white text-center flex items-center justify-center placeholder:text-white/50' : 'text-[#242c51]'}`}
                    style={bgTheme ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
                  />
                </div>
                
                {/* Media Preview inside textarea overlay or below */}
                {mediaPreview && (
                  <div className="mt-4 relative rounded-3xl overflow-hidden aspect-video bg-black group">
                    {type === 'video' ? (
                      <video src={mediaPreview} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={mediaPreview} className="w-full h-full object-contain" alt="Preview" />
                    )}
                    <button 
                      onClick={() => { setMediaPreview(null); setMediaFile(null); setType('text'); }}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar Tools */}
          <div className="px-8 py-6 bg-white border-t border-[#a3abd7]/10 flex flex-col gap-4">
             {showThemePicker && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar"
               >
                 {themes.map((theme) => (
                   <button
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id)}
                    className={`w-10 h-10 rounded-full flex-shrink-0 border-2 transition-all ${theme.class} ${bgTheme === theme.id ? 'border-primary scale-110' : 'border-transparent'}`}
                   />
                 ))}
                 <button
                  onClick={() => { setBgTheme(null); setType('text'); }}
                  className="w-10 h-10 rounded-full flex-shrink-0 bg-slate-100 border-2 border-transparent flex items-center justify-center"
                 >
                   <span className="material-symbols-outlined text-slate-400 text-sm">block</span>
                 </button>
               </motion.div>
             )}

             <div className="flex items-center gap-4">
               <button 
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowThemePicker(false);
                }}
                className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-sm ${mediaPreview ? 'bg-primary text-white' : 'bg-[#efefff] text-primary hover:bg-primary hover:text-white'}`}
               >
                  <span className="material-symbols-outlined">image</span>
               </button>
               <button 
                onClick={() => setShowThemePicker(!showThemePicker)}
                className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-sm ${bgTheme ? 'bg-primary text-white' : 'bg-[#efefff] text-[#515981] hover:bg-slate-200'}`}
               >
                  <span className="material-symbols-outlined">title</span>
               </button>
               
               <input 
                 type="file" 
                 hidden 
                 ref={fileInputRef} 
                 accept="image/*,video/*"
                 onChange={handleFileChange}
               />
               
               <div className="ml-auto text-xs font-bold text-[#515981]/40">
                 {content.length} characters
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
