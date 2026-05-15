# WoC Group (App-in-App) Information Architecture Map

This document details the Information Architecture for the **Group** ecosystem within the WoC platform. Groups act as a "Platform within a Platform," functioning as standalone applications (App-in-App) with modular, extensible features.

---

## 1. Group Core Navigation & Entry Points

| Component / Page | Path | Description |
| :--- | :--- | :--- |
| **Groups Directory** | `/groups` | The global hub listing all accessible communities, categorized by tags. |
| **Group Modal (Intercepted)** | `/@modal/(.)groups/[id]` | Parallel route interceptor displaying the Group Home as an overlay. |
| **Group Home (Standalone)** | `/groups/[id]` | Direct URL access to a specific Group's dashboard. |
| **Group Header** | `src/components/groups/GroupHeader.tsx` | Sticky header with dynamic background (scroll-based) and group identity. |
| **Group Layout** | `src/app/groups/[id]/layout.tsx` | Wrapping layout managing group context, role-based access, and sub-routing. |

---

## 2. Group Dashboard (Home)

The `GroupHome` component (`src/components/groups/GroupHome.tsx`) is the central dashboard, aggregating various modules into a unified view.

| Section | Component | Description |
| :--- | :--- | :--- |
| **Identity / Cover** | `GroupCover.tsx` | Hero banner with group logo, title, and primary actions (Join/Manage). |
| **Notice / Alerts** | `GroupNotices.tsx` | Pinned announcements or urgent broadcasts for members. |
| **Moments (Gallery)** | `GroupMoments.tsx` | Visual highlight reel showing recent photos/videos from the group. |
| **Schedule (Calendar)** | `GroupSchedule.tsx` | Consolidated agenda combining events, classes, and regular meetups. |
| **Feed (Plaza)** | `GroupFeed.tsx` | Internal social feed for text, image, and link posts within the group. |
| **Members Widget** | `GroupMembersWidget.tsx` | Quick view of active members and leadership roles. |

---

## 3. Group Administration & Setup

Administrative components are overlaid on the group home for authorized users (Leaders/Admins).

| Component | Path | Description |
| :--- | :--- | :--- |
| **Group Setup Wizard** | `src/components/groups/GroupSetupWizard.tsx` | Step-by-step initialization for new groups. |
| **Basic Info Editor** | `src/components/groups/GroupBasicEditor.tsx` | Edits name, description, tags, and cover/profile images. |
| **Membership Policy** | `src/components/groups/GroupMembershipEditor.tsx` | Configures join strategies (Open, Approval Required, Invite-Only) and onboarding questions. |
| **Theme & Branding** | `src/components/groups/GroupThemeEditor.tsx` | Sets the group's primary colors, aligning with the Stitch design system. |
| **Role Management** | `src/components/groups/GroupRoleManager.tsx` | Assigns roles (Leader, Admin, Member, Guest) and permissions. |

---

## 4. Group Apps & Add-ons (Modular Ecosystem)

These are standalone mini-applications that can be enabled/disabled per group.

| App Name | Component / Path | Description |
| :--- | :--- | :--- |
| **AI Assistant** | `src/components/groups/GroupAIAssistant.tsx` | LLM-powered bot for group Q&A, translation, and summaries. |
| **Task Manager** | `src/components/groups/GroupTaskManager.tsx` | Kanban/list-based task tracking for internal organizing. |
| **Retreat Planner** | `src/components/groups/GroupRetreatPlanner.tsx` | Specialized tool for organizing MTs (Membership Training) or retreats. |
| **Internal Wiki** | `src/components/groups/GroupWiki.tsx` | Collaborative document editor for group rules, history, and guides. |
| **Finance / Dues** | `src/components/groups/GroupFinance.tsx` | Ledger for tracking membership dues, event fees, and treasury balance. |
| **Polls & Voting** | `src/components/groups/GroupPolls.tsx` | Decision-making tool for democratic group consensus. |
| **Marketplace (Internal)**| `src/components/groups/GroupMarket.tsx` | Private trading/resale board restricted to group members. |

---

## 5. Interaction Modals

| Component | Path | Description |
| :--- | :--- | :--- |
| **Post Detail** | `src/components/groups/PostDetailModal.tsx` | Overlay for viewing a full feed post, including comments and reactions. |
| **Member Profile** | `src/components/groups/GroupMemberProfile.tsx` | Sub-profile specific to the user's identity *within* this group. |
| **Event Detail** | `src/components/groups/GroupEventDetail.tsx` | Specific view for internal group events (RSVP, location, time). |

---

## 6. Architecture Principles (Group Context)

1. **Isolation**: Group data (posts, members, events) must be strictly isolated via Firestore Security Rules referencing the `groupId`.
2. **Context Provider**: `GroupContext.tsx` must wrap the entire group application to provide global access to `currentGroup`, `userRole`, and `themeSettings` without prop drilling.
3. **Lazy Loading Add-ons**: Group Add-ons (Apps) should be dynamically imported (`next/dynamic`) to optimize bundle size, as not all groups enable all apps.
4. **Theme Inheritance**: All sub-components within a group MUST consume the group's custom theme (via CSS variables or Tailwind classes injected by the context) over the global WoC theme.
