'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { RentalSpace } from '@/types/rental';

interface RentalRequestFlowProps {
  space: RentalSpace;
  onClose: () => void;
  onSuccess: (chatRoomId?: string) => void;
}

export default function RentalRequestFlow({ space, onClose, onSuccess }: RentalRequestFlowProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [headcount, setHeadcount] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!user) return alert('Login is required.');
    if (user.uid === space.hostId) return alert('You cannot inquire about your own space.');
    if (!date || !startTime || !endTime || !headcount || !purpose) return alert('Please fill in all required fields (Date, Time, People, Purpose).');

    setIsSubmitting(true);
    try {
      const result = await rentalService.createRequest({
        spaceId: space.id,
        hostId: space.hostId,
        guestId: user.uid,
        date,
        startTime,
        endTime,
        headcount: Number(headcount),
        purpose,
        message
      });
      
      alert('Your rental inquiry has been sent to the host. Moving to chat room.');
      onSuccess(result.chatRoomId);
    } catch (err) {
      console.error(err);
      alert('An error occurred during processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#e0e4e5]" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black text-[#2d3435]">Reservation Request</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center">
            <span className="material-symbols-rounded text-sm text-[#596061]">close</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* Space Info Summary */}
          <div className="flex gap-3 p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5] mb-2">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
              {space.images?.[0] && (
                <img src={space.images[0]} alt={space.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-bold text-[#2d3435] truncate">{space.title}</p>
              <p className="text-xs font-bold text-primary mt-1">₩{(space.pricePerHour || 0).toLocaleString()} <span className="text-[10px] text-[#acb3b4] font-normal">/ hr</span></p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Desired Date <span className="text-red-400">*</span></p>
            <input required type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Start Time <span className="text-red-400">*</span></p>
              <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">End Time <span className="text-red-400">*</span></p>
              <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Number of People <span className="text-red-400">*</span></p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setHeadcount(Math.max(1, (Number(headcount) || 1) - 1))}
                className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90 transition-transform">
                <span className="material-symbols-rounded text-lg">remove</span>
              </button>
              <span className="text-base font-black text-[#2d3435] min-w-[50px] text-center">{headcount || 1} PPL</span>
              <button type="button" onClick={() => setHeadcount((Number(headcount) || 1) + 1)}
                className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90 transition-transform">
                <span className="material-symbols-rounded text-lg">add</span>
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Purpose <span className="text-red-400">*</span></p>
            <input required type="text" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g., Dance practice"
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Message</p>
            <textarea rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Message for the host (Optional)"
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all resize-none" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[#f2f4f4] shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Send Request to Host'}
          </button>
        </div>
      </div>
    </div>
  );
}
