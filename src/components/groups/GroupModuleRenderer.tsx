"use client";
// 그룹 탭 메뉴 활성화에 따라 서브 기능 모듈 컴포넌트를 동적으로 렌더링하는 역할.

import React from "react";
import dynamic from "next/dynamic";
import { Group, Member } from "@/types/group";
import { useLanguage } from "@/contexts/LanguageContext";
import { TabType } from "@/constants/groupTabs";

const GroupCalendar = dynamic(() => import("./GroupCalendar"));
const GroupBoard = dynamic(() => import("./GroupBoard"));
const GroupAbout = dynamic(() => import("./GroupAbout"));
const GroupClassEditor = dynamic(() => import("./GroupClassEditor"));
const GroupMemberManager = dynamic(() => import("./GroupMemberManager"));
const GroupMembers = dynamic(() => import("./GroupMembers"));
const GroupFunctionBuilder = dynamic(() => import("./GroupFunctionBuilder"));
const UniversalFeed = dynamic(() => import("../feed/UniversalFeed"));
const GroupShopEditor = dynamic(() => import("./GroupShopEditor"));
const GroupStayEditor = dynamic(() => import("./GroupStayEditor"));
const GroupRentalEditor = dynamic(() => import("./GroupRentalEditor"));
const GroupHomeConfig = dynamic(() => import("./GroupHomeConfig"));
const LiveFeed = dynamic(() => import("@/components/live/LiveFeed"));
const GroupClassDashboard = dynamic(() => import("./GroupClassDashboard"));

// Community module mockups
const GroupPolls = dynamic(() => import("./GroupPolls"));
const GroupQABoard = dynamic(() => import("./GroupQABoard"));
const GroupBroadcastCenter = dynamic(() => import("./GroupBroadcastCenter"));
const GroupAttendance = dynamic(() => import("./GroupAttendance"));
const GroupRules = dynamic(() => import("./GroupRules"));
const GroupSurvey = dynamic(() => import("./GroupSurvey"));
const AnonymousBoard = dynamic(() => import("./AnonymousBoard"));

// Education module mockups
const ClassManagerA = dynamic(() => import("./ClassManagerA"));
const ClassManagerB = dynamic(() => import("./ClassManagerB"));
const ClassManagerC = dynamic(() => import("./ClassManagerC"));
const HomeworkTracker = dynamic(() => import("./HomeworkTracker"));
const StudentReports = dynamic(() => import("./StudentReports"));
const TuitionManager = dynamic(() => import("./TuitionManager"));
const GradeSystem = dynamic(() => import("./GradeSystem"));
const ParentNotifications = dynamic(() => import("./ParentNotifications"));
const ParentConsultation = dynamic(() => import("./ParentConsultation"));
const ExamScheduler = dynamic(() => import("./ExamScheduler"));

// Events module mockups
const TicketBooking = dynamic(() => import("./TicketBooking"));
const WorkshopRegistration = dynamic(() => import("./WorkshopRegistration"));
const QRCheckIn = dynamic(() => import("./QRCheckIn"));
const WaitlistSystem = dynamic(() => import("./WaitlistSystem"));
const RetreatPlanner = dynamic(() => import("./RetreatPlanner"));
const EventStaffManager = dynamic(() => import("./EventStaffManager"));
const GuestListManager = dynamic(() => import("./GuestListManager"));

// Operations module mockups
const TaskManager = dynamic(() => import("./TaskManager"));
const InternalWiki = dynamic(() => import("./InternalWiki"));

// AI & Intelligence module mockups
const AIAssistant = dynamic(() => import("./AIAssistant"));

// Commerce module mockups
const ProductInventory = dynamic(() => import("./ProductInventory"));
const MembershipBilling = dynamic(() => import("./MembershipBilling"));
const DonationSupport = dynamic(() => import("./DonationSupport"));
const SubscriptionPlans = dynamic(() => import("./SubscriptionPlans"));
const SettlementReports = dynamic(() => import("./SettlementReports"));

// Brand & Media module mockups
const MediaGallery = dynamic(() => import("./MediaGallery"));
const VideoLibrary = dynamic(() => import("./VideoLibrary"));
const EditorialPage = dynamic(() => import("./EditorialPage"));
const Newsletter = dynamic(() => import("./Newsletter"));
const PodcastFeed = dynamic(() => import("./PodcastFeed"));
const PressKit = dynamic(() => import("./PressKit"));
const LinkHub = dynamic(() => import("./LinkHub"));
const SocialSync = dynamic(() => import("./SocialSync"));
const BrandAssets = dynamic(() => import("./BrandAssets"));
const CustomLandingPage = dynamic(() => import("./CustomLandingPage"));

export interface GroupModuleRendererProps {
  activeTab: TabType;
  visitedTabs: Set<TabType>;
  currentGroup: Group;
  members: Member[];
  isFullMember: boolean;
  isAdminUser: boolean;
  user: any;
  profile: any;
  setSelectedMember: (member: Member | null) => void;
  openClassFlow: (flow: string, options?: any) => void;
  handleTabClick: (tab: TabType) => void;
  onJoinPrompt?: () => void;
  allUsers?: any[];
  isClaiming?: boolean;
  handleClaimAdmin?: (targetUserId: string, targetUserName: string) => Promise<void>;
}

export default function GroupModuleRenderer({
  activeTab,
  visitedTabs,
  currentGroup,
  members,
  isFullMember,
  isAdminUser,
  user,
  profile,
  setSelectedMember,
  openClassFlow,
  handleTabClick,
  onJoinPrompt,
  allUsers,
  isClaiming,
  handleClaimAdmin
}: GroupModuleRendererProps) {
  const { t } = useLanguage();

  return (
    <>
      {visitedTabs.has('about') && (
        <div style={{ display: activeTab === 'about' ? 'block' : 'none' }} className="px-4 py-4">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupAbout
              group={currentGroup}
              members={members}
              allUsers={allUsers}
              isClaiming={isClaiming}
              handleClaimAdmin={handleClaimAdmin}
            />
          </div>
        </div>
      )}

      {visitedTabs.has('members') && (
        <div style={{ display: activeTab === 'members' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 z-[100]">
            {isFullMember || isAdminUser ? (
              <GroupMembers
                members={members}
                memberCount={currentGroup.memberCount}
                onMemberClick={(member) => setSelectedMember(member)}
                onClose={() => handleTabClick('home')}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-100/50 dark:shadow-none min-h-[400px]">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-3xl text-zinc-400 dark:text-zinc-500 animate-bounce-subtle">lock</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-3 tracking-tight font-headline">
                    {t('group.members_only.title')}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-xs mb-8 font-body">
                    {t('group.members_only.desc')}
                  </p>
                  <button
                    onClick={onJoinPrompt}
                    className="w-full h-14 bg-[#0057bd] text-white font-bold rounded-xl text-[16px] active:scale-95 transition-all shadow-md font-body"
                  >
                    {t('group.members_only.join')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {visitedTabs.has('roles') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'roles' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <GroupMemberManager group={currentGroup} />
          </div>
        </div>
      )}

      {visitedTabs.has('live') && (
        <div style={{ display: activeTab === 'live' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-[calc(100vh-104px)]">
            <LiveFeed entityType="group" entityId={currentGroup.id} />
          </div>
        </div>
      )}

      {visitedTabs.has('calendar') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupCalendar group={currentGroup} />
          </div>
        </div>
      )}

      {visitedTabs.has('feed') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'feed' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UniversalFeed
              context={{ scope: 'group', scopeId: currentGroup.id }}
              currentUser={{
                uid: user?.uid,
                displayName: profile?.nickname || user?.displayName || 'Anonymous',
                photoURL: profile?.photoURL || user?.photoURL || ''
              }}
            />
          </div>
        </div>
      )}

      {visitedTabs.has('class') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'class' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <GroupClassDashboard
              group={currentGroup}
              onApplyClick={(monthStr) => openClassFlow('apply', { month: monthStr })}
            />
          </div>
        </div>
      )}

      {visitedTabs.has('class-setting') && isAdminUser && (
        <div style={{ display: activeTab === 'class-setting' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <GroupClassEditor group={currentGroup} isInline={true} />
          </div>
        </div>
      )}

      {visitedTabs.has('board') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'board' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupBoard group={currentGroup} isAdmin={isAdminUser} />
          </div>
        </div>
      )}

      {visitedTabs.has('stay') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'stay' ? 'block' : 'none' }} className="px-4 py-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
            <UnderConstructionCard icon="bed" />
          </div>
        </div>
      )}

      {visitedTabs.has('shop') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'shop' ? 'block' : 'none' }} className="px-4 py-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
            <UnderConstructionCard icon="storefront" />
          </div>
        </div>
      )}

      {visitedTabs.has('rental') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'rental' ? 'block' : 'none' }} className="px-4 py-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
            <UnderConstructionCard icon="key" />
          </div>
        </div>
      )}

      {visitedTabs.has('shop-setting') && isAdminUser && (
        <div style={{ display: activeTab === 'shop-setting' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <GroupShopEditor group={currentGroup} isInline={true} />
          </div>
        </div>
      )}

      {visitedTabs.has('stay-setting') && isAdminUser && (
        <div style={{ display: activeTab === 'stay-setting' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <GroupStayEditor group={currentGroup} isInline={true} />
          </div>
        </div>
      )}

      {visitedTabs.has('rental-setting') && isAdminUser && (
        <div style={{ display: activeTab === 'rental-setting' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <GroupRentalEditor group={currentGroup} isInline={true} />
          </div>
        </div>
      )}

      {visitedTabs.has('polls') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'polls' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupPolls />
          </div>
        </div>
      )}

      {visitedTabs.has('qa') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'qa' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupQABoard />
          </div>
        </div>
      )}

      {visitedTabs.has('broadcast') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'broadcast' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupBroadcastCenter members={members} />
          </div>
        </div>
      )}

      {visitedTabs.has('attendance') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'attendance' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupAttendance />
          </div>
        </div>
      )}

      {visitedTabs.has('rules') && (
        <div style={{ display: activeTab === 'rules' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupRules />
          </div>
        </div>
      )}

      {visitedTabs.has('surveys') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'surveys' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupSurvey />
          </div>
        </div>
      )}

      {visitedTabs.has('anonymous') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'anonymous' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AnonymousBoard />
          </div>
        </div>
      )}

      {/* Education Modules */}
      {visitedTabs.has('classA') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'classA' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ClassManagerA />
          </div>
        </div>
      )}

      {visitedTabs.has('classB') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'classB' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ClassManagerB />
          </div>
        </div>
      )}

      {visitedTabs.has('classC') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'classC' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ClassManagerC />
          </div>
        </div>
      )}

      {visitedTabs.has('homework') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'homework' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <HomeworkTracker />
          </div>
        </div>
      )}

      {visitedTabs.has('studentReports') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'studentReports' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentReports />
          </div>
        </div>
      )}

      {visitedTabs.has('tuition') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'tuition' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TuitionManager />
          </div>
        </div>
      )}

      {visitedTabs.has('gradeSystem') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'gradeSystem' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GradeSystem />
          </div>
        </div>
      )}

      {visitedTabs.has('parentNotify') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'parentNotify' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ParentNotifications />
          </div>
        </div>
      )}

      {visitedTabs.has('parentConsult') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'parentConsult' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ParentConsultation />
          </div>
        </div>
      )}

      {visitedTabs.has('examScheduler') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'examScheduler' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExamScheduler />
          </div>
        </div>
      )}

      {/* Events Modules */}
      {visitedTabs.has('ticketBooking') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'ticketBooking' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TicketBooking />
          </div>
        </div>
      )}

      {visitedTabs.has('workshopReg') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'workshopReg' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WorkshopRegistration members={members} />
          </div>
        </div>
      )}

      {visitedTabs.has('qrCheckin') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'qrCheckin' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QRCheckIn />
          </div>
        </div>
      )}

      {visitedTabs.has('waitlist') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'waitlist' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WaitlistSystem />
          </div>
        </div>
      )}

      {visitedTabs.has('retreat') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'retreat' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RetreatPlanner members={members} />
          </div>
        </div>
      )}

      {visitedTabs.has('eventStaff') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'eventStaff' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EventStaffManager />
          </div>
        </div>
      )}

      {visitedTabs.has('guestList') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'guestList' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GuestListManager />
          </div>
        </div>
      )}

      {/* Commerce Modules */}
      {visitedTabs.has('productInventory') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'productInventory' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProductInventory />
          </div>
        </div>
      )}

      {visitedTabs.has('membershipBilling') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'membershipBilling' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MembershipBilling />
          </div>
        </div>
      )}

      {visitedTabs.has('donationSupport') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'donationSupport' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DonationSupport />
          </div>
        </div>
      )}

      {visitedTabs.has('subscriptionPlans') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'subscriptionPlans' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SubscriptionPlans />
          </div>
        </div>
      )}

      {visitedTabs.has('settlementReports') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'settlementReports' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettlementReports />
          </div>
        </div>
      )}

      {/* Brand & Media Modules */}
      {visitedTabs.has('mediaGallery') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'mediaGallery' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MediaGallery />
          </div>
        </div>
      )}

      {visitedTabs.has('videoLibrary') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'videoLibrary' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VideoLibrary />
          </div>
        </div>
      )}

      {visitedTabs.has('editorialPage') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'editorialPage' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EditorialPage members={members} />
          </div>
        </div>
      )}

      {visitedTabs.has('newsletter') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'newsletter' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Newsletter />
          </div>
        </div>
      )}

      {visitedTabs.has('podcastFeed') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'podcastFeed' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PodcastFeed />
          </div>
        </div>
      )}

      {visitedTabs.has('pressKit') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'pressKit' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PressKit />
          </div>
        </div>
      )}

      {visitedTabs.has('linkHub') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'linkHub' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LinkHub />
          </div>
        </div>
      )}

      {visitedTabs.has('socialSync') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'socialSync' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SocialSync />
          </div>
        </div>
      )}

      {visitedTabs.has('brandAssets') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'brandAssets' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BrandAssets />
          </div>
        </div>
      )}

      {visitedTabs.has('customLandingPage') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'customLandingPage' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CustomLandingPage />
          </div>
        </div>
      )}

      {/* Operations Modules */}
      {visitedTabs.has('taskManager') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'taskManager' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TaskManager />
          </div>
        </div>
      )}

      {visitedTabs.has('internalWiki') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'internalWiki' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <InternalWiki />
          </div>
        </div>
      )}

      {/* AI Modules */}
      {visitedTabs.has('aiAssistant') && (isFullMember || isAdminUser) && (
        <div style={{ display: activeTab === 'aiAssistant' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AIAssistant />
          </div>
        </div>
      )}

      {/* Group Settings */}
      {visitedTabs.has('settings') && isAdminUser && (
        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupFunctionBuilder
              group={currentGroup}
              onClose={() => {
                handleTabClick('home');
              }}
            />
          </div>
        </div>
      )}

      {/* Brand Settings */}
      {visitedTabs.has('brand') && isAdminUser && (
        <div style={{ display: activeTab === 'brand' ? 'block' : 'none' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupHomeConfig
              group={currentGroup}
              onClose={() => {
                handleTabClick('home');
              }}
              onSave={() => {
                handleTabClick('about');
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function UnderConstructionCard({ icon }: { icon: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-100/50 dark:shadow-none min-h-[400px]">
      <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-6 shadow-sm">
        <span className="material-symbols-outlined text-3xl text-zinc-400 dark:text-zinc-500 animate-pulse">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-3 tracking-tight">
        {t('group.under_construction.title')}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-xs">
        {t('group.under_construction.desc')}
      </p>
    </div>
  );
}
