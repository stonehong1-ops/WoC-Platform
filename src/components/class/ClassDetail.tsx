'use client';

// 클래스, 월간 패스, 패키지 할인의 상세 정보를 단일 조회하여 보여주는 초경량 정보 모달 컴포넌트

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import Portal from '@/components/common/Portal';

interface ClassDetailProps {
  groupId: string;
  onClose?: () => void;
  isOpen: boolean;
  itemId?: string;
  itemDetail?: any;
  isModal?: boolean;
}

export default function ClassDetail({ groupId, onClose, isOpen, itemId, itemDetail: propItemDetail }: ClassDetailProps) {
  const [itemDetail, setItemDetail] = useState<any | null>(propItemDetail || null);
  const [loading, setLoading] = useState(!propItemDetail);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propItemDetail) {
      setItemDetail(propItemDetail);
      setLoading(false);
      return;
    }

    if (!isOpen || !groupId || !itemId) {
      if (!isOpen) {
        setItemDetail(null);
      }
      return;
    }

    const fetchItemDetail = async (id: string) => {
      setLoading(true);
      try {
        // 1. classes 컬렉션 조회
        const classDocRef = doc(db, 'groups', groupId, 'classes', id);
        const classDoc = await getDoc(classDocRef);
        if (classDoc.exists()) {
          setItemDetail({ id: classDoc.id, itemType: 'class', ...classDoc.data() });
          return;
        }

        // 2. monthlyPasses 컬렉션 조회
        const passDocRef = doc(db, 'groups', groupId, 'monthlyPasses', id);
        const passDoc = await getDoc(passDocRef);
        if (passDoc.exists()) {
          setItemDetail({ id: passDoc.id, itemType: 'monthlyPass', ...passDoc.data() });
          return;
        }

        // 3. discounts 컬렉션 조회
        const discountDocRef = doc(db, 'groups', groupId, 'discounts', id);
        const discountDoc = await getDoc(discountDocRef);
        if (discountDoc.exists()) {
          setItemDetail({ id: discountDoc.id, itemType: 'discount', ...discountDoc.data() });
          return;
        }

        setItemDetail(null);
      } catch (error) {
        console.error("Failed to fetch item details:", error);
        setItemDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetail(itemId);
  }, [isOpen, groupId, itemId, propItemDetail]);

  // 스크롤 상단 감지 헤더 디자인 변경용 효과
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setIsScrolled(scrollRef.current.scrollTop > 20);
      }
    };
    const div = scrollRef.current;
    if (div) {
      div.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (div) {
        div.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loading, itemDetail]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'monthlyPass': return 'Monthly Pass';
      case 'discount': return 'Bundle Package';
      case 'class': return 'Regular Class';
      default: return 'Class';
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'monthlyPass': return 'bg-[#0057bd]/10 text-[#0057bd]';
      case 'discount': return 'bg-[#d97706]/10 text-[#d97706]';
      case 'class': return 'bg-[#059669]/10 text-[#059669]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (!isOpen) return null;

  const contentLayout = (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col antialiased animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-[260] flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#f2f4f4]' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button 
          onClick={handleClose} 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className={`text-sm font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>
          {itemDetail ? itemDetail.title : 'Detail'}
        </h1>
        <div className="w-10 h-10" />
      </header>

      {/* Scrollable Content */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto detail-scrollbar pb-32"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#acb3b4]">Loading details...</p>
          </div>
        ) : itemDetail ? (
          <div className="max-w-[56rem] mx-auto w-full">
            {/* Cover Image */}
            <div className="relative aspect-square md:aspect-[16/9] w-full overflow-hidden bg-[#f2f4f4] flex items-center justify-center">
              {itemDetail.imageUrl || itemDetail.image || itemDetail.photoURL || itemDetail.avatar ? (
                <img 
                  src={itemDetail.imageUrl || itemDetail.image || itemDetail.photoURL || itemDetail.avatar} 
                  alt={itemDetail.title} 
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-8xl">school</span>';
                  }}
                />
              ) : (
                <span className="material-symbols-outlined text-[#acb3b4] text-8xl z-10">school</span>
              )}
              {itemDetail.itemType === 'discount' && (
                <span className="absolute top-20 left-4 z-20 bg-[#d97706] text-white text-xs font-black px-3 py-1 rounded-full">Bundle Deal</span>
              )}
            </div>

            {/* Information Block */}
            <div className="px-5 py-6 border-b border-[#f2f4f4]">
              <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 ${getItemTypeColor(itemDetail.itemType)}`}>
                {getItemTypeLabel(itemDetail.itemType)}
              </span>
              <h2 className="text-xl font-black text-[#2d3435] leading-tight mb-4">
                {itemDetail.title}
              </h2>
              {itemDetail.level && (
                <p className="text-[11px] font-black text-primary uppercase tracking-widest mb-3">
                  Level: {itemDetail.level}
                </p>
              )}
              
              <div className="mt-4">
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-[#596061] leading-relaxed whitespace-pre-line">
                  {itemDetail.description || itemDetail.discountDescription || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Schedule & Location block */}
            <div className="px-5 py-4 space-y-4">
              {itemDetail.location && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">location_on</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Venue</p>
                    <p className="text-sm font-bold text-[#2d3435]">{itemDetail.location}</p>
                  </div>
                </div>
              )}

              {itemDetail.schedule && itemDetail.schedule.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">calendar_month</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Schedule</p>
                    {itemDetail.schedule.map((sched: any, idx: number) => {
                      const dateObj = new Date(sched.date);
                      const month = dateObj.toLocaleString('en-US', { month: 'short' });
                      const day = dateObj.getDate();
                      return (
                        <div key={idx} className="mt-1.5">
                          <p className="text-sm font-bold text-[#2d3435]">
                            {isNaN(day) ? 'TBD' : `${month} ${day}`}{' '}
                            <span className="font-normal text-[#596061] ml-1">
                              {sched.timeSlot || `${itemDetail.startTime || ''} - ${itemDetail.endTime || ''}`}
                            </span>
                          </p>
                          {sched.content && <p className="text-xs text-[#acb3b4] mt-0.5">{sched.content}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(itemDetail.maxCapacity || itemDetail.leaderCount || itemDetail.followerCount) && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">group</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Capacity</p>
                    <div className="flex gap-4 mt-1">
                      {itemDetail.leaderCount !== undefined && (
                        <div><p className="text-sm font-bold text-primary">{itemDetail.leaderCount}</p><p className="text-[10px] text-[#acb3b4]">Male</p></div>
                      )}
                      {itemDetail.followerCount !== undefined && (
                        <div><p className="text-sm font-bold text-tertiary">{itemDetail.followerCount}</p><p className="text-[10px] text-[#acb3b4]">Female</p></div>
                      )}
                      {itemDetail.leaderCount === undefined && itemDetail.followerCount === undefined && itemDetail.maxCapacity && (
                        <div><p className="text-sm font-bold text-[#2d3435]">{itemDetail.maxCapacity}</p><p className="text-[10px] text-[#acb3b4]">Total</p></div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Included Classes 정적 목록 (월간 패스나 번들인 경우 단순 텍스트 정보로만 렌더링) */}
            {(itemDetail.itemType === 'monthlyPass' || itemDetail.itemType === 'discount') && itemDetail.includedClasses && itemDetail.includedClasses.length > 0 && (
              <div className="mx-5 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
                <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">school</span>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Included Classes</p>
                </div>
                <div className="p-4 space-y-3">
                  {itemDetail.includedClasses.map((cls: any, index: number) => (
                    <div key={cls.id || index} className="flex items-center gap-3 py-1">
                      <span className="material-symbols-outlined text-primary text-sm">circle</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                        {cls.startTime && <p className="text-xs text-[#596061]">{cls.startTime} - {cls.endTime || ''}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructors List */}
            {itemDetail.instructors && itemDetail.instructors.length > 0 && (
              <div className="px-5 py-6 border-t border-[#f2f4f4]">
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-4">Instructors</p>
                <div className="flex gap-4 overflow-x-auto detail-scrollbar pb-2">
                  {itemDetail.instructors.map((inst: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center flex-shrink-0 w-20">
                      {inst.avatar || inst.photoURL || inst.image || inst.imageUrl ? (
                        <img 
                          src={inst.avatar || inst.photoURL || inst.image || inst.imageUrl} 
                          alt={inst.name} 
                          className="w-14 h-14 rounded-full object-cover mb-2 border border-[#e0e4e5]" 
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none'; 
                            e.currentTarget.parentElement!.innerHTML = `<div class="w-14 h-14 rounded-full bg-[#f2f4f4] text-[#596061] flex items-center justify-center text-xl font-bold mb-2 border border-[#e0e4e5]">${inst.name.substring(0, 2).toUpperCase()}</div><span class="text-xs font-bold text-[#2d3435] text-center line-clamp-1">${inst.name}</span>`; 
                          }} 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#f2f4f4] text-[#596061] flex items-center justify-center text-xl font-bold mb-2 border border-[#e0e4e5]">
                          {inst.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-bold text-[#2d3435] text-center line-clamp-1">{inst.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
            <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#acb3b4] text-3xl">sentiment_dissatisfied</span>
            </div>
            <h3 className="text-[#2d3435] font-black mb-1">Item Not Found</h3>
            <p className="text-[#acb3b4] text-xs font-medium">The selected class or pass could not be retrieved.</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Price Bar - 오직 CLOSE 버튼만 존재 */}
      {itemDetail && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-[260] bg-white border-t border-[#f2f4f4] px-5 py-4 flex items-center justify-between max-w-[56rem] mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest">Price</span>
            <span className="text-lg font-black text-primary font-headline">
              {itemDetail.amount?.toLocaleString()} <span className="text-xs uppercase font-bold">{itemDetail.currency || 'KRW'}</span>
            </span>
          </div>
          <button 
            onClick={handleClose}
            className="bg-[#f2f4f4] text-[#596061] px-8 py-3 rounded-full text-xs font-black tracking-wide active:scale-95 transition-all"
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  );

  return <Portal>{contentLayout}</Portal>;
}

