'use client';

import React, { useState } from 'react';
import { Event } from '@/types/event';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import UserProfileClickable from '@/components/common/UserProfileClickable';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';

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
  const [isDeleting, setIsDeleting] = useState(false);
  
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
        {/* Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 font-manrope">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">{event.category}</span>
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">Event Details</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-8">
          {/* Cover Image */}
          <div className="w-full aspect-[4/3] bg-gray-100 relative">
            <img 
              src={event.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000"} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8 space-y-8">
            {/* Title & Host */}
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-tight mb-2">{event.title}</h2>
              {event.titleNative && (
                <p className="text-gray-500 font-bold mb-4">{event.titleNative}</p>
              )}
              <div className={`flex items-center gap-3 ${!event.titleNative ? 'mt-4' : ''}`}>
                <UserProfileClickable 
                  uid={event.hostId} 
                  initialData={{ nickname: event.hostName, nativeNickname: event.hostNameNative, photoURL: event.hostPhoto }}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <UserAvatar photoURL={event.hostPhoto} className="w-10 h-10 rounded-full bg-gray-100 ring-2 ring-white shadow-sm" />
                  <div className="flex flex-col text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hosted by</p>
                    <UserName nickname={event.hostName} nativeNickname={event.hostNameNative} className="text-sm font-bold text-gray-900" nativeClassName="text-[10px] font-medium text-gray-500 ml-1" />
                  </div>
                </UserProfileClickable>
              </div>
            </div>

            {/* Date & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Start</p>
                  <p className="text-xs font-bold text-gray-900">{format(startDate, 'MMM dd, yyyy')}</p>
                  {event.endDate && startDate.getTime() !== endDate.getTime() && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">End</p>
                      <p className="text-xs font-bold text-gray-900">{format(endDate, 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <p className="text-xs font-bold text-gray-900 line-clamp-2 flex items-center gap-1.5">
                    {(() => {
                      if (!event.location) return null;
                      const countryName = event.location.split(',').pop()?.trim() || '';
                      if (!countryName) return null;
                      const codeMapping: Record<string, string> = {
                        'korea': 'kr', 'south korea': 'kr', 'korea, republic of': 'kr', '대한민국': 'kr', '한국': 'kr',
                        'japan': 'jp', '일본': 'jp',
                        'china': 'cn', '중국': 'cn',
                        'taiwan': 'tw', '대만': 'tw',
                        'hong kong': 'hk', '홍콩': 'hk',
                        'united states': 'us', 'usa': 'us', 'us': 'us', '미국': 'us',
                        'argentina': 'ar', '아르헨티나': 'ar',
                        'singapore': 'sg', '싱가포르': 'sg',
                        'uk': 'gb', 'united kingdom': 'gb', 'england': 'gb', '영국': 'gb',
                        'france': 'fr', '프랑스': 'fr',
                        'germany': 'de', '독일': 'de',
                        'italy': 'it', '이탈리아': 'it',
                        'spain': 'es', '스페인': 'es',
                        'australia': 'au', '호주': 'au',
                        'canada': 'ca', '캐나다': 'ca',
                        'brazil': 'br', '브라질': 'br',
                        'mexico': 'mx', '멕시코': 'mx',
                        'vietnam': 'vn', '베트남': 'vn',
                        'thailand': 'th', '태국': 'th',
                        'indonesia': 'id', '인도네시아': 'id',
                        'malaysia': 'my', '말레이시아': 'my',
                        'philippines': 'ph', '필리핀': 'ph',
                      };
                      const code = codeMapping[countryName.toLowerCase().trim()];
                      if (code) {
                        return <img src={`https://flagcdn.com/16x12/${code}.png`} alt="flag" className="inline-block w-4 h-3 object-cover rounded-sm shadow-sm" />;
                      }
                      return null;
                    })()}
                    {event.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">About the Event</h4>
                <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
            
            {/* Action Buttons for Host */}
            {isHost && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => onEdit?.(event)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
