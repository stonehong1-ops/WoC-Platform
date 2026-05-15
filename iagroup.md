# WoC Group Module Information Architecture (IA) v2.0

This document provides a comprehensive and detailed map of the **Group** module, which functions as a sophisticated **App-in-App** (Platform-in-Platform) ecosystem within the WoC platform.

---

## 1. Architectural Foundation: App-in-App Concept
The Group module is a self-contained operating system for communities. Upon entry, the global platform navigation is suppressed, and a group-specific header and dynamic navigation system take control.

| Aspect | Implementation & Rules |
| :--- | :--- |
| **Root Shell** | `src/components/groups/GroupHome.tsx` (Handles routing, dynamic tabs, and header logic) |
| **Global Sync** | Data flows from `GroupDetail.tsx` (Server) -> `GroupHome.tsx` (Client) |
| **Dynamic Branding** | Theme color (`headerThemeColor`) dynamically dictates the visual identity of all nested UI. |
| **Contrast Logic** | `getContrastColor` utility ensures readability across all theme colors automatically. |
| **Layout Guard** | Auto-hide header on Home tab top -> Slide down & fade in on scroll. |
| **Add-on Architecture**| Features are built as modular "Add-ons" enabled via the `GroupFunctionBuilder`. |

---

## 2. Page & Tab Structure (The Navigation Shell)
Managed via the `activeTab` state in `GroupHome.tsx`. Each tab represents a core sub-app.

### A. Core Engagement Tabs
- **🏠 Home (`home`)**
  - **Hero Section**: Covers the full width with group branding, catchphrase, and stats.
  - **Notice Bar**: Critical announcements for group members.
  - **Live Moments**: Horizontal scroll of recent group photos/activity.
  - **Quick Stats**: Member counts, class counts, and activity metrics.
- **ℹ️ About (`about`)**
  - **Component**: `GroupAbout.tsx`, `GroupInfo.tsx`, `GroupRules.tsx`
  - **Content**: Atmospheric gallery, mission statement, location (Maps integration), house rules, and team profiles.
- **💬 Live (`live`)**
  - **Component**: `src/components/live/LiveFeed.tsx`
  - **Function**: Real-time community chat and interaction hub.

### B. Standard Functional Tabs
- **📅 Calendar (`calendar`)**: Event scheduling, RSVP tracking, and unified calendar integration.
- **📱 Feed (`feed`)**: Social-style feed for photo sharing and general discussion.
- **📋 Board (`board`)**: Structured categories for long-form posts and documents.
- **🎓 Class (`class`)**: Educational program management, schedules, and curriculum.

---

## 3. Essential Administrative Ecosystem (Settings & Editors)
Accessed via the **Settings (Gear icon)** and **Palette (Theme Switcher)** in the header by Admins.

### A. Core Configuration & Policy
- **Function Builder**: `GroupFunctionBuilder.tsx` (Modular function marketplace with cart/select logic to toggle Add-ons).
- **Basic Info**: `GroupBasicEditor.tsx` (Name, Category, Theme Color, Cover).
- **Membership**: `GroupMembershipEditor.tsx` (Join strategy: Open / Approval / Locked).
- **Contact**: `GroupContactEditor.tsx` (Address, Maps, SNS links).
- **Roles & Permissions**: `GroupRoleEditor.tsx` (Multi-level staff permissions and member management).
- **Member Manager**: `GroupMemberManager.tsx`, `GroupMembers.tsx` (Approvals, expulsions, and tier assignments).

### B. Content & Business Management (Core)
- **Gallery**: `GroupGalleryEditor.tsx` (Branding visual management).
- **Board Setting**: `GroupBoardEditor.tsx` (Category setup and permissions).
- **Shop/Store**: `GroupShopEditor.tsx`, `GroupShopItemEditor.tsx` (Product listing and inventory).
- **Rental**: `GroupRentalEditor.tsx` (Equipment and space rental).
- **Stay/Lodging**: `GroupStayEditor.tsx` (Accommodation setup).
- **Classes**: `GroupClassSetting.tsx`, `GroupClassEditor.tsx`, `GroupClassAddEditor.tsx`, `GroupClassDiscountEditor.tsx` (Complete curriculum logic).

### C. Financials (Core)
- **Accounting**: `GroupAccountEditor.tsx` (Payment gateway and settlement info).
- **Promotions**: `CouponAdmin.tsx` (Discount code and campaign management).

---

## 4. Extended Add-on Ecosystem (The Group App Store)
Groups can enable specialized modules based on their organization type (e.g., Academy, Corporate, Event Organizer). These are standalone modular components.

### A. Productivity & Management
- `AIAssistant.tsx`: AI-driven community management and insights.
- `TaskManager.tsx`, `SprintBoard.tsx`: Task assignment, agile boards, and issue tracking.
- `TeamWorkspace.tsx`: Collaborative digital workspace for staff.
- `ApprovalWorkflow.tsx`: Multi-stage document/request approval system.
- `ProjectRoadmap.tsx`: Visual timeline for long-term group goals.
- `InternalWiki.tsx`: Centralized knowledge base for group rules/docs.

### B. Education & Academics (Academy Add-ons)
- `ClassManagerA/B/C.tsx`: Advanced class tracking algorithms.
- `ExamScheduler.tsx`, `GradeSystem.tsx`: Academic performance and testing.
- `GroupAttendance.tsx`: QR or manual roll-call tracking.
- `HomeworkTracker.tsx`: Assignment submission and review.
- `TuitionManager.tsx`: Specialized academic billing.
- `StudentReports.tsx`, `ParentConsultation.tsx`, `ParentNotifications.tsx`: Specialized portals for youth/parent communication.

### C. Events & Engagement
- `EventStaffManager.tsx`: Roster and duty assignments for event staff.
- `RetreatPlanner.tsx`: Itinerary builder for off-site group trips.
- `GuestListManager.tsx`: Door control and VIP tracking.
- `TicketBooking.tsx`: Advanced seating and event ticketing.
- `QRCheckIn.tsx`: Instant validation for physical events.
- `WorkshopRegistration.tsx`: Multi-session educational event signups.
- `GroupPolls.tsx`, `GroupSurvey.tsx`: Feedback and voting mechanisms.

### D. Communication & Content
- `InternalNotices.tsx`: High-priority internal memos.
- `Newsletter.tsx`: Email/Push campaign creator.
- `PodcastFeed.tsx`: Audio content distribution.
- `PressKit.tsx`: Public relations material hub.
- `EditorialPage.tsx`: Magazine-style long-form content.
- `AnonymousBoard.tsx`: Blind feedback/discussion area.

### E. Operations, HR, & Finance
- `ExpenseTracker.tsx`, `PayrollTracker.tsx`, `SettlementReports.tsx`: Comprehensive internal accounting.
- `MembershipBilling.tsx`, `SubscriptionPlans.tsx`: Automated recurring payments.
- `ProductInventory.tsx`: Supply chain and physical goods tracking.
- `CRMLite.tsx`: Basic Customer Relationship Management.
- `StaffScheduling.tsx`, `Recruitment.tsx`, `WaitlistSystem.tsx`: HR and capacity management.

### F. Media & Miscellaneous
- `MediaGallery.tsx`, `VideoLibrary.tsx`: Advanced media hosting and categorization.
- `BrandAssets.tsx`: Downloadable logo/asset portal for affiliates.
- `DonationSupport.tsx`: Fundraising and patron management.
- `CustomLandingPage.tsx`: Custom marketing page builder for the group.

---

## 5. Technical Constraints & UI Rules
1. **0% Design Deviation**: All group components must strictly follow the original layout and Stitch design tokens.
2. **Real-time Integrity**: Any modification by an admin must propagate immediately via Firestore `onSnapshot`.
3. **Admin Exclusivity**: Features like the `Header Theme Switcher`, Add-ons activation, and Member Manager are wrapped in strict `isAdminUser` checks.
4. **Header Stability**: Header remains hidden at the top of Home tab to showcase the Hero section. It slides in smoothly after 60px of downward scroll.
5. **Add-on Isolation**: Code for specific Add-ons must remain self-contained within its specific component file to prevent bloating `GroupHome.tsx`.

---

## 6. Current Implementation Status (v7.0.0)
- [x] **Real-time Header Branding**: Palette Switcher dynamically shifts the entire Group OS theme.
- [x] **Smart Header Transition**: Auto-hide/show logic based on scroll and active tab.
- [x] **Sub-module Routing**: Tab-based navigation with state persistence.
- [x] **Admin Verification**: Strict Role-based access control (RBAC) for settings and editors.
- [x] **Add-on Infrastructure**: `GroupFunctionBuilder.tsx` ready to toggle dozens of specialized components.
- [x] **Multi-language Support**: Complete KR/EN dictionary mapping for all Group UI.
- [ ] **Native Payment Gateway Integration**: (Pending - for advanced billing Add-ons).
