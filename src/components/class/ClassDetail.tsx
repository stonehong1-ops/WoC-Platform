'use client';

// 클래스, 월간 패스, 패키지 할인의 상세 정보를 단일 조회하여 보여주는 초경량 정보 모달 컴포넌트

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import Portal from '@/components/common/Portal';

interface ClassDetailProps {
  groupId: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function ClassDetail({ groupId, onClose, isModal = false }: ClassDetailProps) {
  const searchParams = useSearchParams();
  const classIdInUrl = searchParams.get('modal');
  
  const [itemDetail, setItemDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !classIdInUrl) return;

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

    fetchItemDetail(classIdInUrl);
  }, [groupId, classIdInUrl]);

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

  if (!classIdInUrl) return null;

  const contentLayout = (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col antialiased">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 h-16 bg-white border-b border-[#f2f4f4] flex-shrink-0">
        <button 
          onClick={handleClose} 
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-2xl text-[#596061]">close</span>
        </button>
        <h1 className="text-base font-black text-[#2d3435] tracking-wide">
          {itemDetail ? getItemTypeLabel(itemDetail.itemType) : 'Detail'}
        </h1>
        <div className="w-10 h-10" />
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#acb3b4]">Loading details...</p>
          </div>
        ) : itemDetail ? (
          <div className="max-w-[56rem] mx-auto w-full pb-32">
            {/* Cover Image */}
            <div className="relative aspect-square md:aspect-[16/9] w-full overflow-hidden bg-[#f2f4f4] flex items-center justify-center">
              <img 
                src={itemDetail.imageUrl || itemDetail.image || itemDetail.photoURL || itemDetail.avatar || ''} 
                alt={itemDetail.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-8xl">school</span>';
                }}
              />
            </div>

            {/* Information Block */}
            <div className="px-5 py-6 space-y-6">
              <div className="space-y-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getItemTypeColor(itemDetail.itemType)}`}>
                  {getItemTypeLabel(itemDetail.itemType)}
                </span>
                <h2 className="text-[1.5rem] font-black text-[#2d3435] leading-tight">
                  {itemDetail.title}
                </h2>
                {itemDetail.level && (
                  <p className="text-[11px] font-black text-primary uppercase tracking-widest">
                    Level: {itemDetail.level}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 pt-4 border-t border-[#f2f4f4]">
                <h3 className="text-xs font-black text-[#596061] uppercase tracking-wider">Description</h3>
                <p className="text-sm text-[#596061] leading-relaxed whitespace-pre-line">
                  {itemDetail.description || 'No description provided.'}
                </p>
              </div>

              {/* Class Schedule detail (Only for regular classes) */}
              {itemDetail.itemType === 'class' && (
                <div className="space-y-4 pt-4 border-t border-[#f2f4f4]">
                  <h3 className="text-xs font-black text-[#596061] uppercase tracking-wider">Schedule Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {itemDetail.startTime && (
                      <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[#f2f4f4] rounded-xl p-3.5">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#acb3b4] uppercase">Time</span>
                          <span className="text-xs font-black text-[#2d3435]">{itemDetail.startTime} - {itemDetail.endTime || ''}</span>
                        </div>
                      </div>
                    )}
                    {itemDetail.location && (
                      <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[#f2f4f4] rounded-xl p-3.5">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-[#acb3b4] uppercase">Location</span>
                          <span className="text-xs font-black text-[#2d3435] truncate">{itemDetail.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instructors List */}
              {itemDetail.itemType === 'class' && itemDetail.instructors && itemDetail.instructors.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#f2f4f4]">
                  <h3 className="text-xs font-black text-[#596061] uppercase tracking-wider">Instructors</h3>
                  <div className="flex flex-wrap gap-3">
                    {itemDetail.instructors.map((inst: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#f8f9fa] border border-[#f2f4f4] rounded-full pl-2 pr-4 py-1.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner">
                          <img src={inst.avatar || ''} alt={inst.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-black text-[#2d3435]">{inst.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

      {/* Fixed Bottom Price Bar */}
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
            className="bg-primary text-white px-8 py-3 rounded-full text-xs font-black tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            CONFIRM
          </button>
        </div>
      )}
    </div>
  );

  return <Portal>{contentLayout}</Portal>;
}
