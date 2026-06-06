'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { coachingService, CoachingRoom, Assignment, CoachingFeedItem } from '@/lib/firebase/coachingService';
import { storageService } from '@/lib/firebase/storageService';
import UserBadge from '@/components/common/UserBadge';
import { toast } from 'sonner';

export default function CoachingRoomDetailPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<CoachingRoom | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [feedItems, setFeedItems] = useState<CoachingFeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'feed'>('overview');

  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Feed Editing states
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [activeMenuFeedId, setActiveMenuFeedId] = useState<string | null>(null);

  // Input states
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);

  // Feed Input states
  const [feedContent, setFeedContent] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Range Slider Local State (to prevent layout lag during dragging)
  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      router.push('/');
      return;
    }

    // 1. Subscribe to Coaching Room
    const unsubRoom = coachingService.subscribeCoachingRoom(roomId, (data) => {
      setRoom(data);
    });

    // 2. Subscribe to Assignments
    const unsubAssignments = coachingService.subscribeAssignments(roomId, (data) => {
      setAssignments(data);
      // Initialize local progress values
      const progressMap: Record<string, number> = {};
      data.forEach(item => {
        progressMap[item.id] = item.progress || 0;
      });
      setLocalProgress(progressMap);
    });

    // 3. Subscribe to Activity Feed
    const unsubFeed = coachingService.subscribeActivityFeed(roomId, (data) => {
      setFeedItems(data);
    });

    return () => {
      unsubRoom();
      unsubAssignments();
      unsubFeed();
    };
  }, [roomId, user?.uid, authLoading]);

  // Scroll and Click listeners
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setIsScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', handleScroll, { passive: true });

    const handleGlobalClick = () => {
      setActiveMenuFeedId(null);
    };
    window.addEventListener('click', handleGlobalClick);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [room]);

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm(t('coaching.confirm_delete_feed'))) return;
    try {
      await coachingService.deleteFeedItem(roomId, feedId);
      toast.success(t('coaching.feed_deleted'));
      setActiveMenuFeedId(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error'));
    }
  };

  const handleUpdateFeed = async (feedId: string) => {
    if (!editingContent.trim()) return;
    try {
      await coachingService.updateFeedItem(roomId, feedId, editingContent.trim());
      toast.success(t('coaching.feed_updated'));
      setEditingFeedId(null);
      setEditingContent('');
      setActiveMenuFeedId(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error'));
    }
  };

  const isCoach = room?.coachId === user?.uid;

  // Handle Room Status change
  const handleToggleRoomStatus = async () => {
    if (!room || !isCoach) return;
    const nextStatus = room.status === 'active' ? 'completed' : 'active';
    try {
      await coachingService.updateRoomStatus(roomId, nextStatus);
      toast.success(t('coaching.status_changed'));
    } catch (err) {
      console.error(err);
      toast.error(t('common.failed_update'));
    }
  };

  // Handle Assignment creation
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignmentTitle.trim()) return;

    try {
      await coachingService.createAssignment(roomId, newAssignmentTitle.trim());
      toast.success(t('coaching.assignment_created'));
      setNewAssignmentTitle('');
      setIsAddingAssignment(false);
    } catch (err) {
      console.error(err);
      toast.error(t('coaching.fail_create_assignment'));
    }
  };

  // Handle Range Slider dragging
  const handleProgressChange = (assignmentId: string, value: number) => {
    setLocalProgress(prev => ({
      ...prev,
      [assignmentId]: value
    }));
  };

  // Handle Range Slider release
  const handleProgressCommit = async (assignment: Assignment) => {
    if (!isCoach) return;
    const toVal = localProgress[assignment.id];
    if (toVal === assignment.progress) return; // No change

    try {
      await coachingService.updateAssignmentProgress(
        roomId,
        assignment.id,
        assignment.title,
        assignment.progress,
        toVal
      );
      toast.success(t('coaching.progress_updated'));
    } catch (err) {
      console.error(err);
      toast.error(t('coaching.fail_update_progress'));
      // Rollback local state
      setLocalProgress(prev => ({
        ...prev,
        [assignment.id]: assignment.progress
      }));
    }
  };

  // Handle Media Select
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('coaching.upload_limit'));
      return;
    }

    setMediaFile(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaType(type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Post feed feedback / media
  const handlePostFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedContent.trim() && !mediaFile) return;
    if (!user?.uid || !room) return;

    setUploadingMedia(true);
    try {
      let mediaUrl = '';
      if (mediaFile) {
        const timestamp = Date.now();
        const path = `coaching/${roomId}/${timestamp}_${mediaFile.name}`;
        mediaUrl = await storageService.uploadFile(mediaFile, path);
      }

      const senderName = profile?.nickname || user.displayName || 'User';
      const senderRole = isCoach ? 'coach' : 'student';
      const type = mediaFile ? (mediaType === 'video' ? 'video' : 'photo') : 'text';

      const feedData: Omit<CoachingFeedItem, 'id' | 'roomId' | 'createdAt'> = {
        senderId: user.uid,
        senderName,
        senderRole,
        type,
        content: feedContent.trim(),
      };
      if (mediaUrl) {
        feedData.mediaUrl = mediaUrl;
      }

      await coachingService.addFeedItem(roomId, feedData);

      setFeedContent('');
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      toast.success(t('coaching.posted_success'));
    } catch (err) {
      console.error(err);
      toast.error(t('common.error'));
    } finally {
      setUploadingMedia(false);
    }
  };

  const formatFeedDate = (timeObj: any) => {
    if (!timeObj) return '';
    const date = timeObj.toDate ? timeObj.toDate() : new Date(timeObj);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (authLoading || !room) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* ━━━ Header ━━━ */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-100'}`}>
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-[#2d3435] hover:bg-slate-200 transition-colors">
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className="text-base font-bold truncate max-w-[240px] text-[#2d3435]">{room.title}</div>
        <div className="w-10 h-10" />
      </div>

      {/* ━━━ Scrollable Content ━━━ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pt-[64px] pb-[40px] bg-slate-50">
        <main className="max-w-3xl w-full mx-auto px-4 py-6">
          
          {/* Dashboard Bento Card */}
          <div className="p-6 rounded-2xl bg-white border border-surface-container shadow-sm mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                  room.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {room.status === 'active' ? t('coaching.active') : t('coaching.completed')}
                </span>
                {isCoach && (
                  <button
                    onClick={handleToggleRoomStatus}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 border ${
                      room.status === 'active'
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {room.status === 'active' ? t('coaching.complete_btn') : t('coaching.resume_btn')}
                  </button>
                )}
              </div>
              <h1 className="text-lg font-bold text-on-surface tracking-tight mt-1">{room.title}</h1>
            </div>
            
            <div className="text-left sm:text-right shrink-0">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('coaching.progress')}</p>
              <h2 className="text-2xl font-black text-primary leading-none mt-0.5">{room.overallProgress || 0}%</h2>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${room.overallProgress || 0}%` }}
            />
          </div>

          {/* Members Badge Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-on-surface-variant border-t border-slate-50 pt-3.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-outline uppercase font-extrabold">{t('coaching.coach')}</span>
              <UserBadge uid={room.coachId} nickname={room.coachName} avatarSize="w-7 h-7" nameClassName="text-xs font-bold text-primary" />
            </div>
            <div className="w-[1px] h-3 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-outline uppercase font-extrabold">{t('coaching.students')}</span>
              <div className="flex items-center gap-3">
                {room.studentIds.map((sid, idx) => (
                  <UserBadge key={sid} uid={sid} nickname={room.studentNames[idx]} avatarSize="w-7 h-7" nameClassName="text-xs font-bold text-on-surface" />
                ))}
              </div>
            </div>
            <div className="w-[1px] h-3 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-outline uppercase font-extrabold">Active</span>
              <span className="text-on-surface-variant font-bold">
                {t('coaching.active_assignments').replace('{count}', String(room.activeAssignmentCount))}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-surface-container mb-6 bg-white sticky top-0 z-10">
          {[
            { id: 'overview', label: t('coaching.overview') },
            { id: 'assignments', label: t('coaching.assignments') },
            { id: 'feed', label: t('coaching.activity_feed') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3.5 text-center text-sm font-bold border-b-2 transition-colors active:scale-98 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Overview Detail Card */}
            <div className="p-6 rounded-2xl bg-white border border-surface-container shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-slate-50 pb-2">
                {t('coaching.info_title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('coaching.created_at')}</p>
                  <p className="text-xs font-semibold text-on-surface">{formatFeedDate(room.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('coaching.last_updated')}</p>
                  <p className="text-xs font-semibold text-on-surface">{formatFeedDate(room.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('coaching.summary_label')}</p>
                <p className="text-xs font-medium text-on-surface-variant leading-relaxed">
                  {t('coaching.summary_desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Add Assignment Block (Coach only) */}
            {isCoach && (
              <div className="p-4 rounded-2xl bg-white border border-surface-container shadow-sm">
                {!isAddingAssignment ? (
                  <button
                    onClick={() => setIsAddingAssignment(true)}
                    className="w-full py-3 px-4 border border-dashed border-primary/30 text-primary hover:bg-primary/5 active:scale-98 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>{t('coaching.add_assignment')}</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreateAssignment} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {t('coaching.assignment_title_label')}
                      </label>
                      <input
                        type="text"
                        required
                        value={newAssignmentTitle}
                        onChange={(e) => setNewAssignmentTitle(e.target.value)}
                        placeholder={t('coaching.assignment_title_placeholder')}
                        className="w-full px-3 py-2 bg-surface rounded-xl border border-surface-container focus:outline-none focus:border-primary text-xs font-semibold"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAssignment(false);
                          setNewAssignmentTitle('');
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-on-surface-variant transition-colors"
                      >
                        {t('coaching.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-black transition-colors shadow-sm"
                      >
                        {t('coaching.add_assignment')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Assignments List */}
            {assignments.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-surface-container rounded-2xl bg-surface-container-lowest">
                <span className="material-symbols-rounded text-3xl text-outline mb-1.5">assignment</span>
                <p className="text-xs font-bold text-outline">
                  {t('coaching.no_assignments')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map(assignment => {
                  const progressValue = localProgress[assignment.id] !== undefined 
                    ? localProgress[assignment.id] 
                    : assignment.progress || 0;

                  return (
                    <div
                      key={assignment.id}
                      className="p-5 rounded-2xl bg-white border border-surface-container shadow-sm flex flex-col gap-4"
                    >
                      {/* Assignment Top Header */}
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-sm text-on-surface leading-tight">
                          {assignment.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                          assignment.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : assignment.status === 'in_progress' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {assignment.status === 'completed' 
                            ? 'Completed' 
                            : assignment.status === 'in_progress' 
                              ? 'In Progress' 
                              : 'Open'}
                        </span>
                      </div>

                      {/* 5% Step Slider UI */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                          <span>{t('coaching.progress')}</span>
                          <span className="text-primary font-bold">{progressValue}%</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            disabled={!isCoach}
                            value={progressValue}
                            onChange={(e) => handleProgressChange(assignment.id, parseInt(e.target.value))}
                            onMouseUp={() => handleProgressCommit(assignment)}
                            onTouchEnd={() => handleProgressCommit(assignment)}
                            className={`flex-1 h-2 rounded-full cursor-pointer accent-primary ${
                              isCoach ? 'hover:accent-primary-hover' : 'opacity-85 pointer-events-none'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Slider Guide details */}
                      <div className="flex justify-between items-center text-[9px] text-outline font-semibold">
                        <span>{t('coaching.progress_start')}</span>
                        <span>{t('coaching.progress_mid')}</span>
                        <span>{t('coaching.progress_end')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Timeline Create Form (Coach & Student common) */}
            <div className="p-4 rounded-2xl bg-white border border-surface-container shadow-sm space-y-4">
              <form onSubmit={handlePostFeed} className="space-y-3">
                <textarea
                  required={!mediaFile}
                  rows={3}
                  value={feedContent}
                  onChange={(e) => setFeedContent(e.target.value)}
                  placeholder={t('coaching.feed_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border border-surface-container focus:outline-none focus:border-primary text-xs font-medium resize-none leading-relaxed"
                />

                {/* Media Preview Box */}
                {mediaPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-surface-container aspect-video max-h-48 bg-slate-900 flex items-center justify-center">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} className="w-full h-full object-contain" controls />
                    ) : (
                      <img src={mediaPreview} alt="" className="w-full h-full object-contain" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                        setMediaType(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm font-black">close</span>
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-50 pt-2.5">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      ref={fileInputRef}
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-on-surface-variant hover:text-primary active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-on-surface-variant hover:text-primary active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingMedia || (!feedContent.trim() && !mediaFile)}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 disabled:bg-slate-200 disabled:text-outline text-white rounded-xl text-xs font-black transition-colors shadow-sm active:scale-95"
                  >
                    {uploadingMedia ? t('common.uploading') : t('coaching.post_feedback')}
                  </button>
                </div>
              </form>
            </div>

            {/* Timeline Feed Stream */}
            {feedItems.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-surface-container rounded-2xl bg-surface-container-lowest">
                <span className="material-symbols-rounded text-3xl text-outline mb-1.5">history</span>
                <p className="text-xs font-bold text-outline">
                  {t('coaching.timeline_empty')}
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-4">
                {feedItems.map(item => {
                  const isSystem = item.senderId === 'system';

                  if (isSystem) {
                    return (
                      <div key={item.id} className="relative animate-in fade-in duration-200 ml-2 py-1 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        <span>
                          {item.content}
                        </span>
                        <span className="text-[9px] text-slate-300 font-normal">
                          ({formatFeedDate(item.createdAt)})
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="relative animate-in fade-in duration-200">
                      
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                        item.senderRole === 'coach' 
                          ? 'bg-primary' 
                          : 'bg-emerald-500'
                      }`} />

                      {/* Card Content */}
                      <div className="p-4 rounded-xl bg-white border border-surface-container shadow-xs space-y-3">
                        
                        {/* Header Sender Info */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              item.senderRole === 'coach' 
                                ? 'bg-primary-container text-on-primary-container' 
                                : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {item.senderRole.toUpperCase()}
                            </span>
                            <UserBadge uid={item.senderId} nickname={item.senderName} avatarSize="w-6 h-6" nameClassName="text-xs font-bold text-on-surface" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-outline font-semibold">
                              {formatFeedDate(item.createdAt)}
                            </span>
                            {!isSystem && item.senderId === user?.uid && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuFeedId(activeMenuFeedId === item.id ? null : item.id);
                                  }}
                                  className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all animate-in fade-in"
                                >
                                  <span className="material-symbols-outlined text-[16px]">more_vert</span>
                                </button>
                                
                                {activeMenuFeedId === item.id && (
                                  <div className="absolute right-0 mt-1 z-50 bg-white border border-slate-100 shadow-xl rounded-xl py-1 w-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingFeedId(item.id);
                                        setEditingContent(item.content);
                                        setActiveMenuFeedId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                    >
                                      <span className="material-symbols-outlined text-sm text-slate-400">edit</span>
                                      {t('coaching.edit')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFeed(item.id);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                                    >
                                      <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                                      {t('coaching.delete')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content text */}
                        {editingFeedId === item.id ? (
                          <div className="space-y-2 pt-1">
                            <textarea
                              rows={3}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-primary rounded-xl text-xs font-semibold resize-none leading-relaxed"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFeedId(null);
                                  setEditingContent('');
                                }}
                                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 transition-colors"
                              >
                                {t('coaching.cancel')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateFeed(item.id)}
                                className="px-2.5 py-1 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-black transition-colors"
                              >
                                {t('coaching.save')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          item.content && (
                            <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap break-words text-on-surface-variant">
                              {item.content}
                            </p>
                          )
                        )}

                        {/* Media display */}
                        {item.mediaUrl && (
                          <div className="rounded-xl overflow-hidden border border-surface-container max-h-60 bg-slate-900 flex items-center justify-center relative aspect-video">
                            {item.type === 'video' ? (
                              <video src={item.mediaUrl} className="w-full h-full object-contain" controls />
                            ) : (
                              <img src={item.mediaUrl} alt="" className="w-full h-full object-contain" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
