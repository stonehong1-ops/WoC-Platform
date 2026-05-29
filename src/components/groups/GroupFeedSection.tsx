"use client";
// 그룹 홈의 메인 대시보드 피드, 일정, 모먼츠 섹션을 렌더링하는 컴포넌트.

import React from "react";
import { useRouter } from "next/navigation";
import { Group, Member, Post } from "@/types/group";
import { Notification } from "@/types/notification";
import { GalleryPost } from "@/lib/firebase/galleryService";
import { notificationService } from "@/lib/firebase/notificationService";
import { toast } from "sonner";
import ImageWithFallback from "@/components/common/ImageWithFallback";

export interface GroupFeedSectionProps {
  currentGroup: Group;
  members: Member[];
  isFullMember: boolean;
  isAdminUser: boolean;
  noticePost: Post | null;
  recentFeedPosts: any[];
  upcomingEvents: any[];
  moments: GalleryPost[];
  adminTodos: Notification[];
  handleTabClick: (tab: any) => void;
  safeFormat: (date: any, formatStr: string) => string;
  safeFormatRelative: (date: any) => string;
  isPostNew: (date: any) => boolean;
  pathname: string;
  t: (key: string, options?: any) => string;
}

export default function GroupFeedSection({
  currentGroup,
  members,
  isFullMember,
  isAdminUser,
  noticePost,
  recentFeedPosts,
  upcomingEvents,
  moments,
  adminTodos,
  handleTabClick,
  safeFormat,
  safeFormatRelative,
  isPostNew,
  pathname,
  t
}: GroupFeedSectionProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Admin Todo Section */}
      {isAdminUser && adminTodos.length > 0 && (
        <section>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 relative overflow-hidden">
            <h3 className="font-headline font-bold text-orange-800 mb-3 flex items-center gap-2 text-base">
              <span className="material-symbols-outlined text-orange-600">notification_important</span> {t('home.actionRequired')}
            </h3>
            <div className="flex flex-col gap-2">
              {adminTodos.map(todo => {
                const isBusinessChat = todo.type === 'BUSINESS_CHAT';
                
                return (
                  <div 
                    key={todo.id} 
                    className={`bg-white rounded-lg p-3 border border-orange-100 flex items-center justify-between gap-3 ${isBusinessChat ? 'cursor-pointer hover:bg-orange-50/50 transition-colors' : ''}`}
                    onClick={() => {
                      if (isBusinessChat && todo.referenceId) {
                        router.push(`/chat?roomId=${todo.referenceId}`);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-on-surface text-sm truncate">{todo.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">{todo.message}</p>
                    </div>
                    {isBusinessChat ? (
                      <span className="material-symbols-outlined text-orange-600 shrink-0 select-none">chevron_right</span>
                    ) : (
                      <button
                        onClick={(e) => { 
                          e.stopPropagation();
                          notificationService.markTodosAsCompletedByReference(todo.referenceId || todo.id); 
                          toast.success("Task completed"); 
                        }}
                        className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
                      >
                        {t('home.done')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Notice Board Section */}
      <section>
        <div 
          className="rounded-xl p-4 flex flex-col gap-4 relative cursor-pointer" 
          style={{ backgroundColor: currentGroup.headerThemeColor ? `${currentGroup.headerThemeColor}18` : '#f3f3f6' }} 
          onClick={() => {
            if (isFullMember) {
              handleTabClick('board');
            } else {
              toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
            }
          }}
        >
          {noticePost && isPostNew(noticePost.createdAt) && (
            <div className="absolute -top-2 -right-1 bg-[#ff4444] text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-[0_4px_12px_rgba(255,68,68,0.4)] z-10 animate-bounce-subtle">
              NEW
            </div>
          )}
          <div className="flex justify-between items-center">
            <h4 className="font-body text-[12px] font-medium uppercase tracking-widest text-on-surface-variant">{t('home.notice')}</h4>
          </div>
          <ul className="flex flex-col gap-3">
            {noticePost ? (
              <li className="flex flex-col gap-1 border-b border-outline/10 pb-3 last:border-0 last:pb-0">
                <span className="font-body text-[16px] font-medium text-on-surface font-bold line-clamp-2">
                  {noticePost.title || noticePost.content?.substring(0, 50) || t('home.notice')}
                </span>
                <div className="flex justify-between items-center">
                  <span className="font-body text-[12px] font-medium text-primary">{noticePost.author?.name || 'Admin'}</span>
                  <span className="font-body text-[12px] font-medium text-outline">{safeFormatRelative(noticePost.createdAt)}</span>
                </div>
              </li>
            ) : (
              <li className="flex flex-col gap-1 border-b border-outline/10 pb-3 last:border-0 last:pb-0">
                <span className="font-body text-[16px] font-medium text-on-surface font-bold">{t('home.welcomeCommunity')}</span>
                <div className="flex justify-between items-center">
                  <span className="font-body text-[12px] font-medium text-primary">Admin</span>
                  <span className="font-body text-[12px] font-medium text-outline">{safeFormat(Date.now(), 'MMM d')}</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* GROUP CHAT Button */}
      <section>
        <div
          className="bg-white border border-outline/15 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => { 
            if (isFullMember) {
              router.push(pathname + '?modal=chat', { scroll: false }); 
            } else {
              toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <div>
              <h3 className="font-headline text-[16px] font-bold text-on-surface">{t('home.groupChat')}</h3>
              <p className="font-body text-[13px] text-on-surface-variant">{t('home.unreadMessages', { count: 0 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-on-surface-variant">chevron_right</span>
          </div>
        </div>
      </section>

      {/* FEED Section */}
      <section className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline text-[18px] leading-[1.4] font-bold text-on-background">{t('home.feed')}</h2>
          <span 
            className="font-body text-[12px] font-medium text-primary cursor-pointer flex items-center" 
            onClick={() => {
              if (isFullMember || isAdminUser) {
                handleTabClick('feed');
              } else {
                toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
              }
            }}
          >
            {t('home.viewAll')} <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {recentFeedPosts.length > 0 ? (
            recentFeedPosts.slice(0, 1).map((post, idx) => (
              <div 
                key={post.id || idx} 
                className="bg-surface-container-lowest border border-outline/15 rounded-xl p-4 flex justify-between items-center cursor-pointer" 
                onClick={() => {
                  if (isFullMember || isAdminUser) {
                    handleTabClick('feed');
                  } else {
                    toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
                  }
                }}
              >
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-outline/20" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${idx === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                      {(post.author?.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-body text-[14px] font-semibold leading-[1.2] text-on-surface truncate">{post.author?.name || 'Anonymous'}</span>
                      <span className="font-body text-[12px] font-medium leading-[1.2] text-outline shrink-0">{safeFormatRelative(post.createdAt)}</span>
                    </div>
                    <p className="font-body text-[16px] font-medium text-on-surface-variant italic truncate">
                      {isPostNew(post.createdAt) && <span className="inline-block bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] mr-1.5 align-middle -translate-y-[1px]">{t('home.new')}</span>}
                      &quot;{post.content || post.title || '...'}&quot;
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-surface-container-lowest border border-outline/15 rounded-xl p-4 text-center">
              <p className="font-body text-[16px] font-medium text-on-surface-variant">{t('home.noPosts')}</p>
            </div>
          )}
        </div>
      </section>

      {/* SCHEDULE Section */}
      <section className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline text-[18px] leading-[1.4] font-bold text-on-background">{t('home.schedule')}</h2>
          <div className="flex items-center gap-3">
            <span 
              className="font-body text-[12px] font-medium text-primary cursor-pointer flex items-center" 
              onClick={() => {
                if (isFullMember) {
                  handleTabClick('calendar');
                } else {
                  toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
                }
              }}
            >
              {t('home.viewAll')} <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {(() => {
            const firstEvent = upcomingEvents[0];
            const eventsToDisplay = firstEvent
              ? upcomingEvents.filter(e => {
                const d1 = new Date(e.startDate);
                const d2 = new Date(firstEvent.startDate);
                return d1.getFullYear() === d2.getFullYear() &&
                  d1.getMonth() === d2.getMonth() &&
                  d1.getDate() === d2.getDate();
              })
              : [];

            if (eventsToDisplay.length === 0) {
              return (
                <div className="bg-surface-container-lowest border border-outline/15 rounded-xl p-6 text-center">
                  <span className="material-symbols-outlined text-outline/30 text-4xl mb-2">calendar_today</span>
                  <p className="font-body text-[15px] font-medium text-on-surface-variant">{t('home.noEvents')}</p>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-8">
                {eventsToDisplay.map((event, idx) => {
                  const isNow = event.startDate <= Date.now() && event.endDate >= Date.now();
                  const eventDate = safeFormat(event.startDate, 'MMM d (EEE)');
                  const prevEventDate = idx > 0 ? safeFormat(eventsToDisplay[idx - 1].startDate, 'MMM d (EEE)') : null;
                  const showDateHeader = eventDate !== prevEventDate;

                  const dotColorClass =
                    event.type === 'class' || event.type === 'Class' || event.type === 'practice' ? 'bg-[#ba1a1a]' :
                      event.type === 'social' || event.type === 'Social' || event.type === 'milonga' ? 'bg-[#004190]' :
                        'bg-[#765b00]';
                  const badgeColorClass =
                    event.type === 'class' || event.type === 'Class' || event.type === 'practice' ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]' :
                      event.type === 'social' || event.type === 'Social' || event.type === 'milonga' ? 'bg-[#004190]/10 text-[#004190]' :
                        'bg-slate-200 text-slate-600';
                  const displayTime = event.startTime || safeFormat(event.startDate, 'HH:mm');

                  return (
                    <React.Fragment key={event.id}>
                      {showDateHeader && (
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[20px] font-black text-on-surface tracking-tight">
                            {eventDate}
                          </span>
                          <div className="h-px flex-1 bg-outline/10"></div>
                        </div>
                      )}
                      <div
                        className="flex items-start gap-4 relative cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() => {
                          if (isFullMember) {
                            handleTabClick('calendar');
                          } else {
                            toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
                          }
                        }}
                      >
                        <div className="flex flex-col items-center shrink-0 w-[52px] pt-1">
                          <span className="text-[14px] font-bold text-on-surface-variant">{displayTime}</span>
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 ${dotColorClass} ${isNow ? 'animate-pulse ring-4 ring-red-500/20' : ''}`}></div>
                        </div>

                        <div className={`flex-1 bg-white p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md ${isNow ? 'border-[#ba1a1a]/30 bg-[#ba1a1a]/5' : 'border-slate-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-[16px] font-bold text-[#242c51] leading-tight">{event.title}</h4>
                            {isNow && (
                              <span className="font-body text-[9px] font-black text-white bg-[#ba1a1a] px-2 py-0.5 rounded-full tracking-wider animate-pulse shrink-0">LIVE NOW</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase ${badgeColorClass}`}>
                              {event.type?.toUpperCase() || 'EVENT'}
                            </span>
                            {(event.startTime || event.endTime) && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                {displayTime}{event.endTime ? ` – ${event.endTime}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* MOMENTS Section */}
      <section className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline text-[18px] leading-[1.4] font-bold text-on-background">{t('group.moments')}</h2>
          <span 
            className="font-body text-[12px] font-medium text-primary cursor-pointer flex items-center" 
            onClick={() => {
              if (isFullMember || isAdminUser) {
                handleTabClick('live');
              } else {
                toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
              }
            }}
          >
            {t('group.moments.view_all')} <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </span>
        </div>
        {moments.length > 0 ? (
          <div 
            className="grid grid-cols-2 gap-2" 
            onClick={() => {
              if (isFullMember || isAdminUser) {
                handleTabClick('live');
              } else {
                toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
              }
            }}
          >
            {moments.slice(0, 4).map((moment, idx) => (
              <div
                key={moment.id || idx}
                className="relative aspect-square rounded-xl overflow-hidden bg-surface-container cursor-pointer active:scale-[0.97] transition-transform"
              >
                <ImageWithFallback src={moment.media?.[0] || ''} alt={moment.caption || "Moment"} className="absolute inset-0 w-full h-full object-cover" fallbackType="gallery" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-body text-[12px] font-semibold text-white leading-tight drop-shadow-md line-clamp-1">{moment.caption || ''}</p>
                </div>
                {idx === 0 && (
                  <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    <span className="font-body text-[9px] font-bold text-white tracking-widest uppercase">{t('group.moments.live')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shrink-0 bg-surface-container flex items-center justify-center border border-outline/10">
            <div className="flex flex-col items-center gap-2 opacity-50">
              <span className="material-symbols-outlined text-4xl">photo_camera</span>
              <span className="font-body text-sm font-medium">{t('group.moments.no_moments')}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
