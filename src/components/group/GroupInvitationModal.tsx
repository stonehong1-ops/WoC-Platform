"use client";

import React, { useState, useEffect } from 'react';
import { PlatformUser } from '@/types/user';
import { userService } from '@/lib/firebase/userService';
import { notificationService } from '@/lib/firebase/notificationService';
import { Group } from '@/types/group';

interface GroupInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  currentUser: { id: string; name: string }; // Current logged in user info
}

const GroupInvitationModal = ({ isOpen, onClose, group, currentUser }: GroupInvitationModalProps) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PlatformUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchKeyword('');
      setSearchResults([]);
      setSelectedUser(null);
      setMessage('');
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchKeyword.trim() || searchKeyword.length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await userService.searchUsers(searchKeyword);
      setSearchResults(results);
    } catch (error) {
      console.error('User search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedUser || !group.id) return;

    setIsSending(true);
    try {
      await notificationService.sendGroupInvitation({
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        targetUserId: selectedUser.id,
        groupId: group.id,
        groupName: group.name
      });
      
      alert(`Invitation sent to ${selectedUser.nickname}.`);
      onClose();
    } catch (error) {
      console.error('Invitation failed:', error);
      alert('Failed to send invitation.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-headline font-bold text-[#242c51]">Invite Member</h2>
            <p className="text-sm text-slate-500 mt-1">Search and invite users to {group.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Box */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              value={searchKeyword}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search by name or email..." 
              className="w-full pl-11 pr-24 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#0057bd]/20 transition-all"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-[#0057bd] text-white text-xs font-bold rounded-xl hover:bg-[#00469b] transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {searchResults.length === 0 && !isSearching ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200">person_search</span>
                <p className="text-sm text-slate-400 mt-2">Enter at least 2 characters to search</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div 
                  key={user.id} 
                  onClick={() => setSelectedUser(user)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    selectedUser?.id === user.id ? 'bg-blue-50 ring-1 ring-[#0057bd]' : 'bg-white border border-slate-100 hover:border-blue-200'
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
                  {selectedUser?.id === user.id && (
                    <span className="material-symbols-outlined text-[#0057bd]">check_circle</span>
                  )}
                </div>
              ))
            )}
          </div>

          {selectedUser && (
            <div className="p-4 bg-[#0057bd]/5 rounded-2xl border border-[#0057bd]/10 space-y-2 animate-in slide-in-from-top-2">
              <p className="text-xs font-bold text-[#0057bd] uppercase tracking-wider">Preview Invitation</p>
              <p className="text-sm text-[#242c51] leading-relaxed">
                <span className="font-bold">"{currentUser.name}님께서 '{group.name}' 그룹에 초대하셨습니다. 승인하시겠습니까?"</span> 메시지가 전송됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSendInvite}
            disabled={!selectedUser || isSending}
            className="px-6 py-2.5 bg-[#0057bd] text-white text-sm font-bold rounded-xl hover:bg-[#00469b] shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center gap-2"
          >
            {isSending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Sending...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                Send Invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInvitationModal;
