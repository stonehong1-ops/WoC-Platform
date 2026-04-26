import React, { useState, useEffect, useRef } from 'react';
import { Social, SocialReservation } from '@/types/social';
import SocialHeroCard, { DualText, getSocialDisplayTitle } from './SocialHeroCard';
import { useAuth } from '@/components/providers/AuthProvider';
import UniversalFeed from '@/components/feed/UniversalFeed';
import { socialService } from '@/lib/firebase/socialService';

interface SocialViewerProps {
  social: Social;
  onClose: () => void;
}

export default function SocialViewer({ social, onClose }: SocialViewerProps) {
  const { user } = useAuth();
  const images = [social.imageUrl].filter(url => url && url.trim() !== '');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('Info');

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);
  const [peopleCount, setPeopleCount] = useState(2);
  const [guests, setGuests] = useState<string[]>(['Maria S.', 'Diego R.']);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reservations, setReservations] = useState<SocialReservation[]>([]);

  useEffect(() => {
    const unsubscribe = socialService.subscribeReservations(social.id, (data) => {
      setReservations(data);
    });
    return () => unsubscribe();
  }, [social.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    if (isShareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareMenuOpen]);

  const handleShareLink = async () => {
    setIsShareMenuOpen(false);
    
    // Create deep link
    const url = new URL(window.location.href);
    url.searchParams.set('id', social.id);
    const shareUrl = url.toString();

    const shareData = {
      title: social.title,
      url: shareUrl
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing link:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("링크가 클립보드에 복사되었습니다.");
    }
  };

  const handleSharePoster = async () => {
    setIsShareMenuOpen(false);
    if (!social.imageUrl) {
      alert("공유할 포스터 이미지가 없습니다.");
      return;
    }
    try {
      const response = await fetch(social.imageUrl);
      const blob = await response.blob();
      const fileExt = blob.type.split('/')[1] || 'jpeg';
      const file = new File([blob], `poster_${social.id}.${fileExt}`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: social.title
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poster_${social.id}.${fileExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Error sharing poster:', err);
      if (err.name === 'AbortError') {
        // 사용자가 공유를 취소한 경우
        return;
      }
      
      // CORS나 네트워크 문제로 fetch가 실패한 경우 백폴
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        alert("이미지 보안 설정(CORS)으로 인해 직접 공유가 제한되었습니다. 새 창에서 이미지를 엽니다.");
        window.open(social.imageUrl, '_blank');
      } else {
        alert("포스터를 공유하는 중 오류가 발생했습니다: " + (err.message || '알 수 없는 오류'));
      }
    }
  };

  const handleReservationSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await socialService.addReservation(social.id, {
        userId: user.uid,
        userName: user.displayName || 'Unknown User',
        userPhotoURL: user.photoURL || '',
        peopleCount,
        guests,
        notes,
        status: 'pending'
      });
      alert("예약이 성공적으로 요청되었습니다!");
      setIsReservationFormOpen(false);
      setPeopleCount(2);
      setGuests(['Maria S.', 'Diego R.']);
      setNotes('');
    } catch (error) {
      console.error("Error submitting reservation:", error);
      alert("예약 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TABS = ['Info', 'Feed', 'Tables', 'Contact'];

  const displayDate = social.type === 'regular' 
    ? `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][social.dayOfWeek || 0]}` 
    : social.date ? new Date(social.date.toDate ? social.date.toDate() : social.date as any).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA';

  const socialDateObj = social.type === 'regular' ? new Date() : (social.date ? (typeof social.date.toDate === 'function' ? social.date.toDate() : new Date(social.date as any)) : new Date());
  const socialDay = socialDateObj.getDate();
  const socialMonth = socialDateObj.toLocaleString('en-US', { month: 'short' });

  const displayTitle = getSocialDisplayTitle(social);

  return (
    <div className="fixed inset-0 z-[60] bg-[#f7f9fb] text-[#191c1e] font-body overflow-y-auto pt-[112px] pb-8 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-left: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 8px 32px rgba(0, 163, 255, 0.05);
        }
        .glass-card {
            background-color: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-left: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 8px 32px 0 rgba(0, 163, 255, 0.1);
        }
        .btn-primary {
            background: linear-gradient(135deg, #00A3FF 0%, #00629D 100%);
            color: #ffffff;
        }
        .btn-ghost {
            background-color: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(8px);
            border: 1px solid #00A3FF;
            color: #00A3FF;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-[70] flex justify-between items-center px-4 h-16 bg-white/70 backdrop-blur-lg border-b border-sky-100/20 shadow-[0_4px_12px_rgba(0,163,255,0.08)]">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-sky-50/50 transition-colors text-sky-500">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <div className="flex flex-col items-center justify-center max-w-[200px] flex-1">
          <DualText 
            text={displayTitle.primary}
            subText={displayTitle.secondary}
            primaryClassName="text-lg font-bold text-sky-600 tracking-tighter truncate w-full text-center leading-tight block"
            secondaryClassName="text-[11px] font-medium text-sky-500/80 leading-tight truncate w-full text-center block mt-0.5"
            containerClassName="flex-col items-center gap-0 w-full"
          />
        </div>
        <div className="relative" ref={shareMenuRef}>
          <button onClick={() => setIsShareMenuOpen(!isShareMenuOpen)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-sky-50/50 transition-colors text-sky-500">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>share</span>
          </button>
          
          {isShareMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl py-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <button 
                onClick={handleSharePoster}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-sky-50/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[#00a3ff]" style={{ fontVariationSettings: "'FILL' 0" }}>image</span>
                <span className="font-label text-[14px] font-semibold text-[#191c1e]">Share Poster</span>
              </button>
              <button 
                onClick={handleShareLink}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-sky-50/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[#00a3ff]" style={{ fontVariationSettings: "'FILL' 0" }}>link</span>
                <span className="font-label text-[14px] font-semibold text-[#191c1e]">Share Link</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="fixed top-16 left-0 w-full z-[65] bg-white/70 backdrop-blur-lg border-b border-sky-100/20 shadow-sm overflow-x-auto hide-scrollbar">
        <nav className="flex px-2 min-w-max">
          {TABS.map(tab => (
            <a
              key={tab}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab);
              }}
              className={`px-4 py-3 border-b-2 font-label text-[15px] leading-none transition-colors ${
                activeTab === tab
                  ? 'border-[#00629d] text-[#00629d] font-semibold'
                  : 'border-transparent text-[#515f78] hover:text-[#191c1e] font-medium'
              }`}
            >
              {tab}
            </a>
          ))}
        </nav>
      </div>

      <main className="w-full h-full">
        {/* Info Tab Content */}
        {activeTab === 'Info' && (
          <div className="max-w-7xl mx-auto md:px-6 mt-4 w-full pb-32">
            {/* Hero Header (Slider) */}
            <div className="relative w-full aspect-[3/4] md:h-[600px] md:w-auto md:max-w-[450px] mx-auto rounded-b-3xl md:rounded-3xl overflow-hidden mb-8 shadow-sm group">
              <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                <div className="w-full h-full shrink-0 snap-start relative">
                  <SocialHeroCard social={social} />
                </div>
                {/* Additional slides */}
                {images.length > 1 && (
                  <div className="w-full h-full shrink-0 snap-start relative hidden group-hover:block">
                    <img alt={social.title} className="w-full h-full object-cover" src={images[currentImageIndex]}/>
                  </div>
                )}
              </div>
              
              {/* Pagination Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                  {images.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}></div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 px-4 md:px-0">
              <div className="md:col-span-12 max-w-3xl mx-auto w-full space-y-8">
                {/* Basic Info Section (Bento Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Date & Time */}
                  <div className="glass-panel rounded-2xl p-6 sm:col-span-2 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#00a3ff]/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#00a3ff]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                    </div>
                    <div>
                      <h3 className="font-headline text-[24px] leading-[1.3] font-semibold text-[#191c1e] mb-1">{displayDate}</h3>
                      <p className="font-body text-[16px] leading-[1.5] text-[#3f4852]">{social.startTime} - {social.endTime}</p>
                      {social.type === 'regular' && (
                        <p className="font-label text-[14px] leading-[1.5] text-[#515f78] mt-2">Recurring Event</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#515f78]" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
                        <div>
                          <span className="block font-label text-[12px] leading-none tracking-[0.05em] font-bold text-[#515f78] uppercase">Venue</span>
                          <div className="mt-1">
                            <DualText 
                              text={social.venueName}
                              subText={social.venueNameNative}
                              primaryClassName="font-label text-[15px] leading-none font-semibold text-[#191c1e]"
                              secondaryClassName="text-[11px] font-medium text-[#515f78] leading-none mb-[1px]"
                              containerClassName="flex-wrap items-end"
                            />
                          </div>                        </div>
                      </div>
                      <div className="w-full h-[1px] bg-[#bec7d4]/30"></div>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#515f78]" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
                        <div>
                          <span className="block font-label text-[12px] leading-none tracking-[0.05em] font-bold text-[#515f78] uppercase">Organizer</span>
                          <div className="mt-1">
                            <DualText 
                              text={social.organizerName}
                              subText={social.organizerNameNative}
                              primaryClassName="font-label text-[15px] leading-none font-semibold text-[#191c1e]"
                              secondaryClassName="text-[11px] font-medium text-[#515f78] leading-none mb-[1px]"
                              containerClassName="flex-wrap items-end"
                            />
                          </div>                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dress Code & Price */}
                  <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#515f78]" style={{ fontVariationSettings: "'FILL' 0" }}>music_note</span>
                        <div>
                          <span className="block font-label text-[12px] leading-none tracking-[0.05em] font-bold text-[#515f78] uppercase">DJ</span>
                          <div className="mt-1">
                            <DualText 
                              text={social.djName || 'TBA'}
                              subText={social.djNameNative}
                              primaryClassName="font-label text-[15px] leading-none font-semibold text-[#191c1e]"
                              secondaryClassName="text-[11px] font-medium text-[#515f78] leading-none mb-[1px]"
                              containerClassName="flex-wrap items-end"
                            />
                          </div>                        </div>
                      </div>
                      <div className="w-full h-[1px] bg-[#bec7d4]/30"></div>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#515f78]" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
                        <div>
                          <span className="block font-label text-[12px] leading-none tracking-[0.05em] font-bold text-[#515f78] uppercase">Entry</span>
                          <span className="font-label text-[15px] leading-none font-semibold text-[#191c1e] block mt-1">{social.price || 'TBA'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {social.description && (
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className="font-label text-[12px] leading-none tracking-[0.05em] font-bold text-[#515f78] uppercase mb-4">Description</h3>
                    <p className="font-body text-[16px] leading-[1.6] text-[#191c1e] whitespace-pre-wrap">
                      {social.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab Content */}
        {activeTab === 'Tables' && (
          <div className="max-w-3xl mx-auto md:px-6 px-4 mt-4 w-full space-y-[24px] pb-32">
            <div className="flex items-center justify-center gap-6 mb-6 py-2 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
              <button className="p-2 text-[#00629d] hover:bg-[#00629d]/10 rounded-full transition-colors flex items-center justify-center active:scale-90">
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
              <div className="flex flex-col items-center">
                <span className="font-h3 text-xl font-bold text-[#191c1e]">{socialDay}, {socialMonth}</span>
                <span className="font-label-caps text-[10px] text-[#3f4852] uppercase tracking-widest">Event Date</span>
              </div>
              <button className="p-2 text-[#00629d] hover:bg-[#00629d]/10 rounded-full transition-colors flex items-center justify-center active:scale-90">
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-xl border border-white/50 shadow-[0_2px_8px_0_rgba(0,163,255,0.05)]">
              <div>
                <h3 className="font-button text-[15px] font-semibold text-[#191c1e]">Manage Reservations</h3>
                <p className="font-body-sm text-[14px] text-[#3f4852]">Accepting new requests</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" value=""/>
                <div className="w-11 h-6 bg-[#e0e3e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a3ff]"></div>
              </label>
            </div>

            <div className="bg-[#00a3ff]/10 p-4 rounded-xl border border-[#00a3ff]/30 shadow-sm">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00629d] text-lg">redeem</span>
                  <span className="font-body-md text-[14px] text-[#3f4852] font-medium">테이블 예약시 2+1 이벤트</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00629d] text-lg">redeem</span>
                  <span className="font-body-md text-[14px] text-[#3f4852] font-medium">최고의 드레서에게 와인 한 병 드려요</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-h3 text-[24px] font-semibold text-[#191c1e]">Table Requests</h3>
                <span className="bg-[#00a3ff]/10 text-[#00a3ff] px-3 py-1 rounded-full font-label-caps text-[12px] font-bold tracking-[0.05em] uppercase">{reservations.filter(r => r.status === 'pending').length} Pending</span>
              </div>

              {reservations.length === 0 ? (
                <div className="text-center py-8 bg-white/60 backdrop-blur-md rounded-xl border border-white/50">
                  <p className="font-body text-[#515f78]">No reservations yet.</p>
                </div>
              ) : (
                reservations.map((res) => {
                  const isApproved = res.status === 'approved';
                  const isPending = res.status === 'pending';
                  
                  const statusColors = {
                    approved: { border: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'check_circle' },
                    pending: { border: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', icon: 'pending' },
                    rejected: { border: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', icon: 'cancel' }
                  };
                  const colors = statusColors[res.status] || statusColors.pending;
                  
                  return (
                    <div key={res.id} className="bg-white/80 backdrop-blur-lg p-4 rounded-xl border border-white/40 shadow-[0_4px_20px_0_rgba(0,163,255,0.05)] relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${colors.border}`}></div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-button text-[15px] font-semibold text-[#191c1e]">{res.userName}</h4>
                          <p className="font-body-sm text-[14px] text-[#3f4852] flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">group</span> {res.peopleCount} People
                          </p>
                        </div>
                        <div className="text-right cursor-pointer" onClick={() => {
                          const nextStatus = res.status === 'pending' ? 'approved' : res.status === 'approved' ? 'rejected' : 'pending';
                          if (res.id) socialService.updateReservationStatus(social.id, res.id, nextStatus);
                        }}>
                          <span className={`inline-flex items-center gap-1 ${colors.text} ${colors.bg} px-2 py-0.5 rounded text-xs font-semibold hover:opacity-80 transition-opacity`}>
                            <span className="material-symbols-outlined text-[14px]">{colors.icon}</span> {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                          </span>
                          {res.createdAt && <p className="font-body-sm text-[11px] text-[#3f4852] mt-1">
                            {new Date(typeof res.createdAt.toMillis === 'function' ? res.createdAt.toMillis() : (res.createdAt as any)).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {res.guests && res.guests.length > 0 && (
                          <p className="font-body-sm text-[14px] text-[#3f4852]"><span className="font-semibold text-[#191c1e]">Attendees:</span> {res.guests.join(', ')}</p>
                        )}
                        {res.notes && (
                          <div className="bg-[#f7f9fb] p-3 rounded-lg border border-[#e0e3e5]/50">
                            <p className="font-body-sm text-[14px] text-[#3f4852] italic">"{res.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Floating Action Button (Shows when form is closed) */}
            {!isReservationFormOpen && (
              <button
                onClick={() => setIsReservationFormOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
              >
                <span className="material-symbols-outlined text-2xl">add</span>
              </button>
            )}

            {/* New Reservation Form (Bottom Sheet) */}
            <div 
              className={`fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-white/40 shadow-[0_-8px_32px_0_rgba(0,163,255,0.1)] z-[80] p-4 pb-8 rounded-t-3xl transition-transform duration-300 ease-in-out ${isReservationFormOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
              {/* Handlebar */}
              <div 
                className="w-full flex justify-center mb-6 cursor-pointer"
                onClick={() => setIsReservationFormOpen(false)}
              >
                <div className="w-12 h-1.5 bg-[#e0e3e5] rounded-full"></div>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                <h3 className="font-h3 text-lg font-semibold text-[#191c1e]">New Reservation</h3>
                <div className="flex items-center justify-between bg-[#f2f4f6] p-3 rounded-xl border border-[#e0e3e5]/50">
                  <span className="font-body-md text-[#191c1e] font-medium text-[16px]">People</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))} className="w-8 h-8 rounded-full bg-white border border-[#e0e3e5] flex items-center justify-center text-[#00629d] shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="font-button text-lg w-4 text-center text-[#191c1e] font-semibold">{peopleCount}</span>
                    <button onClick={() => setPeopleCount(peopleCount + 1)} className="w-8 h-8 rounded-full bg-white border border-[#e0e3e5] flex items-center justify-center text-[#00629d] shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="font-body-sm text-[#3f4852] ml-1 text-[14px]">Select Guests</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {guests.map((guest, idx) => (
                        <span key={idx} className="bg-[#00629d]/10 text-[#00629d] border border-[#00629d]/20 px-3 py-1.5 rounded-full font-body-sm text-sm flex items-center gap-1 cursor-pointer hover:bg-[#00629d]/20 transition-colors" onClick={() => setGuests(guests.filter((_, i) => i !== idx))}>
                          {guest} <span className="material-symbols-outlined text-[14px]">close</span>
                        </span>
                      ))}
                      <button 
                        onClick={() => {
                          const name = prompt("Enter guest name:");
                          if (name) setGuests([...guests, name]);
                        }}
                        className="border border-dashed border-[#bec7d4] text-[#3f4852] px-4 py-1.5 rounded-full font-body-sm text-sm flex items-center gap-1 hover:bg-[#eceef0] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span> Add Guest
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="font-body-sm text-[#3f4852] ml-1 text-[14px]">Notes</span>
                  <input 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#f2f4f6] border border-[#e0e3e5]/50 rounded-xl px-4 py-3 font-body-md text-[#191c1e] placeholder:text-[#3f4852]/50 focus:outline-none focus:ring-2 focus:ring-[#00629d]/50" 
                    placeholder="Special requests, allergies, etc." 
                    type="text"
                  />
                </div>
                <button 
                  onClick={handleReservationSubmit}
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-[#00a3ff] to-[#00629d] text-white font-button text-[15px] font-semibold py-3.5 rounded-xl shadow-[0_4px_12px_0_rgba(0,163,255,0.2)] transition-all flex items-center justify-center gap-2 mt-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_6px_16px_0_rgba(0,163,255,0.3)]'}`}
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">event_seat</span>
                  )}
                  {isSubmitting ? 'Submitting...' : 'Add Reservation'}
                </button>
              </div>
            </div>

            {/* Overlay when bottom sheet is open */}
            {isReservationFormOpen && (
              <div 
                className="fixed inset-0 bg-black/20 z-[75] transition-opacity backdrop-blur-sm"
                onClick={() => setIsReservationFormOpen(false)}
              ></div>
            )}
          </div>
        )}

        {/* Contact Tab Content */}
        {activeTab === 'Contact' && (
          <div className="max-w-3xl mx-auto md:px-6 px-4 mt-4 w-full pb-32">
            <div className="w-full">
              {/* Map Section */}
              <section className="mb-[48px]">
                <div className="glass-card rounded-xl overflow-hidden flex flex-col">
                  {/* Map Placeholder */}
                  <div className="relative w-full h-48 md:h-64 bg-[#eceef0]">
                    <img alt="Location Map" className="w-full h-full object-cover opacity-80" data-alt="Detailed digital map view of a city streets with light blue and soft gray tones, minimal UI" data-location="Buenos Aires" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfFs-DSxs4MGe523P3png4vc9pITm3rVQxc4rxC6Qfw13zIXZun5HwAjuIuZF5wsOsNiEXQay7SM5kw3cCJvDhjOv-e7fzLEDBfM0SNo2qMTiTkudZ6R-75KJsxjWQdSvuivb2yNjR0JxprQnh91VYmaFAVOLd9vTROm-oAzIPuIVyTbVWMngYJfqK6tSlgcaE_FPwpI8VxroPg-UBp2Xmg3oN7TwvwWcnOBbfIudQbXGxwDAngSWdp8QTFV18KxLqwkFebcpMjjI"/>
                    {/* Floating Map Actions */}
                    <div className="absolute bottom-[12px] right-[12px] flex gap-[12px]">
                      <button className="btn-ghost rounded-full p-[4px] shadow-sm hover:bg-[#f7f9fb] transition-all flex items-center justify-center bg-[#f7f9fb]/80 backdrop-blur-md">
                        <span className="material-symbols-outlined text-[#00629d] text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>my_location</span>
                      </button>
                    </div>
                  </div>
                  {/* Location Info & Actions */}
                  <div className="p-[24px] flex flex-col md:flex-row md:items-center justify-between gap-[24px] bg-[#ffffff]/50">
                    <div>
                      <div className="mb-[4px]">
                        <DualText 
                          text={social.venueName || 'Venue Location'}
                          subText={social.venueNameNative}
                          primaryClassName="font-h3 text-[24px] leading-[1.3] font-semibold text-[#191c1e]"
                          secondaryClassName="font-body-md text-[14px] text-[#515f78] font-medium"
                          containerClassName="flex-wrap items-baseline gap-2"
                        />
                      </div>
                      <p className="font-body-md text-[16px] leading-[1.5] text-[#3f4852] flex items-center gap-[4px]">
                        <span className="material-symbols-outlined text-[#00629d] text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
                        {social.city ? `${social.city}, ${social.country}` : 'Location TBA'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-[12px]">
                      <button className="btn-ghost rounded-lg px-[24px] py-[12px] font-button text-[15px] font-semibold flex items-center justify-center gap-[4px] transition-all hover:bg-[#cfe5ff]/30">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>map</span>
                        Open in other maps
                      </button>
                      <button className="btn-primary rounded-lg px-[24px] py-[12px] font-button text-[15px] font-semibold flex items-center justify-center gap-[4px] shadow-md shadow-[#00a3ff]/20 hover:shadow-lg transition-all">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>directions</span>
                        Get Directions
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              {/* Divider */}
              <div className="w-full h-[1px] bg-[#bec7d4]/30 my-[48px] relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f7f9fb] px-[24px] text-[#00629d] font-label-caps text-[12px] font-bold tracking-[0.05em] uppercase">
                  Contacts
                </div>
              </div>
              {/* Contacts Section */}
              <section className="space-y-[48px]">
                {/* Organizer */}
                <div className="glass-card rounded-xl p-[24px] relative overflow-hidden group">
                  {/* Highlight line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[#c9a900]"></div>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-[24px]">
                    <div className="w-24 h-24 rounded-full border-2 border-[#f7f9fb] shadow-sm ring-2 ring-[#00a3ff]/20 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="inline-flex items-center gap-[4px] bg-[#ffe16d]/30 text-[#4c3e00] px-[12px] py-[4px] rounded-full mb-[12px]">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
                        <span className="font-label-caps text-[12px] font-bold tracking-[0.05em] uppercase">Organizer</span>
                      </div>
                      <div className="mb-[4px] flex justify-center sm:justify-start">
                        <DualText 
                          text={social.organizerName || 'Organizer'}
                          subText={social.organizerNameNative}
                          primaryClassName="font-h2 text-[30px] leading-[1.2] font-bold text-[#191c1e]"
                          secondaryClassName="font-body-md text-[16px] text-[#515f78] font-medium"
                          containerClassName="flex-wrap items-baseline gap-2 sm:flex-nowrap"
                        />
                      </div>
                      <p className="font-body-sm text-[14px] leading-[1.5] text-[#3f4852]">Main Coordinator & Booking</p>
                    </div>
                    <div className="flex gap-[12px] mt-[24px] sm:mt-0 w-full sm:w-auto justify-center">
                      <button className="btn-ghost rounded-full p-[12px] flex items-center justify-center hover:bg-[#cfe5ff]/30 transition-all group-hover:shadow-md">
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>chat</span>
                      </button>
                      <button className="btn-primary rounded-full p-[12px] flex items-center justify-center shadow-md shadow-[#00a3ff]/20 hover:shadow-lg transition-all">
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>call</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Staff Grid - Removed as there is no specific Staff data array in Social model yet */}
                {/* DJ */}
                {social.djName && (
                  <div className="glass-card rounded-xl p-[24px] flex flex-col sm:flex-row items-center sm:items-start gap-[24px] border-l-4 border-l-[#00a3ff]">
                    <div className="w-16 h-16 rounded-lg border border-[#f7f9fb] shadow-sm bg-gray-100 flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-3xl text-gray-400">headphones</span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <span className="font-label-caps text-[12px] font-bold tracking-[0.05em] text-[#515f78] uppercase mb-[4px] block">Resident DJ</span>
                      <div className="mb-[4px] flex justify-center sm:justify-start">
                        <DualText 
                          text={social.djName}
                          subText={social.djNameNative}
                          primaryClassName="font-body-lg text-[18px] leading-[1.6] font-bold text-[#191c1e]"
                          secondaryClassName="font-body-sm text-[13px] text-[#515f78] font-medium"
                          containerClassName="flex-wrap items-baseline gap-2 sm:flex-nowrap"
                        />
                      </div>
                      <p className="font-body-sm text-[14px] leading-[1.5] text-[#3f4852]">Musical Director</p>
                    </div>
                    <div className="flex gap-[12px] mt-[12px] sm:mt-0">
                      <button className="text-[#00629d] hover:bg-[#cfe5ff]/30 rounded-full w-10 h-10 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>chat</span>
                      </button>
                      <button className="text-[#00629d] hover:bg-[#cfe5ff]/30 rounded-full w-10 h-10 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>call</span>
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Feed Tab Content */}
        {activeTab === 'Feed' && (
          <div className="w-full h-full pb-32">
            <UniversalFeed context={{ scope: 'social', scopeId: social.id }} currentUser={user} />
          </div>
        )}

        {/* Coming Soon fallback for any other unimplemented tab */}
        {activeTab !== 'Info' && activeTab !== 'Tables' && activeTab !== 'Contact' && activeTab !== 'Feed' && (
          <div className="max-w-3xl mx-auto md:px-6 px-4 mt-8 w-full">
            <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-4xl text-sky-300 mb-4">construction</span>
              <h3 className="font-headline text-xl font-bold text-sky-900 mb-2">Coming Soon</h3>
              <p className="text-sky-700/70 font-medium">The {activeTab} section is currently under development.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
