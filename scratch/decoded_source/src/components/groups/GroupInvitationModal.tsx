"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlatformUser } from '@/types/user';
import { userService } from '@/lib/firebase/userService';
import { notificationService } from '@/lib/firebase/notificationService';
import { Group } from '@/types/group';
import { useLanguage } from '@/contexts/LanguageContext';
import UserBadge from '@/components/common/UserBadge';

interface GroupInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  currentUser: { id: string; name: string };
  existingMemberIds?: string[];
}

const GroupInvitationModal = ({ isOpen, onClose, group, currentUser, existingMemberIds = [] }: GroupInvitationModalProps) => {
  const { t } = useLanguage();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PlatformUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<PlatformUser[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchKeyword('');
      setSearchResults([]);
      setSelectedUsers([]);
      setSentCount(0);
    }
  }, [isOpen]);

  // Debounced auto-search
  const handleSearchChange = useCallback((value: string) => {
    setSearchKeyword(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.trim().length >= 2) {
      setIsSearching(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await userService.searchUsers(value.trim());
          // Filter out current user and existing members
          const filtered = results.filter(u => 
            u.id !== currentUser.id && !existingMemberIds.includes(u.id)
          );
          setSearchResults(filtered);
        } catch (error) {
          console.error('User search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [currentUser.id, existingMemberIds]);

  const toggleUserSelection = (user: PlatformUser) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) return prev.filter(u => u.id !== user.id);
      return [...prev, user];
    });
  };

  const removeSelected = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0 || !group.id) return;

    setIsSending(true);
    setSentCount(0);
    
    try {
      for (const user of selectedUsers) {
        await notificationService.sendGroupInvitation({
          fromUserId: currentUser.id,
          fromUserName: currentUser.name,
          targetUserId: user.id,
          groupId: group.id,
          groupName: group.name
        });
        setSentCount(prev => prev + 1);
      }
      
      alert(`Successfully sent ${selectedUsers.length} invitation(s)!`);
      onClose();
    } catch (error) {
      console.error('Invitation failed:', error);
      alert('Failed to send some invitations. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const isAlreadyMember = (userId: string) => existingMemberIds.includes(userId);
  const isSelected = (userId: string) => selectedUsers.some(u => u.id === userId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-headline font-bold text-[#242c51]">Invite New Member</h2>
            <p className="text-sm text-slate-500 mt-1">Search and invite people to <span className="font-semibold text-[#0057bd]">{group.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
              {selectedUsers.map(user => (
                <div key={user.id} className="flex items-center gap-1.5 pl-1 pr-2 py-1 bg-[#0057bd]/10 rounded-full text-sm">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
                    </div>
                  )}
                  <span className="font-medium text-[#242c51] text-xs">{user.nickname}</span>
                  <button 
                    onClick={() => removeSelected(user.id)}
                    className="w-4 h-4 rounded-full bg-slate-300 hover:bg-red-400 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-white text-[10px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              value={searchKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by nickname or email..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#0057bd]/20 transition-all"
              autoFocus
            />
            {searchKeyword && (
              <button 
                onClick={() => { setSearchKeyword(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500 text-[14px]">close</span>
              </button>
            )}
          </div>

          {/* Results Area */}
          <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
            {isSearching ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0057bd] rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-slate-400">Searching...</p>
              </div>
            ) : searchResults.length === 0 && searchKeyword.trim().length >= 2 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200">person_off</span>
                <p className="text-sm text-slate-400 mt-2">No users found for "{searchKeyword}"</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200">person_search</span>
                <p className="text-sm text-slate-400 mt-2">Type at least 2 characters to search</p>
              </div>
            ) : (
              searchResults.map((user) => {
                const alreadyMember = isAlreadyMember(user.id);
                const selected = isSelected(user.id);

                return (
                  <div 
                    key={user.id} 
                    onClick={() => !alreadyMember && toggleUserSelection(user)}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                      alreadyMember 
                        ? 'bg-slate-50 opacity-50 cursor-not-allowed' 
                        : selected 
                          ? 'bg-blue-50 ring-1 ring-[#0057bd] cursor-pointer' 
                          : 'bg-white border border-slate-100 hover:border-blue-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.nickname} 
                          className="w-10 h-10 rounded-full object-cover bg-slate-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-400">person</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-baseline gap-1">
                          <p className="font-bold text-[#242c51] text-sm">{user.nickname}</p>
                          {user.nativeNickname && <span className="text-xs font-medium text-slate-500">({user.nativeNickname})</span>}
                        </div>
                        <p className="text-xs text-slate-500">{user.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {alreadyMember ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-lg">Member</span>
                      ) : selected ? (
                        <span className="material-symbols-outlined text-[#0057bd]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-slate-300">radio_button_unchecked</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Invitation Preview */}
          {selectedUsers.length > 0 && (
            <div className="p-4 bg-[#0057bd]/5 rounded-2xl border border-[#0057bd]/10 space-y-2 animate-in slide-in-from-top-2">
              <p className="text-xs font-bold text-[#0057bd] uppercase tracking-wider">Invitation Preview</p>
              <p className="text-sm text-[#242c51] leading-relaxed">
                <span className="font-semibold">{currentUser.name}</span> invited you to the <span className="font-semibold">'{group.name}'</span> group. Would you like to join?
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 flex items-center justify-between shrink-0 border-t border-slate-100">
          <div className="text-sm text-slate-500">
            {selectedUsers.length > 0 && (
              <span className="font-bold text-[#0057bd]">{selectedUsers.length}</span>
            )}
            {selectedUsers.length > 0 && ' selected'}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSendInvites}
              disabled={selectedUsers.length === 0 || isSending}
              className="px-6 py-2.5 bg-[#0057bd] text-white text-sm font-bold rounded-xl hover:bg-[#00469b] shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending ({sentCount}/{selectedUsers.length})
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Send Invite{selectedUsers.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInvitationModal;
