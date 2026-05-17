export type TabType = 'home' | 'calendar' | 'feed' | 'board' | 'about' | 'class' | 'class-setting' | 'members' | 'settings' | 'shop' | 'stay' | 'rental' | 'coupon' | 'live' | 'brand' | 'polls' | 'qa' | 'broadcast' | 'attendance' | 'rules' | 'surveys' | 'anonymous' | 'classA' | 'classB' | 'classC' | 'homework' | 'studentReports' | 'tuition' | 'gradeSystem' | 'parentNotify' | 'parentConsult' | 'examScheduler' | 'ticketBooking' | 'workshopReg' | 'qrCheckin' | 'waitlist' | 'retreat' | 'eventStaff' | 'guestList' | 'productInventory' | 'membershipBilling' | 'donationSupport' | 'subscriptionPlans' | 'settlementReports' | 'mediaGallery' | 'videoLibrary' | 'editorialPage' | 'newsletter' | 'podcastFeed' | 'pressKit' | 'linkHub' | 'socialSync' | 'brandAssets' | 'customLandingPage' | 'taskManager' | 'internalWiki' | 'aiAssistant' | 'roles';

export const FUNCTION_TAB_MAP: Record<string, { id: TabType; key: string; icon: string; implemented: boolean }> = {
  'brand-setting': { id: 'brand', key: 'group.tab.brand', icon: 'palette', implemented: true },
  'dashboard': { id: 'home', key: 'group.tab.dashboard', icon: 'dashboard', implemented: true },
  'live': { id: 'live', key: 'group.tab.live', icon: 'play_circle', implemented: true },
  'feed': { id: 'feed', key: 'group.tab.feed', icon: 'rss_feed', implemented: true },
  'calendar': { id: 'calendar', key: 'group.tab.calendar', icon: 'calendar_today', implemented: true },
  'notice': { id: 'board', key: 'group.tab.notice', icon: 'campaign', implemented: true },
  'about': { id: 'about', key: 'group.tab.about', icon: 'info', implemented: true },
  'members': { id: 'members', key: 'group.tab.members', icon: 'groups', implemented: true },
  'class': { id: 'class', key: 'group.tab.class_user', icon: 'school', implemented: true },
  'class-setting': { id: 'class-setting', key: 'group.tab.class_admin', icon: 'school', implemented: true },
  'stay-setting': { id: 'stay', key: 'group.tab.stay', icon: 'bed', implemented: true },
  'shop-setting': { id: 'shop', key: 'group.tab.shop', icon: 'storefront', implemented: true },
  'rental-setting': { id: 'rental', key: 'group.tab.rental', icon: 'key', implemented: true },
  'roles-permissions': { id: 'roles', key: 'group.tab.roles', icon: 'security', implemented: true },
  'qa-board': { id: 'qa', key: 'group.tab.qa', icon: 'quiz', implemented: true },
  'polls': { id: 'polls', key: 'group.tab.polls', icon: 'how_to_vote', implemented: true },
  'attendance-check': { id: 'attendance', key: 'group.tab.attendance', icon: 'check_circle', implemented: true },
  'group-broadcast': { id: 'broadcast', key: 'group.tab.broadcast', icon: 'podcasts', implemented: true },
  'community-rules': { id: 'rules', key: 'group.tab.rules', icon: 'gavel', implemented: true },
  'surveys': { id: 'surveys', key: 'group.tab.surveys', icon: 'assignment', implemented: true },
  'anonymous-posts': { id: 'anonymous', key: 'group.tab.anonymous', icon: 'visibility_off', implemented: true },
  // Education modules
  'class-manager-a': { id: 'classA', key: 'group.tab.classA', icon: 'assignment_ind', implemented: true },
  'class-manager-b': { id: 'classB', key: 'group.tab.classB', icon: 'menu_book', implemented: true },
  'class-manager-c': { id: 'classC', key: 'group.tab.classC', icon: 'auto_stories', implemented: true },
  'homework-tracker': { id: 'homework', key: 'group.tab.homework', icon: 'task_alt', implemented: true },
  'student-reports': { id: 'studentReports', key: 'group.tab.studentReports', icon: 'summarize', implemented: true },
  'tuition-manager': { id: 'tuition', key: 'group.tab.tuition', icon: 'payments', implemented: true },
  'grade-system': { id: 'gradeSystem', key: 'group.tab.gradeSystem', icon: 'grade', implemented: true },
  'parent-notifications': { id: 'parentNotify', key: 'group.tab.parentNotify', icon: 'notifications_active', implemented: true },
  'parent-consultation': { id: 'parentConsult', key: 'group.tab.parentConsult', icon: 'forum', implemented: true },
  'exam-scheduler': { id: 'examScheduler', key: 'group.tab.examScheduler', icon: 'event_note', implemented: true },
  // Events modules
  'ticket-booking': { id: 'ticketBooking', key: 'group.tab.ticketBooking', icon: 'confirmation_number', implemented: true },
  'workshop-registration': { id: 'workshopReg', key: 'group.tab.workshopReg', icon: 'app_registration', implemented: true },
  'qr-checkin': { id: 'qrCheckin', key: 'group.tab.qrCheckin', icon: 'qr_code_scanner', implemented: true },
  'waitlist-system': { id: 'waitlist', key: 'group.tab.waitlist', icon: 'pending', implemented: true },
  'retreat-planner': { id: 'retreat', key: 'group.tab.retreat', icon: 'travel_explore', implemented: true },
  'event-staff-manager': { id: 'eventStaff', key: 'group.tab.eventStaff', icon: 'badge', implemented: true },
  'guest-list-manager': { id: 'guestList', key: 'group.tab.guestList', icon: 'list_alt', implemented: true },
  // Operations modules
  'task-manager': { id: 'taskManager', key: 'group.tab.taskManager', icon: 'task', implemented: true },
  'internal-wiki': { id: 'internalWiki', key: 'group.tab.internalWiki', icon: 'article', implemented: true },
  // Commerce modules
  'product-inventory': { id: 'productInventory', key: 'group.tab.productInventory', icon: 'inventory_2', implemented: true },
  'membership-billing': { id: 'membershipBilling', key: 'group.tab.membershipBilling', icon: 'credit_card', implemented: true },
  'donation-support': { id: 'donationSupport', key: 'group.tab.donationSupport', icon: 'volunteer_activism', implemented: true },
  'subscription-plans': { id: 'subscriptionPlans', key: 'group.tab.subscriptionPlans', icon: 'card_membership', implemented: true },
  'settlement-reports': { id: 'settlementReports', key: 'group.tab.settlementReports', icon: 'analytics', implemented: true },
  // Brand & Media modules
  'media-gallery': { id: 'mediaGallery', key: 'group.tab.mediaGallery', icon: 'collections', implemented: true },
  'video-library': { id: 'videoLibrary', key: 'group.tab.videoLibrary', icon: 'video_library', implemented: true },
  'editorial-page': { id: 'editorialPage', key: 'group.tab.editorialPage', icon: 'newspaper', implemented: true },
  'newsletter': { id: 'newsletter', key: 'group.tab.newsletter', icon: 'mail', implemented: true },
  'podcast-feed': { id: 'podcastFeed', key: 'group.tab.podcastFeed', icon: 'mic', implemented: true },
  'press-kit': { id: 'pressKit', key: 'group.tab.pressKit', icon: 'folder_open', implemented: true },
  'link-hub': { id: 'linkHub', key: 'group.tab.linkHub', icon: 'hub', implemented: true },
  'social-sync': { id: 'socialSync', key: 'group.tab.socialSync', icon: 'share', implemented: true },
  'brand-assets': { id: 'brandAssets', key: 'group.tab.brandAssets', icon: 'palette', implemented: true },
  'custom-landing-page': { id: 'customLandingPage', key: 'group.tab.customLandingPage', icon: 'web', implemented: true },
  // AI modules
  'ai-assistant': { id: 'aiAssistant', key: 'group.tab.aiAssistant', icon: 'smart_toy', implemented: true },
};

export const ADMIN_FUNCTION_IDS = ['brand-setting', 'roles-permissions', 'class-setting'];

export const FIXED_IDS = new Set(['dashboard', 'about', ...ADMIN_FUNCTION_IDS]);
