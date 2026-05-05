'use client';

import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Send } from 'lucide-react';

export default function ComposeOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('feed:compose:open', handleOpen);
    return () => window.removeEventListener('feed:compose:open', handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in">
      <div className="bg-background w-full max-w-lg sm:rounded-3xl border-t sm:border border-glass-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-glass rounded-full transition-colors">
            <X size={24} />
          </button>
          <span className="font-bold text-lg">새 게시물</span>
          <button 
            disabled={!content.trim()}
            className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
            onClick={() => {
              console.log('Sending post:', content);
              setIsOpen(false);
              setContent('');
            }}
          >
            게시
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <textarea
            autoFocus
            className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none h-40 placeholder:text-muted"
            placeholder="무슨 일이 일어나고 있나요?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-glass-border flex items-center justify-between">
          <button className="flex items-center gap-2 text-accent p-2 hover:bg-accent/10 rounded-xl transition-colors">
            <ImageIcon size={20} />
            <span className="text-sm font-semibold">사진 추가</span>
          </button>
          <span className="text-xs text-muted">{content.length}자</span>
        </div>
      </div>
    </div>
  );
}
