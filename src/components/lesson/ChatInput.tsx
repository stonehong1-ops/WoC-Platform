'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: 'photo' | 'video' }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).slice(0, 5 - files.length);
    const newPreviews = newFiles.map(f => ({
      url: URL.createObjectURL(f),
      type: (f.type.startsWith('video/') ? 'video' : 'photo') as 'photo' | 'video',
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [files.length]);

  const removeFile = useCallback((index: number) => {
    URL.revokeObjectURL(previews[index].url);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }, [previews]);

  const handleSend = useCallback(() => {
    if (disabled) return;
    if (!text.trim() && files.length === 0) return;
    onSend(text.trim(), files);
    setText('');
    setFiles([]);
    previews.forEach(p => URL.revokeObjectURL(p.url));
    setPreviews([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, files, previews, onSend, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const autoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div className="bg-white border-t border-slate-100 px-3 py-2 safe-area-bottom">
      {/* File previews */}
      {previews.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
          {previews.map((p, i) => (
            <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
              {p.type === 'video' ? (
                <video src={p.url} className="w-full h-full object-cover" />
              ) : (
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold"
              >
                ✕
              </button>
              {p.type === 'video' && (
                <div className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                  <span className="material-symbols-outlined text-[10px]">videocam</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= 5}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || t('lesson.chat_placeholder')}
          rows={1}
          className="flex-1 resize-none rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 disabled:opacity-50 max-h-[120px]"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && files.length === 0)}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-[#007AFF] flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-40 disabled:bg-slate-300"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </div>
  );
}
