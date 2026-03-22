'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export default function CreatePostTrigger() {
  const handleOpen = () => {
    window.dispatchEvent(new CustomEvent('feed:compose:open'));
  };

  return (
    <button 
      onClick={handleOpen}
      className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-accent to-accent-secondary text-white rounded-full shadow-lg shadow-accent/40 flex items-center justify-center active:scale-95 transition-transform z-40"
    >
      <Plus size={32} strokeWidth={2.5} />
    </button>
  );
}
