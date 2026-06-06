'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { coachingService, CoachingRoom } from '@/lib/firebase/coachingService';
import { userService } from '@/lib/firebase/userService';
import { PlatformUser } from '@/types/user';
import BottomSheet from '@/components/common/BottomSheet';
import UserBadge from '@/components/common/UserBadge';
import { toast } from 'sonner';

export default function CoachingListPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [rooms, setRooms] = useState<CoachingRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Room Creation Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PlatformUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<PlatformUser[]>([]);
  const [creating, setCreating] = useState(false);

  // Subscribe to coaching rooms on mount
  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      router.push('/');
      return;
    }

    setLoadingRooms(true);
    const unsub = coachingService.subscribeCoachingRooms(user.uid, (data) => {
      setRooms(data);
      setLoadingRooms(false);
    });

    return () => unsub();
  }, [user?.uid, authLoading]);

  // Handle student search
  useEffect(() => {
    if (searchKeyword.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const results = await userService.searchUsers(searchKeyword);
      // Filter out self and already selected students
      const filtered = results.filter(
        u => u.id !== user?.uid && !selectedStudents.some(s => s.id === u.id)
      );
      setSearchResults(filtered);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchKeyword, selectedStudents, user?.uid]);

  const handleAddStudent = (student: PlatformUser) => {
    if (selectedStudents.length >= 2) {
      toast.warning(t('coaching.limit_students'));
      return;
    }
    setSelectedStudents(prev => [...prev, student]);
    setSearchKeyword('');
    setSearchResults([]);
  };

  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      toast.error(t('coaching.select_student') + '를 선택해주세요.');
      return;
    }
    if (!user?.uid) return;

    setCreating(true);
    try {
      const coachName = profile?.nickname || user.displayName || 'Coach';
      const studentIds = selectedStudents.map(s => s.id);
      const studentNames = selectedStudents.map(s => s.nickname || s.nativeNickname || 'Target');

      // 제목은 자동으로 대상의 이름이 됨
      const resolvedTitle = studentNames.join(', ');

      const roomId = await coachingService.createCoachingRoom(
        resolvedTitle,
        user.uid,
        coachName,
        studentIds,
        studentNames
      );

      toast.success(t('coaching.room_created'));
      setIsOpen(false);
      setTitle('');
      setSelectedStudents([]);
      router.push(`/coaching/${roomId}`);
    } catch (err) {
      console.error(err);
      toast.error(t('coaching.fail_create_room'));
    } finally {
      setCreating(false);
    }
  };

  const formatUpdateDate = (timeObj: any) => {
    if (!timeObj) return '';
    const date = timeObj.toDate ? timeObj.toDate() : new Date(timeObj);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (authLoading || loadingRooms) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  const isInstructor = profile?.isInstructor === true;

  return (
    <div className="bg-background min-h-screen text-on-surface">
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Intro Banner */}
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-container/5 border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight mb-1">
              {t('coaching.title')}
            </h1>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              {t('coaching.summary_desc')}
            </p>
          </div>
          {isInstructor && (
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-center gap-1.5 self-start md:self-center px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>{t('coaching.create_room')}</span>
            </button>
          )}
        </div>

        {/* Room List */}
        {rooms.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-surface-container rounded-2xl bg-surface-container-lowest">
            <span className="material-symbols-rounded text-4xl text-outline mb-2">psychology</span>
            <p className="text-sm font-bold text-outline">{t('coaching.no_rooms')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map(room => (
              <div
                key={room.id}
                onClick={() => router.push(`/coaching/${room.id}`)}
                className="p-5 rounded-2xl bg-white border border-surface-container shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden group"
              >
                {/* Accent line on hover */}
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />

                {/* Top Title & Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {room.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-on-surface-variant font-semibold mt-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-primary font-black uppercase tracking-wider">{t('coaching.coach')}</span>
                        <UserBadge uid={room.coachId} nickname={room.coachName} avatarSize="w-6 h-6" nameClassName="text-[11px] font-bold text-on-surface" />
                      </div>
                      <div className="w-[1px] h-3 bg-slate-200" />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t('coaching.students')}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {room.studentIds.map((sid, idx) => (
                            <UserBadge key={sid} uid={sid} nickname={room.studentNames[idx]} avatarSize="w-6 h-6" nameClassName="text-[11px] font-bold text-on-surface" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    room.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {room.status === 'active' ? t('coaching.active') : t('coaching.completed')}
                  </span>
                </div>

                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant mb-1">
                    <span>{t('coaching.progress')}</span>
                    <span className="text-primary">{room.overallProgress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${room.overallProgress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex justify-between items-center text-[10px] text-outline font-semibold border-t border-slate-50 pt-3">
                  <span>
                    {t('coaching.active_assignments').replace('{count}', String(room.activeAssignmentCount))}
                  </span>
                  <span>
                    {formatUpdateDate(room.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Bottom Sheet */}
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} height="60vh">
        <form onSubmit={handleCreateRoom} className="space-y-4 px-3 py-1">
          <div>
            <h3 className="text-base font-black text-on-surface mb-1">
              {t('coaching.create_room')}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium">
              {t('coaching.create_room_desc')}
            </p>
          </div>



          {/* Student Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
              {t('coaching.select_student')} <span className="text-error">*</span>
            </label>
            
            {/* Selected Student Chips */}
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {selectedStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary"
                  >
                    <span>{student.nickname || student.nativeNickname || 'Target'}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveStudent(student.id)}
                      className="w-4 h-4 rounded-full flex items-center justify-center bg-primary/25 hover:bg-primary/40 text-primary-fixed-variant"
                    >
                      <span className="material-symbols-outlined text-[10px] font-black">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Student Search Box */}
            {selectedStudents.length < 2 && (
              <div className="relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={t('coaching.select_student_placeholder')}
                  className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-surface-container focus:outline-none focus:border-primary text-sm font-semibold transition-colors"
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-surface-container shadow-xl rounded-xl z-50 divide-y divide-slate-50">
                    {searchResults.map(student => (
                      <div
                        key={student.id}
                        onClick={() => handleAddStudent(student)}
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer active:bg-slate-100 transition-colors"
                      >
                        <img
                          src={student.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.nickname || student.nativeNickname || 'Target')}&background=005BC0&color=fff`}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface">{student.nickname || student.nativeNickname || 'Target'}</p>
                          <p className="text-[10px] text-outline truncate">{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2.5 px-4 bg-surface hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant transition-colors text-center uppercase tracking-wider"
            >
              {t('coaching.cancel')}
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary/95 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition-colors text-center uppercase tracking-wider shadow-md"
            >
              {creating ? t('coaching.creating_label') : t('coaching.create_btn_label')}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
