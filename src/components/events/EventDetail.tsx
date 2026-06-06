'use client';

import React, { useState } from 'react';
import { Event } from '@/types/event';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { Timestamp } from 'firebase/firestore';
import UserProfileClickable from '@/components/common/UserProfileClickable';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';

interface EventDetailProps {
  event: Event;
  onClose: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
}

const getNormalizedDate = (val: any): Date => {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  try { return new Date(val); } catch { return new Date(); }
};

export default function EventDetail({ event, onClose, onEdit, onDelete }: EventDetailProps) {
  const { user } = useAuth();
  const { formatDate, language } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { setGlobalNavHidden } = useNavigation();

  React.useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);
  
  const isHost = user?.uid === event.hostId;
  const startDate = getNormalizedDate(event.startDate);
  const endDate = event.endDate ? getNormalizedDate(event.endDate) : startDate;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(event.id);
      onDelete?.(event.id);
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
      <div className="relative bg-white w-full max-w-xl mx-auto flex flex-col flex-1 overflow-hidden">
        {/* Floating Header */}
        <div className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent pointer-events-none'}`}>
          <div className="flex-1 flex justify-start pointer-events-auto">
            <button 
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isScrolled ? 'bg-gray-100 hover:bg-gray-200 text-[#2d3435]' : 'bg-black/40 hover:bg-black/60 backdrop-blur-md text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div className={`flex-[2] flex justify-center items-center transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
             <span className="text-[15px] font-bold text-[#2d3435] tracking-tight truncate max-w-[200px]">
               {language === 'KR' && event.titleNative ? event.titleNative : event.title}
             </span>
          </div>

          <div className="flex-1 flex justify-end gap-2 pointer-events-auto">
             <button 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isScrolled ? 'bg-gray-100 hover:bg-gray-200 text-[#2d3435]' : 'bg-black/40 hover:bg-black/60 backdrop-blur-md text-white'}`}
            >
              <span className="material-symbols-rounded text-[20px]">share</span>
            </button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-[100px]"
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 50)}
        >
          {/* Cover Image (4/5 aspect ratio) */}
          <div className="w-full aspect-[4/5] bg-gray-100 relative select-none">
            <img 
              src={event.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000"} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for better contrast */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
              <div>
                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                  {event.category}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5">
            {/* Title & Stats */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-[#2d3435] font-headline leading-tight mb-1">
                {language === 'KR' && event.titleNative ? event.titleNative : event.title}
              </h1>
              {event.titleNative && language !== 'KR' && (
                <p className="text-[13px] text-gray-500 font-bold">{event.titleNative}</p>
              )}
            </div>

            {/* Host Info */}
            <div className="mb-6 pb-6 border-b border-[#f2f4f4]">
              <UserProfileClickable 
                uid={event.hostId} 
                initialData={{ nickname: event.hostName, nativeNickname: event.hostNameNative, photoURL: event.hostPhoto }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <UserAvatar photoURL={event.hostPhoto} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200" />
                <div className="flex flex-col text-left">
                  <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1">Hosted by</p>
                  <UserName nickname={event.hostName} nativeNickname={event.hostNameNative} className="text-[14px] font-bold text-[#2d3435]" nativeClassName="text-[11px] font-medium text-gray-400 ml-1.5" />
                </div>
              </UserProfileClickable>
            </div>

            {/* Date & Location Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#f8f9fa] p-4 rounded-2xl flex flex-col gap-2 border border-[#f2f4f4]">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <div>
                  <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-1">Start</p>
                  <p className="text-xs font-bold text-[#2d3435]">{formatDate(startDate, 'dateOnly')}</p>
                  {event.endDate && startDate.getTime() !== endDate.getTime() && (
                    <div className="mt-2 pt-2 border-t border-[#f2f4f4]">
                      <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-1">End</p>
                      <p className="text-xs font-bold text-[#2d3435]">{formatDate(endDate, 'dateOnly')}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#f8f9fa] p-4 rounded-2xl flex flex-col gap-2 border border-[#f2f4f4]">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-1">Location</p>
                  <p className="text-xs font-bold text-[#2d3435] line-clamp-3">
                    {event.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <h4 className="text-[12px] font-black text-[#2d3435] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-rounded text-[18px] text-primary">info</span>
                  About the Event
                </h4>
                <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-[#f2f4f4]">
                  <p className="text-[13px] text-[#596061] font-medium leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}
            
            {/* Action Buttons for Host */}
            {isHost && (
              <div className="flex gap-3 pt-6 border-t border-[#f2f4f4]">
                <button 
                  onClick={() => onEdit?.(event)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-bold text-[13px] transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit Event
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold text-[13px] transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Bottom Bar (Action Hub Style) */}
        {!isHost && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#f2f4f4] p-4 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 pb-safe">
            <button className="flex-1 py-3.5 bg-primary hover:bg-[#004190] text-white rounded-2xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
              <span className="material-symbols-rounded text-[20px]">how_to_reg</span>
              Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
