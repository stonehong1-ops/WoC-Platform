"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import MyInfoBottomSheet from '@/components/profile/MyInfoBottomSheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateCareerDuration } from '@/utils/date';
import { formatLocalPhoneNumber } from '@/utils/phone';
import { socialService } from '@/lib/firebase/socialService';
import { eventService } from '@/lib/firebase/eventService';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import DJScheduleModal from '@/components/profile/DJScheduleModal';
import { toast } from 'sonner';
import { doc, updateDoc, collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { Social } from '@/types/social';
import { Event } from '@/types/event';
import { ClassRegistration } from '@/types/group';
import { groupService } from '@/lib/firebase/groupService';

const ADMIN_ITEMS = [
  { icon: 'view_carousel', label: 'BANNERS', labelKo: '배너관리', href: '/admin/banners' },
  { icon: 'wallpaper', label: 'PICs', labelKo: '사진관리', href: '/admin/pics' },
  { icon: 'person_search', label: 'People', labelKo: '피플관리', href: '/admin/people' },
  { icon: 'location_city', label: 'Place', labelKo: '장소관리', href: '/admin/place' },
  { icon: 'auto_awesome_mosaic', label: 'Covers', labelKo: '표지제작', href: '/admin/covers' },
  { icon: 'bug_report', label: 'Errors', labelKo: '에러로그', href: '/admin/errors' },
  { icon: 'terminal', label: 'Mobile Agent', labelKo: '모바일 에이전트', href: '/admin/antigravity' },
  { icon: 'settings_accessibility', label: 'FYS Admin', labelKo: 'FYS 관리', href: '/fys/admin', isExternal: true },
  { icon: 'more_horiz', label: 'Others', labelKo: '기타관리', href: '/admin/others' },
];

export default function MyInfoPage() {
  return (
    <Suspense fallback={null}>
      <MyInfoPageContent />
    </Suspense>
  );
}

function MyInfoPageContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminPopupHref, setAdminPopupHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { t, language, toggleLanguage } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'profile';
  const todayDate = new Date();
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth()); // 0-11
  
  // Modal state
  const [isDjModalOpen, setIsDjModalOpen] = useState(false);

  // Data states
  const [likedSocials, setLikedSocials] = useState<Social[]>([]);
  const [registeredClasses, setRegisteredClasses] = useState<ClassRegistration[]>([]);
  const [likedEvents, setLikedEvents] = useState<Event[]>([]);
  const [djSchedules, setDjSchedules] = useState<any[]>([]);
  const [tableReservations, setTableReservations] = useState<any[]>([]);
  const [classSchedulesMap, setClassSchedulesMap] = useState<Record<string, any>>({});
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Class Schedules Fetch Effect
  useEffect(() => {
    if (registeredClasses.length === 0) return;
    
    let active = true;
    const fetchClassSchedules = async () => {
      const uniqueClassKeys = new Set<string>();
      registeredClasses.forEach(reg => {
        if (!reg) return;
        if (reg.itemType === 'discount' && Array.isArray(reg.selectedClassIds)) {
          reg.selectedClassIds.forEach(cid => {
            if (reg.groupId && cid) {
              uniqueClassKeys.add(`${reg.groupId}:${cid}`);
            }
          });
        } else if (reg.groupId && reg.classId) {
          uniqueClassKeys.add(`${reg.groupId}:${reg.classId}`);
        }
      });

      const schedules: Record<string, any> = {};
      await Promise.all(
        Array.from(uniqueClassKeys).map(async (key) => {
          const [groupId, classId] = key.split(':');
          const classData = await groupService.getClassById(groupId, classId);
          if (classData && active) {
            schedules[key] = classData;
          }
        })
      );

      if (active) {
        setClassSchedulesMap(schedules);
      }
    };

    fetchClassSchedules();
    return () => {
      active = false;
    };
  }, [registeredClasses]);

  // Subscriptions
  useEffect(() => {
    if (!user?.uid) return;
    let isMounted = true;

    // 1. Liked Socials
    let unsubAllSocials: (() => void) | null = null;
    const unsubSocialLikes = socialService.subscribeMyLikes(user.uid, (likes) => {
      const likedIds = likes.map(l => l.socialId);
      
      // Cleanup previous allSocials subscription if any
      if (unsubAllSocials) unsubAllSocials();
      
      unsubAllSocials = socialService.subscribeAllSocials((allSocials) => {
        if (!isMounted) return;
        const filtered = allSocials.filter(s => likedIds.includes(s.id));
        setLikedSocials(filtered);

        // DJ Schedules (Extract from all socials where current user is registered as DJ)
        const djList: any[] = [];
        allSocials.forEach(s => {
          if (s.djs && Array.isArray(s.djs)) {
            s.djs.forEach(dj => {
              if (dj.djId === user.uid) {
                djList.push({
                  id: dj.id,
                  socialId: s.id,
                  socialTitle: s.titleNative || s.title,
                  venueName: s.venueNameNative || s.venueName,
                  date: dj.date, // YYYY-MM-DD
                  time: `${s.startTime} - ${s.endTime}`,
                  type: 'dj_schedule'
                });
              }
            });
          }
        });

        // 수동 등록 일정 병합
        if (profile?.customSchedules && Array.isArray(profile.customSchedules)) {
          profile.customSchedules.forEach((cs: any) => {
            djList.push({
              id: cs.id,
              socialId: 'none',
              socialTitle: cs.socialTitle,
              venueName: cs.location || '',
              date: cs.date,
              time: cs.time || '',
              type: 'dj_schedule_custom',
              rawDate: cs.date
            });
          });
        }

        setDjSchedules(djList);
      });
    });

    // 2. Class Bookings
    const unsubClasses = classRegistrationService.subscribeToUserRegistrations(user.uid, (regs) => {
      if (isMounted) {
        setRegisteredClasses(regs);
      }
    });

    // 3. Liked Events
    let unsubAllEvents: (() => void) | null = null;
    const unsubEventLikes = eventService.subscribeMyLikes(user.uid, (likedIds) => {
      if (unsubAllEvents) unsubAllEvents();
      unsubAllEvents = eventService.subscribeEvents((allEvents) => {
        if (isMounted) {
          const filtered = allEvents.filter(e => likedIds.includes(e.id));
          setLikedEvents(filtered);
        }
      });
    });

    // 4. Table Reservations
    const qReservations = query(
      collectionGroup(db, 'reservations'),
      where('userId', '==', user.uid)
    );
    const unsubReservations = onSnapshot(qReservations, async (snapshot) => {
      const resList = snapshot.docs.map(doc => {
        const dData = doc.data();
        return dData ? { id: doc.id, ...dData } : null;
      }).filter(Boolean) as any[];
      
      const activeRes = resList.filter(r => r && r.status !== 'rejected');
      
      const socialsMap: Record<string, Social> = {};
      await Promise.all(
        activeRes.map(async (r) => {
          if (r && r.socialId && !socialsMap[r.socialId]) {
            try {
              const socialData = await socialService.getSocialById(r.socialId);
              if (socialData) {
                socialsMap[r.socialId] = socialData;
              }
            } catch (err) {
              console.error("Error fetching social details inside reservation:", err);
            }
          }
        })
      );
      
      if (!isMounted) return;

      const mappedReservations = activeRes.map(r => {
        if (!r) return null;
        const social = r.socialId ? socialsMap[r.socialId] : null;
        return {
          id: r.id,
          socialId: r.socialId,
          title: social ? (social.titleNative || social.title) : 'Social',
          date: r.weekStartDate || '', // YYYY-MM-DD
          time: social ? `${social.startTime} - ${social.endTime}` : '',
          location: social ? (social.venueNameNative || social.venueName) : '',
          peopleCount: r.peopleCount || 1,
          status: r.status || 'pending',
          type: 'table_reservation'
        };
      }).filter(Boolean);
      
      setTableReservations(mappedReservations);
    }, (error) => {
      console.error("Error subscribing table reservations:", error);
    });

    return () => {
      isMounted = false;
      unsubSocialLikes();
      if (unsubAllSocials) unsubAllSocials();
      unsubClasses();
      unsubEventLikes();
      if (unsubAllEvents) unsubAllEvents();
      unsubReservations();
    };
  }, [user?.uid, profile?.customSchedules]);

  // Helper: Get list of dates in current Year-Month
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // Process and combine all schedule items for the current Year-Month
  const getMonthSchedules = () => {
    const items: { [key: string]: any[] } = {};
    const monthDays = getDaysInMonth(currentYear, currentMonth);

    const formatLocalDate = (day: Date) => {
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, '0');
      const d = String(day.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // 1. Regular/Popup Liked Socials
    likedSocials.forEach(social => {
      if (!social) return;
      if (social.type === 'regular' && social.dayOfWeek !== undefined) {
        // Regular social occurs on specific day of week
        monthDays.forEach(day => {
          if (day.getDay() === Number(social.dayOfWeek)) {
            const dateStr = formatLocalDate(day);
            if (!items[dateStr]) items[dateStr] = [];
            items[dateStr].push({
              id: `social-reg-${social.id}-${dateStr}`,
              socialId: social.id,
              type: 'social_like',
              title: social.titleNative || social.title,
              time: `${social.startTime} - ${social.endTime}`,
              location: social.venueNameNative || social.venueName
            });
          }
        });
      } else if (social.type === 'popup' && social.date) {
        // Popup social occurs on specific Timestamp date
        const sDate = typeof social.date.toDate === 'function' ? social.date.toDate() : new Date((social.date as any).seconds * 1000);
        if (isNaN(sDate.getTime())) return;
        if (sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth) {
          const dateStr = formatLocalDate(sDate);
          if (!items[dateStr]) items[dateStr] = [];
          items[dateStr].push({
            id: `social-pop-${social.id}`,
            socialId: social.id,
            type: 'social_like',
            title: social.titleNative || social.title,
            time: `${social.startTime} - ${social.endTime}`,
            location: social.venueNameNative || social.venueName
          });
        }
      }
    });

    // 2. Class Bookings (using classSchedulesMap to fetch actual schedules)
    registeredClasses.forEach(reg => {
      if (!reg || reg.status === 'CANCELED') return;

      const getSchedulesForClass = (groupId: string, classId: string) => {
        const classKey = `${groupId}:${classId}`;
        const classInfo = classSchedulesMap[classKey];
        if (classInfo && Array.isArray(classInfo.schedule)) {
          classInfo.schedule.forEach((sch: any) => {
            if (sch && sch.date) {
              const sDate = typeof sch.date.toDate === 'function' ? sch.date.toDate() : new Date(sch.date);
              if (isNaN(sDate.getTime())) return;
              if (sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth) {
                const dateStr = formatLocalDate(sDate);
                if (!items[dateStr]) items[dateStr] = [];
                items[dateStr].push({
                  id: `class-sch-${reg.id}-${classId}-${sch.week}`,
                  type: 'class_reg',
                  title: `${classInfo.title || 'Class'} (${sch.week}${language === 'KR' ? '주차' : ' Weeks'})`,
                  location: classInfo.location || reg.groupName || '',
                  time: sch.timeSlot || `${classInfo.startTime || ''} - ${classInfo.endTime || ''}`,
                  status: reg.status
                });
              }
            }
          });
        }
      };

      if (reg.itemType === 'discount' && Array.isArray(reg.selectedClassIds)) {
        reg.selectedClassIds.forEach(cid => {
          if (reg.groupId && cid) {
            getSchedulesForClass(reg.groupId, cid);
          }
        });
      } else if (reg.groupId && reg.classId) {
        getSchedulesForClass(reg.groupId, reg.classId);
      }
    });

    // 3. Liked Events (lasts from startDate to endDate)
    likedEvents.forEach(event => {
      if (!event || !event.startDate) return;
      const start = typeof event.startDate.toDate === 'function' ? event.startDate.toDate() : new Date((event.startDate as any).seconds * 1000);
      if (isNaN(start.getTime())) return;
      const end = event.endDate 
        ? (typeof event.endDate.toDate === 'function' ? event.endDate.toDate() : new Date((event.endDate as any).seconds * 1000))
        : start;
      if (isNaN(end.getTime())) return;
      
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      monthDays.forEach(day => {
        if (day >= startDay && day <= endDay) {
          const dateStr = formatLocalDate(day);
          if (!items[dateStr]) items[dateStr] = [];
          items[dateStr].push({
            id: `event-like-${event.id}-${dateStr}`,
            eventId: event.id,
            type: 'event_like',
            title: event.titleNative || event.title,
            location: event.location,
            time: event.subtitle || ''
          });
        }
      });
    });

    // 4. DJ Schedules
    djSchedules.forEach(dj => {
      if (!dj || !dj.date || typeof dj.date !== 'string') return;
      const djDate = new Date(dj.date.replace(/-/g, '/'));
      if (isNaN(djDate.getTime())) return;
      if (djDate.getFullYear() === currentYear && djDate.getMonth() === currentMonth) {
        const dateStr = dj.date;
        if (!items[dateStr]) items[dateStr] = [];
        items[dateStr].push({
          id: `dj-sched-${dj.id}`,
          socialId: dj.socialId,
          type: 'dj_schedule',
          title: `🎧 DJ: ${dj.socialTitle}`,
          time: dj.time,
          location: dj.venueName,
          rawDate: dj.date
        });
      }
    });

    // 5. Table Reservations
    tableReservations.forEach(res => {
      if (!res || !res.date || typeof res.date !== 'string') return;
      const resDate = new Date(res.date.replace(/-/g, '/'));
      if (isNaN(resDate.getTime())) return;
      if (resDate.getFullYear() === currentYear && resDate.getMonth() === currentMonth) {
        const dateStr = res.date;
        if (!items[dateStr]) items[dateStr] = [];
        items[dateStr].push({
          id: `table-res-${res.id}`,
          socialId: res.socialId,
          type: 'table_reservation',
          title: `🪑 ${t('social.tab_booking', 'Table Reservation')}: ${res.title}`,
          time: res.time,
          location: `${res.location} (${res.peopleCount}${language === 'KR' ? '명' : ' guests'})`,
          status: res.status
        });
      }
    });

    return items;
  };

  const currentMonthSchedules = getMonthSchedules();
  const sortedDates = Object.keys(currentMonthSchedules).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRemoveDjSchedule = async (socialId: string, date: string, itemId?: string) => {
    if (!user?.uid) return;
    if (!confirm(t('myinfo.remove_confirm'))) return;
    try {
      if (socialId === 'none' && itemId) {
        const updatedCustomSchedules = (profile?.customSchedules || []).filter((cs: any) => cs.id !== itemId);
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          customSchedules: updatedCustomSchedules
        });
        toast.success(t('myinfo.remove_success'));
      } else {
        await socialService.removeDjFromSocial(socialId, user.uid, date);
        toast.success(t('myinfo.remove_success'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('social.alert_failed_remove_dj') || '삭제에 실패했습니다.');
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('my.access_denied')}</h1>
        <p className="text-gray-500 mb-8">{t('my.sign_in_required')}</p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-primary text-white rounded-full font-bold"
        >
          {t('my.go_home')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* 이중 탭 레이아웃이 제거되었습니다 */}

        {tab === 'profile' && (
          <>
            {/* Profile Hero Section (Ultra-compact & Premium Card-like look) */}
            <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-surface-container-lowest to-surface-container/30 border border-surface-container shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-full border-2 border-surface-container-lowest shadow-md bg-surface-container">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nickname || 'User')}&background=1A73E8&color=fff`}
                      alt={t('my.profile_photo')}
                    />
                  </div>
                  <div 
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute -bottom-0.5 -right-0.5 bg-primary text-white p-1.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center z-10 border-2 border-surface"
                  >
                    <span className="material-symbols-outlined !text-[12px]">edit</span>
                  </div>
                </div>
                
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface font-headline truncate">
                      {profile?.nickname || user?.displayName || t('my.default_nickname')}
                    </h1>
                    <div className="flex flex-wrap gap-1">
                      {profile?.isInstructor && (
                        <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[9px] font-bold uppercase tracking-tighter">{t('my.role_instructor')}</span>
                      )}
                      {profile?.isDj && (
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase tracking-tighter">DJ</span>
                      )}
                      {profile?.isServiceProvider && (
                        <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[9px] font-bold uppercase tracking-tighter">{t('my.role_pro')}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-on-surface-variant font-medium text-xs md:text-sm line-clamp-1">
                    {profile?.bio || t('my.default_bio')}
                  </p>
                </div>
              </div>

              {/* New Compact Edit Button In Hero Section */}
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-1.5 self-start sm:self-center px-4 py-2 bg-primary/10 hover:bg-primary/15 active:scale-95 text-primary text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-primary/20 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">edit_square</span>
                <span>{t('my.modify_profile', 'Edit Profile')}</span>
              </button>
            </div>
            {/* Info Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Identity Card */}
              <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[24px]">account_circle</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.login_method')}</p>
                    <p className="text-on-surface font-medium">
                      {profile?.authMethod 
                        ? t(`my.auth_${profile.authMethod.toLowerCase()}`) 
                        : t('my.auth_google')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[24px]">fingerprint</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.gender')}</p>
                    <p className="text-on-surface font-medium">
                      {profile?.gender 
                        ? t(`my.gender_${profile.gender.toLowerCase()}`) 
                        : t('my.gender_other')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[24px]">alternate_email</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.email_address')}</p>
                    <p className="text-on-surface font-medium truncate max-w-[200px]">{user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center mb-6">
                  <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[24px]">call</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.cell_phone')}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-on-surface font-medium">{profile?.countryCode}</span>
                      <span className="text-on-surface font-medium">
                        {profile?.phoneNumber 
                          ? formatLocalPhoneNumber(profile.phoneNumber, profile.countryCode || '+1 (US)') 
                          : t('my.not_linked')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 items-center mb-6">
                  <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[24px]">timeline</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('myinfo.career')}</p>
                    <p className="text-on-surface font-medium">
                      {profile?.career 
                        ? calculateCareerDuration(profile.career, t) 
                        : t('my.not_linked')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('myinfo.allow_calls')}</p>
                    <p className="text-on-surface font-medium">
                      {profile?.allowPhoneCalls !== false 
                        ? t('myinfo.allow_calls_on') 
                        : t('myinfo.allow_calls_off')}
                    </p>
                  </div>
                </div>


                {/* Social Links on Profile */}
                <div className="flex gap-4 items-start mt-6 pt-6 border-t border-surface-container-highest/30">
                  <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[24px]">link</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Social Links</p>
                    <div className="flex flex-wrap gap-2">
                      {profile?.socialLinks?.facebook ? (
                        <a href={profile.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full hover:bg-primary/10 transition-colors text-[13px] font-bold text-on-surface-variant hover:text-primary border border-outline-variant/30">
                          <span className="material-symbols-outlined text-[16px]">face_nod</span>
                          Facebook
                        </a>
                      ) : null}
                      {profile?.socialLinks?.instagram ? (
                        <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full hover:bg-primary/10 transition-colors text-[13px] font-bold text-on-surface-variant hover:text-primary border border-outline-variant/30">
                          <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                          Instagram
                        </a>
                      ) : null}
                      {profile?.socialLinks?.whatsapp ? (
                        <a href={profile.socialLinks.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full hover:bg-primary/10 transition-colors text-[13px] font-bold text-on-surface-variant hover:text-primary border border-outline-variant/30">
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          WhatsApp
                        </a>
                      ) : null}
                      {(!profile?.socialLinks?.facebook && !profile?.socialLinks?.instagram && !profile?.socialLinks?.whatsapp) && (
                        <p className="text-on-surface-variant/70 font-medium text-sm mt-1">{t('my.not_linked', '연결 안됨')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Summary Card - Redesigned to Premium Champagne Gold Bento */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-rose-50/50 border border-amber-200/50 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                {/* Subtle glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl group-hover:bg-amber-200/30 transition-all duration-500" />
                <div>
                  <p className="text-[10px] font-extrabold text-amber-800/80 uppercase tracking-widest mb-2">{t('my.pro_status')}</p>
                  <div className="flex items-center gap-2 mb-3.5">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{t('my.verified')}</h2>
                    <span className="material-symbols-outlined text-amber-500 fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{t('my.verified_desc')}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-amber-200/40">
                  <p className="text-[10px] font-extrabold text-amber-800/80 uppercase tracking-widest mb-3.5">{t('my.additional_verification')}</p>
                  <button className="w-full py-3 px-4 bg-white/95 hover:bg-white active:scale-98 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow">
                    <span className="material-symbols-outlined text-sm text-amber-600">verified_user</span>
                    {t('my.apply_badge')}
                  </button>
                </div>
              </div>

              {/* Preferences & Support Bento Card (Unified Settings Hub) */}
              <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
                    <h3 className="text-xs font-black text-outline uppercase tracking-widest">{language === 'KR' ? '설정 및 고객지원' : 'PREFERENCES & SUPPORT'}</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {language === 'KR' 
                      ? '다국어 환경을 제어하고 AI 고객지원 서비스를 실시간으로 이용할 수 있습니다.' 
                      : 'Manage language preferences and get immediate AI assistant support.'}
                  </p>
                </div>

                {/* Hub Row Items */}
                <div className="space-y-4">
                  {/* Row 1: AI Helpdesk Route */}
                  <div 
                    onClick={() => router.push('/helpdesk')}
                    className="flex items-center justify-between p-3.5 bg-surface-container/50 hover:bg-surface-container hover:border-primary/20 border border-transparent rounded-xl cursor-pointer active:scale-98 transition-all duration-200 group/item"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary group-hover/item:scale-105 transition-transform shrink-0">
                        <span className="material-symbols-outlined text-[20px]">support_agent</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-on-surface tracking-tight">{t('header.help_desk', 'HELP DESK')}</h4>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{language === 'KR' ? 'AI 상담원과 1:1 채팅 문의' : '1:1 chat support with AI agent'}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-outline group-hover/item:translate-x-0.5 transition-transform">arrow_forward_ios</span>
                  </div>

                  {/* Row 2: One-touch Language Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-surface-container/50 border border-transparent rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">translate</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-on-surface tracking-tight">{language === 'KR' ? '앱 언어 설정' : 'Application Language'}</h4>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{language === 'KR' ? '한글 / 영어 원터치 전환' : 'One-touch language switch'}</p>
                      </div>
                    </div>
                    
                    {/* Premium Sliding Toggle Pill */}
                    <div 
                      onClick={toggleLanguage}
                      className="flex items-center p-0.5 bg-surface-container rounded-full border border-outline/10 w-24 shrink-0 shadow-inner relative h-7 cursor-pointer hover:border-outline/20 transition-colors"
                    >
                      {/* Active Underlay */}
                      <div 
                        className={`absolute top-0.5 bottom-0.5 rounded-full bg-primary text-white shadow-sm transition-all duration-300 ${
                          language === 'KR' ? 'left-0.5 w-[45px]' : 'left-[46.5px] w-[45px]'
                        }`} 
                      />
                      <div className={`relative z-10 w-1/2 text-center text-[9px] font-black tracking-tight leading-6 transition-colors ${language === 'KR' ? 'text-white' : 'text-on-surface-variant'}`}>
                        KR
                      </div>
                      <div className={`relative z-10 w-1/2 text-center text-[9px] font-black tracking-tight leading-6 transition-colors ${language === 'EN' ? 'text-white' : 'text-on-surface-variant'}`}>
                        EN
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Description Section */}
            <div className="mt-16 border-t border-surface-container pt-12">
              <h2 className="text-xl font-bold text-on-surface mb-8 font-headline">{t('my.access_rights')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_instructor')}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.instructor_desc')}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_organizer')}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.organizer_desc')}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_dj')}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.dj_desc')}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_pro')}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.pro_desc')}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="mt-12 pt-8 flex justify-center pb-4">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-error font-bold hover:bg-error/10 transition-colors border border-error/20"
              >
                <span className="material-symbols-outlined">logout</span>
                {t('my.logout')}
              </button>
            </div>

            {/* Admin Section (Slimmer, flatter, elegant panel) */}
            {profile?.isAdmin && (
              <div className="mt-4 mb-8 border-t border-dashed border-surface-container pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined !text-[16px] text-error/60">admin_panel_settings</span>
                  <span className="text-[10px] font-black tracking-[0.25em] uppercase text-error/60">Admin Controls</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ADMIN_ITEMS.map((item) => {
                    if ((item as any).isExternal) {
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container hover:border-error/20 hover:shadow-sm transition-all active:scale-98 text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-error/5 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined !text-[16px] text-error/70">{item.icon}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-black text-on-surface uppercase tracking-tight block truncate">{item.label}</span>
                            <span className="text-[9px] text-on-surface-variant font-medium block uppercase tracking-tighter mt-0.5">
                              {language === 'KR' ? item.labelKo : 'Manage Tools'}
                            </span>
                          </div>
                        </a>
                      );
                    }
                    return (
                      <button
                        key={item.href}
                        onClick={() => setAdminPopupHref(item.href)}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container hover:border-error/20 hover:shadow-sm transition-all active:scale-98 text-left w-full"
                      >
                        <div className="w-8 h-8 rounded-lg bg-error/5 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined !text-[16px] text-error/70">{item.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-black text-on-surface uppercase tracking-tight block truncate">{item.label}</span>
                          <span className="text-[9px] text-on-surface-variant font-medium block uppercase tracking-tighter mt-0.5">
                            {language === 'KR' ? item.labelKo : 'Manage Tools'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'schedule' && (
          <div className="space-y-6">
            {/* Schedule Header / Selector */}
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 bg-surface-container-lowest p-4 sm:p-6 rounded-2xl border border-surface-container shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(prev => prev - 1);
                    } else {
                      setCurrentMonth(prev => prev - 1);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                >
                  <span className="material-symbols-rounded">chevron_left</span>
                </button>
                <h2 className="text-lg font-black text-on-surface tracking-tight min-w-[100px] text-center">
                  {currentYear}. {String(currentMonth + 1).padStart(2, '0')}
                </h2>
                <button 
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(prev => prev + 1);
                    } else {
                      setCurrentMonth(prev => prev + 1);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                >
                  <span className="material-symbols-rounded">chevron_right</span>
                </button>
              </div>

              {(profile?.isDj || profile?.isAdmin || profile?.systemRole === 'admin') && (
                <button 
                  onClick={() => setIsDjModalOpen(true)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 active:scale-95 text-primary text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border border-primary/20 shrink-0"
                >
                  <span className="material-symbols-rounded text-[14px]">headphones</span>
                  <span>{t('myinfo.dj_schedule_add')}</span>
                </button>
              )}
            </div>

            {/* Schedule List */}
            {sortedDates.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-surface-container rounded-2xl bg-surface-container-lowest">
                <span className="material-symbols-rounded text-4xl text-outline mb-2">calendar_today</span>
                <p className="text-sm font-bold text-outline">{t('myinfo.no_schedules')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDates.map(dateStr => {
                  if (!dateStr || typeof dateStr !== 'string') return null;
                  const d = new Date(dateStr.replace(/-/g, '/'));
                  if (isNaN(d.getTime())) return null;
                  const dateLocale = language === 'KR' ? 'ko-KR' : 'en-US';
                  const weekdayStr = d.toLocaleDateString(dateLocale, { weekday: 'short' });
                  const dayNum = d.getDate();

                  return (
                    <div key={dateStr} className="flex gap-4 items-start animate-in fade-in duration-200">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center w-14 shrink-0 bg-surface-container p-2.5 rounded-xl border border-surface-container-high shadow-sm">
                        <span className="text-lg font-black text-on-surface">{dayNum}</span>
                        <span className="text-[10px] font-black text-outline uppercase tracking-wider mt-0.5">{weekdayStr}</span>
                      </div>

                      {/* Items */}
                      <div className="flex-1 space-y-2 min-w-0">
                        {currentMonthSchedules[dateStr].map(item => (
                          <div key={item.id} className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className={`material-symbols-outlined rounded-full p-2 text-sm shrink-0 ${
                                item.type === 'dj_schedule' ? 'bg-purple-100 text-purple-700' :
                                item.type === 'social_like' ? 'bg-emerald-100 text-emerald-700' :
                                item.type === 'class_reg' ? 'bg-blue-100 text-blue-700' :
                                item.type === 'table_reservation' ? 'bg-amber-100 text-amber-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {item.type === 'dj_schedule' ? 'headphones' :
                                 item.type === 'social_like' ? 'event' :
                                 item.type === 'class_reg' ? 'school' :
                                 item.type === 'table_reservation' ? 'event_seat' :
                                 'festival'}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate">{item.title}</p>
                                <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-outline font-medium mt-0.5">
                                  {item.time && <span className="flex items-center gap-0.5">⏰ {item.time}</span>}
                                  {item.location && <span className="flex items-center gap-0.5">📍 {item.location}</span>}
                                </div>
                              </div>
                            </div>
                            
                            {(item.type === 'dj_schedule' || item.type === 'dj_schedule_custom') && (
                              <button 
                                onClick={() => handleRemoveDjSchedule(item.socialId, item.rawDate, item.id)}
                                className="w-8 h-8 flex items-center justify-center text-outline hover:text-error hover:bg-error/5 rounded-full transition-colors shrink-0 ml-2"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Full Popup ??Fullscreen */}
      {mounted && adminPopupHref && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in duration-200">
          {/* Popup Header */}
          <div className="flex items-center justify-between px-5 h-14 bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px] text-error/60">admin_panel_settings</span>
              <span className="text-sm font-bold text-on-surface uppercase tracking-wide">
                {ADMIN_ITEMS.find(a => a.href === adminPopupHref)?.label || 'Admin'}
              </span>
            </div>
            <button 
              onClick={() => setAdminPopupHref(null)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined !text-[18px] text-on-surface">close</span>
            </button>
          </div>
          {/* Popup Content ??iframe to admin page */}
          <iframe 
            src={adminPopupHref}
            className="w-full flex-1 border-0"
            title="Admin Panel"
          />
        </div>,
        document.body
      )}

      {/* DJ Schedule Modal */}
      {(profile?.isDj || profile?.isAdmin || profile?.systemRole === 'admin') && (
        <DJScheduleModal
          isOpen={isDjModalOpen}
          onClose={() => setIsDjModalOpen(false)}
          djId={user?.uid || ''}
          djName={profile?.nickname || user?.displayName || ''}
        />
      )}

      {/* Edit Form Bottom Sheet */}
      <MyInfoBottomSheet 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
