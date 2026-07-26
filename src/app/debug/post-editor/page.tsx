'use client';

import React, { useState, useEffect } from 'react';
import PostEditorModal from '@/components/groups/PostEditorModal';
import { Group } from '@/types/group';

const DUMMY_GROUP: Group = {
  id: 'woc_official',
  name: 'World of Community',
  nativeName: '글로벌 커뮤니티',
  description: 'WoC Official Group',
  ownerId: 'admin_test',
  members: [],
  selectedFunctions: ['feed', 'notice', 'calendar', 'live'],
  headerThemeColor: '#0057bd',
  coverImage: '',
  memberCount: 1,
  posts: []
};

export default function DebugPostEditorPage() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    console.log('🔴 [DEBUG_PAGE] DebugPostEditorPage Mounted');
    const handleErr = (e: ErrorEvent) => console.error('💥 [DEBUG_PAGE] window.onerror:', e);
    const handleRej = (e: PromiseRejectionEvent) => console.error('💥 [DEBUG_PAGE] unhandledrejection:', e.reason);
    window.addEventListener('error', handleErr);
    window.addEventListener('unhandledrejection', handleRej);
    return () => {
      console.log('🔴 [DEBUG_PAGE] DebugPostEditorPage Unmounted');
      window.removeEventListener('error', handleErr);
      window.removeEventListener('unhandledrejection', handleRej);
    };
  }, []);

  return (
    <div className="p-8 min-h-screen bg-slate-900 text-white">
      <h1 className="text-xl font-bold mb-4">PostEditorModal Standalone Debug Page</h1>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold mb-4"
      >
        Re-Open Modal
      </button>

      <PostEditorModal
        group={DUMMY_GROUP}
        isOpen={isOpen}
        defaultPostType="feed"
        onClose={() => {
          console.trace('🔴 [DEBUG_PAGE] onClose CALLED VIA TRACE');
          setIsOpen(false);
        }}
      />
    </div>
  );
}
