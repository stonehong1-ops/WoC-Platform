'use client';

// 클래스, 월간 패스, 패키지 할인의 상세 정보를 단일 조회하여 보여주는 초경량 정보 모달 컴포넌트

import React, { useEffect, useState } from 'react';
import Portal from '@/components/common/Portal';
import { useLanguage } from '@/contexts/LanguageContext';
import UserProfileClickable from '@/components/common/UserProfileClickable';
import UserBadge from '@/components/common/UserBadge';
import { MapSelectorBottomSheet, MapType } from '@/components/common/MapSelectorBottomSheet';
import { groupService } from '@/lib/firebase/groupService';
import { GroupClass, ClassDiscount, ClassScheduleEntry } from '@/types/group';

interface ClassDetailProps {
  groupId: string;
  onClose?: () => void;
  isOpen: boolean;
  itemId?: string;
  itemDetail?: GroupClass | ClassDiscount | null;
  isModal?: boolean;
}

export default function ClassDetail({ groupId, onClose, isOpen, itemId, itemDetail: propItemDetail }: ClassDetailProps) {
  const { language } = useLanguage();
  const [itemDetail, setItemDetail] = useState<GroupClass | ClassDiscount | any | null>(propItemDetail || null);
  const [loading, setLoading] = useState(!propItemDetail);
  const [isScrolled, setIsScrolled] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [groupImage, setGroupImage] = useState<string>('');
  const [selectedMapLocation, setSelectedMapLocation] = useState<string | null>(null);
  const [hasMapCache, setHasMapCache] = useState<boolean>(false);
  const [cachedMapBrand, setCachedMapBrand] = useState<string>('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const updateCacheState = () => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('woc_preferred_map') as MapType | null;
    if (cached) {
      setHasMapCache(true);
      const brandNames: Record<string, string> = {
        naver: language === 'KR' ? '네이버 지도' : 'Naver Map',
        kakao: language === 'KR' ? '카카오맵' : 'Kakao Map',
        google: language === 'KR' ? '구글 지도' : 'Google Map'
      };
      setCachedMapBrand(brandNames[cached] || cached);
    } else {
      setHasMapCache(false);
      setCachedMapBrand('');
    }
  };

  useEffect(() => {
    updateCacheState();
  }, [isOpen, language]);

  const handleResetMapPreference = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    localStorage.removeItem('woc_preferred_map');
    updateCacheState();
  };

  const handleOpenMapSelector = (location: string) => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('woc_preferred_map') as MapType | null;
      if (cached) {
        const encoded = encodeURIComponent(location);
        const getMapLink = (type: MapType, name: string) => {
          switch (type) {
            case 'naver': return `https://map.naver.com/v5/search/${encoded}`;
            case 'kakao': return `https://map.kakao.com/?q=${encoded}`;
            case 'google': return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
            default: return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
          }
        };
        window.open(getMapLink(cached, location), '_blank');
        return;
      }
    }
    setSelectedMapLocation(location);
    setTimeout(updateCacheState, 100);
  };

  useEffect(() => {
    if (!groupId || !isOpen) return;
    const fetchGroupImage = async () => {
      try {
        const groupData = await groupService.getGroup(groupId);
        if (groupData) {
          setGroupImage(groupData.coverImage || groupData.logo || '');
        }
      } catch (e) {
        console.error("Failed to fetch group image in ClassDetail:", e);
      }
    };
    fetchGroupImage();
  }, [groupId, isOpen]);

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
        const classData = await groupService.getClassById(groupId, id);
        if (classData) {
          setItemDetail({ itemType: 'class', ...classData });
          return;
        }

        // 2. discounts 컬렉션 조회
        const discountData = await groupService.getDiscountById(groupId, id);
        if (discountData) {
          setItemDetail({ itemType: 'discount', ...discountData });
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
    if (language === 'KR') {
      switch (type) {
        case 'discount': return '패키지 할인';
        case 'class': return '일반 클래스';
        default: return '클래스';
      }
    }
    switch (type) {
      case 'discount': return 'Bundle Package';
      case 'class': return 'Regular Class';
      default: return 'Class';
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
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
            <p className="text-sm font-bold text-[#acb3b4]">
              {language === 'KR' ? '상세 정보를 불러오는 중입니다...' : 'Loading details...'}
            </p>
          </div>
        ) : itemDetail ? (
          <div className="max-w-[56rem] mx-auto w-full">
            {/* Cover Image */}
            <div className="relative aspect-square md:aspect-[16/9] w-full overflow-hidden bg-[#f2f4f4] flex items-center justify-center">
              {(() => {
                const coverKey = `cover-img-${itemDetail.id}`;
                const hasCoverError = imageErrors[coverKey];
                const displayImageUrl = itemDetail.imageUrl || itemDetail.image || itemDetail.photoURL || itemDetail.avatar || groupImage;
                if (hasCoverError || !displayImageUrl) {
                  return <span className="material-symbols-outlined text-[#acb3b4] text-8xl z-10">school</span>;
                }
                return (
                  <img 
                    src={displayImageUrl} 
                    alt={itemDetail.title} 
                    className="w-full h-full object-cover absolute inset-0"
                    onError={() => {
                      setImageErrors(prev => ({ ...prev, [coverKey]: true }));
                    }}
                  />
                );
              })()}
              {itemDetail.itemType === 'discount' && (
                <span className="absolute top-20 left-4 z-20 bg-[#d97706] text-white text-xs font-black px-3 py-1 rounded-full">
                  {language === 'KR' ? '패키지 할인 상품' : 'Bundle Deal'}
                </span>
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
                  {language === 'KR' ? '난이도' : 'Level'}: {(() => {
                    if (language !== 'KR') return itemDetail.level;
                    const lvl = String(itemDetail.level).toUpperCase();
                    if (lvl.includes('ALL')) return '모든 레벨';
                    if (lvl.includes('BEGINNER')) return '초급';
                    if (lvl.includes('INTERMEDIATE')) return '중급';
                    if (lvl.includes('ADVANCED')) return '고급';
                    return itemDetail.level;
                  })()}
                </p>
              )}
              
              <div className="mt-4">
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">
                  {language === 'KR' ? '설명' : 'Description'}
                </p>
                <p className="text-sm text-[#596061] leading-relaxed whitespace-pre-line">
                  {itemDetail.description || itemDetail.discountDescription || (language === 'KR' ? '등록된 설명이 없습니다.' : 'No description provided.')}
                </p>
              </div>
            </div>

            {/* Schedule & Location block */}
            <div className="px-5 py-4 space-y-4">
              {itemDetail.location && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-black text-[#596061] uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[#acb3b4] text-[15px]">location_on</span>
                    {language === 'KR' ? '장소' : 'Venue'}
                  </div>

                  {/* 스마트 지도 연동 샘플 적용 */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleOpenMapSelector(itemDetail.location!)}
                      className="flex items-center justify-between w-full p-3.5 bg-[#0057bd]/5 hover:bg-[#0057bd]/10 active:scale-[0.99] border border-[#0057bd]/10 rounded-2xl transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-outlined text-[18px] text-[#0057bd] shrink-0">
                          navigation
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-[#242c51] truncate">
                            {itemDetail.location}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {hasMapCache 
                              ? `${cachedMapBrand}${language === 'KR' ? '(으)로 즉시 바로 연결됨' : ' (Direct connection)'}`
                              : language === 'KR' ? '터치하여 길찾기 지도 연결' : 'Tap to open map navigation'}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#0057bd] text-[16px] shrink-0">
                        chevron_right
                      </span>
                    </button>

                    {/* 스마트 선호도 초기화 칩 */}
                    {hasMapCache && (
                      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in duration-200">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {cachedMapBrand}{language === 'KR' ? '(으)로 자동 연결 중' : ' set as default map'}
                        </span>
                        <button
                          onClick={handleResetMapPreference}
                          className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[12px]">refresh</span>
                          {language === 'KR' ? '지도 변경하기' : 'Change Map'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {itemDetail.schedule && itemDetail.schedule.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">calendar_month</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">
                      {language === 'KR' ? '일정' : 'Schedule'}
                    </p>
                    {itemDetail.schedule.map((sched: ClassScheduleEntry, idx: number) => {
                      // sched.date가 Timestamp 객체인 경우 등 모든 시나리오에 대비한 방어 코드
                      const dateObj = (() => {
                        const sDate = sched.date as any;
                        if (!sDate) return new Date();
                        if (typeof sDate.toDate === 'function') return sDate.toDate();
                        if (sDate.seconds) return new Date(sDate.seconds * 1000);
                        const parsed = new Date(sDate);
                        return isNaN(parsed.getTime()) ? new Date() : parsed;
                      })();
                      
                      const month = dateObj.toLocaleString('en-US', { month: 'short' });
                      const day = dateObj.getDate();
                      const formattedDate = language === 'KR' 
                        ? (isNaN(day) ? '미정' : `${dateObj.getMonth() + 1}월 ${day}일`)
                        : (isNaN(day) ? 'TBD' : `${month} ${day}`);
                      return (
                        <div key={idx} className="mt-1.5">
                          <p className="text-sm font-bold text-[#2d3435]">
                            {formattedDate}{' '}
                            <span className="font-normal text-[#596061] ml-1">
                              {sched.timeSlot || `${itemDetail.startTime || ''} - ${itemDetail.endTime || ''}`}
                            </span>
                          </p>
                          {sched.content ? <p className="text-xs text-[#acb3b4] mt-0.5">{sched.content}</p> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!!(itemDetail.maxCapacity || itemDetail.leaderCount || itemDetail.followerCount) && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">group</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">
                      {language === 'KR' ? '정원' : 'Capacity'}
                    </p>
                    <div className="flex gap-4 mt-1">
                      {itemDetail.leaderCount !== undefined && (
                        <div>
                          <p className="text-sm font-bold text-primary">{itemDetail.leaderCount}</p>
                          <p className="text-[10px] text-[#acb3b4]">{language === 'KR' ? '남성 (리더)' : 'Male'}</p>
                        </div>
                      )}
                      {itemDetail.followerCount !== undefined && (
                        <div>
                          <p className="text-sm font-bold text-tertiary">{itemDetail.followerCount}</p>
                          <p className="text-[10px] text-[#acb3b4]">{language === 'KR' ? '여성 (팔로어)' : 'Female'}</p>
                        </div>
                      )}
                      {itemDetail.leaderCount === undefined && itemDetail.followerCount === undefined && itemDetail.maxCapacity && (
                        <div>
                          <p className="text-sm font-bold text-[#2d3435]">{itemDetail.maxCapacity}</p>
                          <p className="text-[10px] text-[#acb3b4]">{language === 'KR' ? '전체 정원' : 'Total'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Included Classes 정적 목록 (번들인 경우 단순 텍스트 정보로만 렌더링) */}
            {itemDetail.itemType === 'discount' && itemDetail.includedClasses && itemDetail.includedClasses.length > 0 && (
              <div className="mx-5 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
                <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">school</span>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {language === 'KR' ? '포함된 클래스' : 'Included Classes'}
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {itemDetail.includedClasses.map((cls: GroupClass, index: number) => (
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
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-4">
                  {language === 'KR' ? '강사' : 'Instructors'}
                </p>
                <div className="flex flex-col gap-3">
                  {itemDetail.instructors.map((inst: { name: string; avatar?: string; role: string; userId?: string }, idx: number) => (
                    <div key={inst.userId || idx} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-2xl p-3">
                      <UserBadge
                        uid={inst.userId || ''}
                        nickname={inst.name}
                        photoURL={inst.avatar}
                        avatarSize="w-9 h-9"
                        nameClassName="font-bold text-sm text-[#2d3435]"
                        nativeClassName="text-xs font-semibold text-slate-400 ml-1.5"
                      />
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
            <h3 className="text-[#2d3435] font-black mb-1">
              {language === 'KR' ? '정보를 찾을 수 없습니다.' : 'Item Not Found'}
            </h3>
            <p className="text-[#acb3b4] text-xs font-medium">
              {language === 'KR' ? '선택하신 클래스 또는 패스 정보를 불러올 수 없습니다.' : 'The selected class or pass could not be retrieved.'}
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Price Bar - 오직 CLOSE 버튼만 존재 */}
      {itemDetail && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-[260] bg-white border-t border-[#f2f4f4] px-5 py-4 flex items-center justify-between max-w-[56rem] mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest">
              {language === 'KR' ? '금액' : 'Price'}
            </span>
            <span className="text-lg font-black text-primary font-headline">
              {itemDetail.amount?.toLocaleString()} <span className="text-xs uppercase font-bold">{itemDetail.currency || 'KRW'}</span>
            </span>
          </div>
          <button 
            onClick={handleClose}
            className="bg-[#f2f4f4] text-[#596061] px-8 py-3 rounded-full text-xs font-black tracking-wide active:scale-95 transition-all"
          >
            {language === 'KR' ? '닫기' : 'CLOSE'}
          </button>
        </div>
      )}
      {/* Map selector bottomsheet integration */}
      {selectedMapLocation && (
        <MapSelectorBottomSheet
          isOpen={!!selectedMapLocation}
          onClose={() => {
            setSelectedMapLocation(null);
            updateCacheState();
          }}
          locationName={selectedMapLocation}
        />
      )}
    </div>
  );

  return <Portal>{contentLayout}</Portal>;
}

