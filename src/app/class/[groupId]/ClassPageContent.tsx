'use client';

import React from 'react';
import UnifiedCheckoutModal from '@/components/common/UnifiedCheckoutModal';
import ClassDetail from '@/components/class/ClassDetail';
import { useClassData } from './hooks/useClassData';
import { toast } from 'sonner';
import { 
  DAY_ORDER, 
  DAY_LABELS, 
  DAY_COLORS, 
  getDayOfWeek, 
  formatScheduleDates 
} from './constants/classConstants';
import { GroupClass } from '@/types/group';

interface ClassPageContentProps {
  propGroupId?: string;
  propModalId?: string;
  isOverlay?: boolean;
  onClose?: () => void;
}

export default function ClassPageContent({
  propGroupId,
  propModalId,
  isOverlay = false,
  onClose
}: ClassPageContentProps) {
  const {
    router,
    groupId,
    group,
    loading,
    selectedClasses,
    setSelectedClasses,
    selectedClassDetail,
    isApplyModalOpen,
    setIsApplyModalOpen,
    passSelectedClassIds,
    setPassSelectedClassIds,
    classPartners,
    setClassPartners,
    user,
    profile,
    language,
    t,
    selectedRole,
    setSelectedRole,
    ownerInfo,
    currentDate,
    sortOption,
    imageErrors,
    setImageErrors,
    captureRef,
    isDownloading,
    checkoutModalOpen,
    setCheckoutModalOpen,
    checkoutRole,
    setCheckoutRole,
    isBooking,
    closeDetailModal,
    isRegistrationOpen,
    monthDisplay,
    allGroupClasses,
    classes,
    discounts,
    allItemsOriginal,
    allItems,
    isDiscountSelected,
    sortedClasses,
    classesByDay,
    bank,
    handleCardClick,
    handleAddToBasket,
    handleRemoveFromBasket,
    handleDirectReserve,
    handleCheckoutSubmit,
    handleDownload,
    reportPayment
  } = useClassData(propGroupId, propModalId, onClose);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-outline">error</span>
        <h2 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">{t('class.detail.club_not_found')}</h2>
        <button onClick={() => isOverlay && onClose ? onClose() : router.back()} className="text-primary hover:underline">{t('class.detail.go_back')}</button>
      </div>
    );
  }

  const renderCardList = (cards: any[], mode: 'emperor' | 'wide' | 'slim' | 'grid') => {
    // 렌더 카드 리스트는 원본 소스에서 detail modal에서 selectedClassDetail 타입으로 넘어갔던 헬퍼 기능들임.
    // 기존 class/[groupId]/page.tsx에서 renderCardList 헬퍼는 없었지만 social feed에 있던 것으로 혼동하지 않고
    // class/page 에서는 dayClasses.map() 형태로 직접 인라인 렌더링하고 있었습니다.
    // 따라서 direct return으로 원래의 Day-by-Day View 및 Flat List View 구조를 그대로 유지해야 편차 0%를 만족합니다.
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f4] flex-shrink-0 bg-white z-10">
        <button onClick={() => isOverlay && onClose ? onClose() : router.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors">
          <span className="material-symbols-outlined text-xl text-[#596061]">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-base font-black text-[#2d3435]">{t('class.detail.schedule_title')}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Download Icon */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f0f4ff] transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl text-[#0057bd]">
              {isDownloading ? 'progress_activity' : 'download'}
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable Content (Poster style) */}
      <div className="flex-1 overflow-y-auto">
        <div ref={captureRef} className="bg-white px-5 py-6">
          {!isRegistrationOpen && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 text-xs font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-500">warning</span>
              {t('class.registrationClosed')}
            </div>
          )}
          
          {/* Title Banner */}
          <div 
            style={{ background: 'linear-gradient(to right, #0057bd, #3b82f6)' }}
            className="rounded-2xl p-5 mb-6 text-center shadow-lg shadow-blue-500/20"
          >
            <p 
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
            >
              {t('class.detail.info_banner')}
            </p>
            <h1 
              style={{ color: '#ffffff' }}
              className="text-xl font-black mb-3"
            >
              {group.name}
            </h1>
            <div className="flex items-center justify-center gap-8">
              <p 
                style={{ color: '#ffffff' }}
                className="text-base font-black tracking-widest min-w-[120px] text-center"
              >
                {monthDisplay}
              </p>
            </div>
          </div>

          {/* Bundle Info */}
          {discounts && discounts.length > 0 && (
            <div className="mb-6 bg-[#fff8f0] border border-[#d97706]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#d97706] text-lg">category</span>
                <h3 className="text-sm font-black text-[#d97706]">{t('class.detail.bundle_packages')}</h3>
              </div>
              <div className="space-y-3">
                {discounts.map(disc => (
                  <div key={disc.id} onClick={() => handleCardClick({ ...disc, itemType: 'discount' })} className="bg-white rounded-xl p-3 shadow-sm border border-[#d97706]/10 cursor-pointer hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-[#2d3435]">{disc.title}</p>
                    </div>
                    {disc.description && (
                      <p className="text-xs text-[#596061] leading-relaxed whitespace-pre-wrap mb-2">{disc.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#d97706]/10">
                      <p className="text-sm font-black text-[#d97706]">
                        {disc.currency === 'KRW' ? `₩${disc.amount.toLocaleString()}` : `${disc.amount.toLocaleString()} ${disc.currency}`}
                      </p>
                      {selectedClasses.has(disc.id) ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(disc.id); }}
                          disabled={!isRegistrationOpen}
                          className={`flex items-center justify-center transition-colors ${!isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#0057bd]'}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToBasket(disc.id, 'discount'); }}
                          disabled={isDiscountSelected || !isRegistrationOpen}
                          className={`flex items-center justify-center transition-colors ${isDiscountSelected || !isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#acb3b4]'}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_off</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classes Sort & List */}
          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="text-sm font-black text-[#2d3435]">{t('class.detail.schedule_title')}</h3>
            <div className="relative" />
          </div>

          <div className="space-y-4">
            {sortOption === 'class' ? (
              // Original Day-by-Day View
              DAY_ORDER.map(day => {
                const dayClasses = classesByDay.get(day) || [];
                if (dayClasses.length === 0) return null;

                const color = DAY_COLORS[day];

                return (
                  <div key={day} className="border border-[#e0e4e5] rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: `${color}10` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <p className="text-xs font-black uppercase tracking-[0.15em]" style={{ color }}>{DAY_LABELS[day]}</p>
                      <span className="text-[10px] font-bold text-[#acb3b4] ml-auto">
                        {dayClasses.length} {language === 'KR' ? '개 수업' : (dayClasses.length > 1 ? 'classes' : 'class')}
                      </span>
                    </div>

                    <div className="divide-y divide-[#f2f4f4]">
                      {dayClasses.map(cls => {
                        const schedDates = formatScheduleDates(cls.schedule);
                        const instructors = cls.instructors || [];
                        const startDate = cls.schedule?.[0]?.date;
                        let startDisplay = '';
                        if (startDate) {
                          const cleanDate = startDate.replace(/\./g, '-');
                          const dd = new Date(cleanDate);
                          if (!isNaN(dd.getTime())) {
                            const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
                            const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const dayIdx = dd.getDay();
                            if (language === 'KR') {
                              startDisplay = `${dd.getMonth() + 1}.${dd.getDate()}(${daysKr[dayIdx]})`;
                            } else {
                              startDisplay = `${dd.getMonth() + 1}/${dd.getDate()} (${daysEn[dayIdx]})`;
                            }
                          }
                        }
                        const timeDisplay = cls.schedule?.[0]?.timeSlot || (cls.startTime ? `${cls.startTime}${cls.endTime ? ' - ' + cls.endTime : ''}` : '');

                        return (
                          <div key={cls.id} onClick={() => handleCardClick({ ...cls, itemType: 'class' })} className="p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors group bg-white">
                            {(() => {
                              const imgKey = `class-img-${cls.id}`;
                              const hasError = imageErrors[imgKey];
                              return (
                                <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#e0e4e5] ${hasError ? 'flex items-center justify-center' : ''}`}>
                                  {hasError ? (
                                    <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                                  ) : cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar ? (
                                    <img 
                                      src={cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar} 
                                      alt={cls.title} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                      onError={() => {
                                        setImageErrors(prev => ({ ...prev, [imgKey]: true }));
                                      }} 
                                    />
                                  ) : group.coverImage ? (
                                    <img 
                                      src={group.coverImage} 
                                      alt={cls.title} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                      onError={() => {
                                        setImageErrors(prev => ({ ...prev, [imgKey]: true }));
                                      }} 
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                              <p className="text-[13px] font-black text-[#2d3435] mt-0.5">
                                {cls.currency === 'KRW' ? `₩${cls.amount.toLocaleString()}` : `${cls.amount.toLocaleString()} ${cls.currency}`}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                {startDisplay && (
                                  <span className="text-[11px] font-bold" style={{ color }}>{t('class.detail.start')}: {startDisplay}</span>
                                )}
                                {timeDisplay && (
                                  <span className="text-[11px] text-[#596061]">{timeDisplay}</span>
                                )}
                              </div>
                              {schedDates && (
                                <p className="text-[10px] text-[#acb3b4] mt-0.5">
                                  {t('class.detail.schedule_label')}: <span className="font-bold text-[#596061]">{schedDates}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end flex-shrink-0 ml-1 justify-between py-1">
                              {instructors.length > 0 && (
                                <div className="flex flex-row gap-2 items-center justify-end mb-2">
                                  {instructors.slice(0, 2).map((instructor, idx) => (
                                    <div key={idx} className="flex flex-col items-center w-8">
                                      {(() => {
                                        const instKey = `instructor-img-${cls.id}-${(instructor as any).id || (instructor as any).userId || idx}`;
                                        const hasInstError = imageErrors[instKey];
                                        return (
                                          <div className={`w-7 h-7 rounded-full overflow-hidden bg-[#e0e4e5] border border-[#f2f4f4] ${hasInstError ? 'flex items-center justify-center text-[9px] font-bold text-[#596061] bg-[#f8f9fa]' : ''}`}>
                                            {hasInstError ? (
                                              instructor.name.substring(0, 2).toUpperCase()
                                            ) : (instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl ? (
                                              <img 
                                                src={(instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl} 
                                                alt={instructor.name} 
                                                className="w-full h-full object-cover" 
                                                onError={() => {
                                                  setImageErrors(prev => ({ ...prev, [instKey]: true }));
                                                }} 
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#596061] bg-[#f8f9fa]">
                                                {instructor.name.substring(0, 2).toUpperCase()}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <p className="text-[8px] font-bold text-[#596061] mt-0.5 text-center truncate w-full">{instructor.name}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {cls.classType === 'special' ? (
                                <button
                                  onClick={(e) => handleDirectReserve(cls, e)}
                                  disabled={!isRegistrationOpen}
                                  className={`flex items-center justify-center font-black text-[10px] tracking-wider uppercase border px-3 py-1.5 rounded-full transition-colors ${
                                    !isRegistrationOpen 
                                      ? 'text-[#acb3b4] border-[#e0e4e5] cursor-not-allowed opacity-50' 
                                      : 'text-[#0057bd] border-[#0057bd] hover:bg-[#0057bd]/5'
                                  }`}
                                >
                                  {t('class.reserve').toUpperCase()}
                                </button>
                              ) : selectedClasses.has(cls.id) ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(cls.id); }}
                                  disabled={!isRegistrationOpen}
                                  className={`flex items-center justify-center transition-colors ${!isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#0057bd]'}`}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleAddToBasket(cls.id); }}
                                  disabled={isDiscountSelected || !isRegistrationOpen}
                                  className={`flex items-center justify-center transition-colors ${isDiscountSelected || !isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#acb3b4]'}`}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_off</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              // Flat List View
              <div className="border border-[#e0e4e5] rounded-2xl overflow-hidden divide-y divide-[#f2f4f4]">
                {sortedClasses.map(cls => {
                  const schedDates = formatScheduleDates(cls.schedule);
                  const instructors = cls.instructors || [];
                  const startDate = cls.schedule?.[0]?.date;
                  let startDisplay = '';
                  if (startDate) {
                    const cleanDate = startDate.replace(/\./g, '-');
                    const dd = new Date(cleanDate);
                    if (!isNaN(dd.getTime())) {
                      const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
                      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const dayIdx = dd.getDay();
                      if (language === 'KR') {
                        startDisplay = `${dd.getMonth() + 1}.${dd.getDate()}(${daysKr[dayIdx]})`;
                      } else {
                        startDisplay = `${dd.getMonth() + 1}/${dd.getDate()} (${daysEn[dayIdx]})`;
                      }
                    }
                  }
                  const timeDisplay = cls.schedule?.[0]?.timeSlot || (cls.startTime ? `${cls.startTime}${cls.endTime ? ' - ' + cls.endTime : ''}` : '');

                  return (
                    <div key={cls.id} onClick={() => handleCardClick({ ...cls, itemType: 'class' })} className="p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors group bg-white">
                      {(() => {
                        const imgKey = `class-flat-img-${cls.id}`;
                        const hasError = imageErrors[imgKey];
                        return (
                          <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#e0e4e5] ${hasError ? 'flex items-center justify-center' : ''}`}>
                            {hasError ? (
                              <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                            ) : cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar ? (
                              <img 
                                src={cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar} 
                                alt={cls.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                onError={() => {
                                  setImageErrors(prev => ({ ...prev, [imgKey]: true }));
                                }} 
                              />
                            ) : group.coverImage ? (
                              <img 
                                src={group.coverImage} 
                                alt={cls.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                onError={() => {
                                  setImageErrors(prev => ({ ...prev, [imgKey]: true }));
                                }} 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                        <p className="text-[13px] font-black text-[#2d3435] mt-0.5">
                          {cls.currency === 'KRW' ? `₩${cls.amount.toLocaleString()}` : `${cls.amount.toLocaleString()} ${cls.currency}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          {startDisplay && (
                            <span className="text-[11px] font-bold text-[#0057bd]">{t('class.detail.start')}: {startDisplay}</span>
                          )}
                          {timeDisplay && (
                            <span className="text-[11px] text-[#596061]">{timeDisplay}</span>
                          )}
                        </div>
                        {schedDates && (
                          <p className="text-[10px] text-[#acb3b4] mt-0.5">
                            {t('class.detail.schedule_label')}: <span className="font-bold text-[#596061]">{schedDates}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0 ml-1 justify-between py-1">
                        {instructors.length > 0 && (
                          <div className="flex flex-row gap-2 items-center justify-end mb-2">
                            {instructors.slice(0, 2).map((instructor, idx) => (
                              <div key={idx} className="flex flex-col items-center w-8">
                                {(() => {
                                  const instKey = `instructor-flat-img-${cls.id}-${(instructor as any).id || (instructor as any).userId || idx}`;
                                  const hasInstError = imageErrors[instKey];
                                  return (
                                    <div className={`w-7 h-7 rounded-full overflow-hidden bg-[#e0e4e5] border border-[#f2f4f4] ${hasInstError ? 'flex items-center justify-center text-[9px] font-bold text-[#596061] bg-[#f8f9fa]' : ''}`}>
                                      {hasInstError ? (
                                        instructor.name.substring(0, 2).toUpperCase()
                                      ) : (instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl ? (
                                        <img 
                                          src={(instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl} 
                                          alt={instructor.name} 
                                          className="w-full h-full object-cover" 
                                          onError={() => {
                                            setImageErrors(prev => ({ ...prev, [instKey]: true }));
                                          }} 
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#596061] bg-[#f8f9fa]">
                                          {instructor.name.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                <p className="text-[8px] font-bold text-[#596061] mt-0.5 text-center truncate w-full">{instructor.name}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {cls.classType === 'special' ? (
                          <button
                            onClick={(e) => handleDirectReserve(cls, e)}
                            disabled={!isRegistrationOpen}
                            className={`flex items-center justify-center font-black text-[10px] tracking-wider uppercase border px-3 py-1.5 rounded-full transition-colors ${
                              !isRegistrationOpen 
                                ? 'text-[#acb3b4] border-[#e0e4e5] cursor-not-allowed opacity-50' 
                                : 'text-[#0057bd] border-[#0057bd] hover:bg-[#0057bd]/5'
                            }`}
                          >
                            {t('class.reserve').toUpperCase()}
                          </button>
                        ) : selectedClasses.has(cls.id) ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(cls.id); }}
                            disabled={!isRegistrationOpen}
                            className={`flex items-center justify-center transition-colors ${!isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#0057bd]'}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddToBasket(cls.id); }}
                            disabled={isDiscountSelected || !isRegistrationOpen}
                            className={`flex items-center justify-center transition-colors ${isDiscountSelected || !isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#acb3b4]'}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_off</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bank Account Section */}
          {bank && (
            <div className="mt-6 border border-[#e0e4e5] rounded-2xl overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#0057bd]">account_balance</span>
                <p className="text-[10px] font-black text-[#0057bd] uppercase tracking-[0.15em] flex-1">{t('class.detail.payment_account')}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bank.accountNumber);
                    toast.success(t("class.toast.account_copied"));
                  }}
                  className="text-[#0057bd] hover:text-[#0057bd]/80 transition-colors flex items-center justify-center bg-white border border-[#0057bd]/20 rounded-md p-1 shadow-sm"
                  title="Copy account number"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">{t('class.detail.bank')}</span>
                  <span className="text-sm font-bold text-[#2d3435]">{bank.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">{t('class.detail.account')}</span>
                  <span className="text-sm font-black text-[#2d3435] font-mono tracking-wide">{bank.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">{t('class.detail.holder')}</span>
                  <span className="text-sm font-bold text-[#2d3435]">{bank.accountHolder}</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#596061]">support_agent</span>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-[0.15em]">{t('class.detail.contact')}</p>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0f4ff] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {group.representative?.avatar || (group.representative as any)?.photoURL || ownerInfo?.avatar ? (
                  <img src={group.representative?.avatar || (group.representative as any)?.photoURL || ownerInfo?.avatar || undefined} alt="admin" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-sm text-[#0057bd]">person</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-[#2d3435]">{group.representative?.name || ownerInfo?.name || 'Stone Hong'}</p>
                  {(group.representative?.localName || ownerInfo?.localName) && (
                    <span className="text-[10px] text-[#596061] font-medium mt-0.5">{group.representative?.localName || ownerInfo?.localName}</span>
                  )}
                </div>
                <p className="text-[11px] text-[#acb3b4] font-medium mt-0.5">
                  <span className="text-[#0057bd] font-bold">
                    {(() => {
                      let p = group.representative?.phone || ownerInfo?.phone;
                      if (!p || p === '010-9031-1557') p = '010-7209-2468';
                      if (p === '01072092468') p = '010-7209-2468';
                      return p;
                    })()}
                  </span> (Admin)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center" />
        </div>
      </div>

      {/* FAB Basket */}
      {selectedClasses.size > 0 && (
        <div className="fixed bottom-32 right-6 z-[220]">
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative"
          >
            <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
            <div className="absolute -top-1 -right-1 bg-error text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
              {selectedClasses.size}
            </div>
          </button>
        </div>
      )}

      {/* Item Details Popup Modal */}
      <UnifiedCheckoutModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setSelectedClasses(new Set());
          setPassSelectedClassIds(new Set());
          setClassPartners({});
        }}
        title={isDiscountSelected ? t('class.checkout.bundle_registration') : t('class.checkout.class_registration')}
        subtitle={isDiscountSelected ? undefined : `${group?.name || 'Club'} · ${monthDisplay}`}
        isSubmitDisabled={isDiscountSelected && passSelectedClassIds.size === 0}
        totalAmount={Array.from(selectedClasses).reduce((sum, id) => {
          const item = allItemsOriginal.find(c => c.id === id);
          return sum + (item?.amount || 0);
        }, 0)}
        currency={selectedClasses.size > 0 ? allItemsOriginal.find(c => c.id === Array.from(selectedClasses)[0])?.currency || 'KRW' : 'KRW'}
        onCheckout={handleCheckoutSubmit}
        isProcessing={isBooking}
        buttonText={t('class.submit_request')}
        bankDetails={{
          bankName: (group as any)?.classPaymentSettings?.bankDetails?.bankName || (group as any)?.bankDetails?.bankName || (group as any)?.bankName || 'Kookmin Bank',
          accountHolder: (group as any)?.classPaymentSettings?.bankDetails?.accountHolder || (group as any)?.bankDetails?.accountHolder || (group as any)?.accountHolder || group?.name || 'World of Community',
          accountNumber: (group as any)?.classPaymentSettings?.bankDetails?.accountNumber || (group as any)?.bankDetails?.accountNumber || (group as any)?.accountNumber || '123456-00-123456'
        }}
        onReportPayment={reportPayment}
      >
        <div className="space-y-6 py-2">
          {/* Role Selection */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">{t('class.checkout.select_role')} <span className="text-error">*</span></h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedRole('leader')}
                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${selectedRole === 'leader' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
              >
                <span className={`text-sm font-black uppercase ${selectedRole === 'leader' ? 'text-blue-700 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{t('class.checkout.role_leader')}</span>
              </button>
              <button
                onClick={() => setSelectedRole('follower')}
                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${selectedRole === 'follower' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
              >
                <span className={`text-sm font-black uppercase ${selectedRole === 'follower' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{t('class.checkout.role_follower')}</span>
              </button>
            </div>
          </div>

          {isDiscountSelected ? (
            <>
              {/* Bundle Info */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">{t('class.checkout.applied_bundle')}</h4>
                {Array.from(selectedClasses).map(classId => {
                  const item = allItemsOriginal.find(c => c.id === classId);
                  if (!item) return null;
                  return (
                    <div key={classId} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white truncate mr-2">{item.title}</span>
                      <span className="text-sm font-black text-neutral-900 dark:text-white whitespace-nowrap">
                        {item.currency === 'KRW' || !item.currency ? `₩${item.amount ? item.amount.toLocaleString() : '0'}` : `${item.amount ? item.amount.toLocaleString() : '0'} ${item.currency}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Participating Classes Checkbox */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">{t('class.checkout.select_classes_to_attend')} <span className="text-error">*</span></h4>
                <div className="space-y-2">
                  {(() => {
                    const passId = Array.from(selectedClasses)[0];
                    const pass = allItemsOriginal.find(c => c.id === passId);
                    const passClassIds = (pass as any)?.includedClassIds || [];
                    const passClasses = passClassIds.length > 0
                      ? allGroupClasses.filter(c => passClassIds.includes(c.id))
                      : allGroupClasses;

                    // 요일 추출 헬퍼
                    const getClassDay = (cls: any): string => {
                      if (cls.schedule && cls.schedule.length > 0) {
                        const day = getDayOfWeek(cls.schedule[0].date);
                        return day || 'MON';
                      }
                      return 'MON';
                    };

                    const getDayIndex = (day: string) => {
                      const idx = DAY_ORDER.indexOf(day as any);
                      return idx === -1 ? 99 : idx;
                    };

                    const DAY_LABELS_LANG: Record<string, { en: string; ko: string }> = {
                      MON: { en: 'Mon', ko: '월' },
                      TUE: { en: 'Tue', ko: '화' },
                      WED: { en: 'Wed', ko: '수' },
                      THU: { en: 'Thu', ko: '목' },
                      FRI: { en: 'Fri', ko: '금' },
                      SAT: { en: 'Sat', ko: '토' },
                      SUN: { en: 'Sun', ko: '일' },
                    };

                    const sortedPassClasses = [...passClasses].sort((a, b) => {
                      const dayA = getClassDay(a);
                      const dayB = getClassDay(b);
                      const idxA = getDayIndex(dayA);
                      const idxB = getDayIndex(dayB);
                      if (idxA !== idxB) return idxA - idxB;
                      const timeA = a.startTime || '00:00';
                      const timeB = b.startTime || '00:00';
                      return timeA.localeCompare(timeB);
                    });

                    return sortedPassClasses.map((cls: any, idx: number) => {
                      const day = getClassDay(cls);
                      const prevCls = idx > 0 ? sortedPassClasses[idx - 1] : null;
                      const prevDay = prevCls ? getClassDay(prevCls) : null;
                      const isNewDay = idx > 0 && day !== prevDay;
                      const dayLabel = language === 'KR' ? (DAY_LABELS_LANG[day]?.ko || '월') : (DAY_LABELS_LANG[day]?.en || 'Mon');
                      
                      let datesStr = '';
                      if (cls.schedule && cls.schedule.length > 0) {
                        const formattedDates = cls.schedule.map((s: any) => {
                          if (!s.date) return '';
                          const parts = s.date.split('.');
                          if (parts.length >= 3) {
                            return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                          }
                          return s.date;
                        }).filter(Boolean);
                        datesStr = formattedDates.join(', ');
                      }
                      const timeStr = `${cls.startTime || '00:00'} - ${cls.endTime || '00:00'}`;
                      const isChecked = passSelectedClassIds.has(cls.id);

                      return (
                        <React.Fragment key={cls.id}>
                          {isNewDay && (
                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-3" />
                          )}
                          <div className="flex flex-col p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-colors">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setPassSelectedClassIds(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(cls.id)) newSet.delete(cls.id);
                                    else newSet.add(cls.id);
                                    return newSet;
                                  });
                                }}
                                className="w-4.5 h-4.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 accent-blue-600 mt-0.5 shrink-0"
                              />
                              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded font-bold whitespace-nowrap shrink-0">
                                    {dayLabel}
                                  </span>
                                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{cls.title}</p>
                                </div>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-normal">
                                  {datesStr ? `${datesStr} (${timeStr})` : timeStr}
                                  {cls.instructors?.length > 0 && ` | ${cls.instructors.map((i: any) => i.name).join(', ')}`}
                                </p>
                              </div>
                            </label>

                            {isChecked && (
                              <div className="mt-2 pl-7 animate-in slide-in-from-top-1 duration-200">
                                <input
                                  type="text"
                                  value={classPartners[cls.id] || ''}
                                  onChange={(e) => {
                                    setClassPartners(prev => ({
                                      ...prev,
                                      [cls.id]: e.target.value
                                    }));
                                  }}
                                  placeholder={t('class.partner_name')}
                                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-[11px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-right">
                  {t('class.checkout.selected_label')}{passSelectedClassIds.size} / {(() => {
                    const passId = Array.from(selectedClasses)[0];
                    const pass = allItems.find(c => c.id === passId);
                    const passClassIds = (pass as any)?.includedClassIds || [];
                    return passClassIds.length > 0
                      ? allGroupClasses.filter(c => passClassIds.includes(c.id)).length
                      : allGroupClasses.length;
                  })()}
                </p>
              </div>
            </>
          ) : (
            /* Applied Items - 일반 클래스/번들 */
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">{t('class.checkout.applied_classes')}</h4>
              {Array.from(selectedClasses).map(classId => {
                const item = allItems.find(c => c.id === classId);
                if (!item) return null;
                return (
                  <div key={classId} className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white truncate mr-2">{item.title}</span>
                      <span className="text-sm font-black text-neutral-900 dark:text-white whitespace-nowrap">
                        {item.currency === 'KRW' || !item.currency ? `₩${item.amount ? item.amount.toLocaleString() : '0'}` : `${item.amount ? item.amount.toLocaleString() : '0'} ${item.currency}`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 animate-in slide-in-from-top-1 duration-200">
                      <input
                        type="text"
                        value={classPartners[classId] || ''}
                        onChange={(e) => {
                          setClassPartners(prev => ({
                            ...prev,
                            [classId]: e.target.value
                          }));
                        }}
                        placeholder={t('class.partner_name_placeholder') || "파트너 이름을 입력하세요"}
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notice */}
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
            <h4 className="text-[13px] font-black text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-blue-500">info</span> {t('class.booking_notice_title')}</h4>
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('class.booking_notice_desc')}
            </p>
          </div>
        </div>
      </UnifiedCheckoutModal>

      {/* Checkout Modal */}
      {selectedClassDetail && (
        <UnifiedCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          title={t('class.booking_special_title')}
          subtitle={`${selectedClassDetail.title} · ${selectedClassDetail.schedule?.[0]?.date ? new Date(selectedClassDetail.schedule[0].date).toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : (language === 'KR' ? '날짜 미정' : 'Date TBD')}`}
          totalAmount={selectedClassDetail.amount || 0}
          onCheckout={handleCheckoutSubmit}
          isProcessing={isBooking}
          buttonText={t('class.submit_request')}
          bankDetails={{
            bankName: (group as any)?.bankName || 'Kookmin Bank',
            accountHolder: (group as any)?.accountHolder || group?.name || 'World of Community',
            accountNumber: (group as any)?.accountNumber || '123456-00-123456'
          }}
          onReportPayment={reportPayment}
        >
          <div className="space-y-6 py-2">
            <div className="flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-700">
                {(selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group?.coverImage || group?.logo) ? (
                  <img src={selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group?.coverImage || group?.logo} alt={selectedClassDetail.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px] text-neutral-400">school</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-neutral-500 uppercase">{group?.name || 'World of Community'}</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{selectedClassDetail.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                    {selectedClassDetail.schedule?.[0]?.timeSlot || `${selectedClassDetail.startTime} - ${selectedClassDetail.endTime}`}
                  </span>
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                    {selectedClassDetail.location || group?.name}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">{t('class.checkout.select_role')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCheckoutRole('leader')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${checkoutRole === 'leader' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
                >
                  <span className={`text-sm font-black uppercase ${checkoutRole === 'leader' ? 'text-blue-700 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{t('class.leader')}</span>
                </button>
                <button
                  onClick={() => setCheckoutRole('follower')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${checkoutRole === 'follower' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
                >
                  <span className={`text-sm font-black uppercase ${checkoutRole === 'follower' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{t('class.follower')}</span>
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
              <h4 className="text-[13px] font-black text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-blue-500">info</span> {t('class.booking_notice_title')}</h4>
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('class.booking_notice_desc')}
              </p>
            </div>
          </div>
        </UnifiedCheckoutModal>
      )}

      <ClassDetail
        groupId={groupId}
        itemId={selectedClassDetail?.id}
        itemDetail={selectedClassDetail}
        isOpen={!!selectedClassDetail && !checkoutModalOpen}
        onClose={closeDetailModal}
      />
    </div>
  );
}
