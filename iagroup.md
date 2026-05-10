# WoC Group Module Information Architecture (IA)

This document provides a comprehensive and detailed map of the **Group** module, which functions as a sophisticated **App-in-App** ecosystem within the WoC platform.

---

## 1. Architectural Foundation: App-in-App Concept
The Group module is a self-contained environment. Upon entry, the global platform navigation is suppressed, and a group-specific header and tab-based navigation system take control.

| Aspect | Implementation & Rules |
| :--- | :--- |
| **Root Shell** | `src/components/groups/GroupHome.tsx` (Handles routing and dynamic header) |
| **Global Sync** | Uses `GroupDetail.tsx` (Server Component) -> `GroupHome.tsx` (Client Component) |
| **Dynamic Branding** | Theme color (`headerThemeColor`) dictates the visual identity. |
| **Contrast Logic** | `getContrastColor` utility ensures readability across 15+ theme colors. |
| **Layout Guard** | Auto-hide header on Home tab top -> Slide down & fade in on scroll. |
| **Data Flow** | Real-time Firestore listeners for members, posts, and events. |

---

## 2. Page & Tab Structure (The Navigation Shell)
Managed via the `activeTab` state in `GroupHome.tsx`. Each tab represents a modular sub-app.

### A. Core Engagement Tabs
- **🏠 Home (`home`)**
  - **Hero Section**: Covers the full width with group branding and stats.
  - **Notice Bar**: Critical announcements for group members.
  - **Live Moments**: Horizontal scroll of recent group photos/activity.
  - **Quick Stats**: Member counts, class counts, and activity metrics.
  - **Action Required (Admin)**: Shows pending join requests or system alerts.
- **ℹ️ About (`about`)**
  - **Component**: `src/components/groups/GroupAbout.tsx`
  - **Content**: Atmospheric gallery, mission statement, location (Google Maps integration), house rules, and team profiles.
- **💬 Live (`live`)**
  - **Component**: `src/components/live/LiveFeed.tsx`
  - **Function**: Real-time community chat and interaction hub.

### B. Functional & Service Tabs (Access-Controlled)
- **📅 Calendar (`calendar`)**
  - **Component**: `src/components/groups/GroupCalendar.tsx`
  - **Features**: Event scheduling, RSVP tracking, and "Society" wide event aggregation.
- **📱 Feed (`feed`)**
  - **Component**: `src/components/feed/UniversalFeed.tsx`
  - **Features**: Social-style feed for photo sharing and discussion.
- **📋 Board (`board`)**
  - **Component**: `src/components/groups/GroupBoard.tsx`
  - **Features**: Structured categories for long-form posts and documents.
- **🎓 Class (`class`)**
  - **Component**: `src/components/class/ClassDetail.tsx` (Embedded mode)
  - **Features**: Educational program management, schedules, and curriculum.

---

## 3. Administrative Ecosystem (Admin Only)
Accessed via the **Settings (Gear icon)** and **Palette (Theme Switcher)** in the header.

### A. Configuration & Policy
- **Function Builder**: `src/components/groups/GroupFunctionBuilder.tsx` (Master settings page - replaces GroupSettings. Modular function marketplace with cart/select logic. Data: `functionBuilderData.ts`).
- **Basic Info**: `src/components/groups/GroupBasicEditor.tsx` (Name, Category, Theme Color, Cover).
- **Membership**: `src/components/groups/GroupMembershipEditor.tsx` (Join strategy: Open / Approval / Locked).
- **Contact**: `src/components/groups/GroupContactEditor.tsx` (Address, Maps, SNS links).

### B. Content & Business Management
- **Gallery**: `src/components/groups/GroupGalleryEditor.tsx` (Branding visual management).
- **Board Setting**: `src/components/groups/GroupBoardEditor.tsx` (Category setup and permissions).
- **Shop/Store**: `src/components/groups/GroupShopEditor.tsx` (Product listing and inventory).
- **Rental**: `src/components/groups/GroupRentalEditor.tsx` (Equipment and space rental).
- **Stay/Lodging**: `src/components/groups/GroupStayEditor.tsx` (Accommodation setup).
- **Classes**: `src/components/groups/GroupClassSetting.tsx` (Curriculum and instructor management).

### C. Financials & Analytics
- **Accounting**: `src/components/groups/GroupAccountEditor.tsx` (Payment gateway and settlement info).
- **Promotions**: `src/components/groups/CouponAdmin.tsx` (Discount code and campaign management).

---

## 4. Technical Constraints & UI Rules
1. **0% Design Deviation**: All group components must strictly follow the original layout and Stitch design tokens.
2. **Real-time Integrity**: Any modification by an admin must propagate immediately via Firestore `onSnapshot`.
3. **Admin Exclusivity**: Features like the `Header Theme Switcher` or `Member Manager` are wrapped in `isAdminUser` checks.
4. **Header Stability**: Header remains hidden at the top of Home tab to showcase Hero. It slides in after 60px scroll.
5. **Dynamic Localization**: All UI text must use the `t()` translation function from `useLanguage`.

---

## 5. Current Implementation Status (v6.5.0 Alpha)
- [x] **Real-time Header Branding**: Palette Switcher (15 colors) in Home Header.
- [x] **Smart Header Transition**: Auto-hide/show logic based on scroll and active tab.
- [x] **Sub-module Routing**: Tab-based navigation with state persistence.
- [x] **Admin Verification**: Role-based access control (RBAC) for settings and editors.
- [x] **Dynamic Contrast**: Automatic text color adjustment (White/Black) based on theme background.
- [x] **Hero Section Integration**: Seamless hero-to-header transition with negative margins.
- [x] **Multi-language Support**: Korean/English toggle for group names and descriptions.
- [ ] **Multi-level Staff Permissions**: (In Progress - implementing Moderator role).
- [ ] **Advanced Analytics Dashboard**: (Planned - member engagement metrics).
- [ ] **Native Payment Gateway**: (Planned - for Shop/Rental integration).

