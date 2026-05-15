# WoC (World of Community) Information Architecture Map v2.0

This document serves as the mandatory system map for the WoC platform. It reflects the Next.js App Router structure, parallel routes (intercepted modals), the deeply expanded Group ecosystem, and recent additions like Class Registration and Stay Checkout modules. Antigravity MUST reference this file before any development task.

---

## 1. Global Navigation & Core Components

| Component | Path | Description |
| :--- | :--- | :--- |
| **Main Menu (Drawer)** | `src/components/layout/NavigationDrawer.tsx` | Slide-out navigation containing all platform modules. |
| **Global Header** | `src/components/layout/Header.tsx` | Sticky top bar with section titles, search, and location selector. |
| **Global Footer** | `src/components/layout/Footer.tsx` | Site-wide footer with quick links and legal information. |
| **Location Selector** | `src/components/layout/LocationSelector.tsx` | Popup to change global/national context (e.g., Global vs. Seoul). |
| **Auth System** | `src/components/auth/AuthModal.tsx` | Modal for Login, Signup (Phone/Social), and Profile Setup. |
| **App Settings** | `src/components/layout/AppSettingsPopup.tsx` | Modal for language, notification, and display preferences. |
| **Notifications** | `src/components/layout/NotificationTray.tsx` | Right-side drawer for real-time alerts and activity history. |

---

## 2. Next.js Routing Structure (Key App Directory Routes)

WoC uses Next.js 14+ App Router heavily, leveraging parallel routes and interception routes for seamless modal experiences.

| Route | Modality | Description |
| :--- | :--- | :--- |
| `/@modal/(.)groups` | **Intercepted Modal** | Intercepts navigation to `/groups/[id]` to open as a modal overlay instead of a hard navigation. |
| `/@modal/(.)stay/[id]` | **Intercepted Modal** | Intercepts navigation to `/stay/[id]` to show stay details in a modal. |
| `/groups/[id]` | Full Page | Direct access to a Group's home. |
| `/stay/[id]` | Full Page | Direct access to a Stay listing. |
| `/people/[id]` | Full Page | Direct access to a Person's profile. |
| `/lost/[id]`, `/rental/[id]` | Full Page | Detail pages for utility modules. |

---

## 3. Core Community Features (Social Layer)

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **Home** | `/home` | Main Page | Dashboard featuring top banners, quick shortcuts, and community highlights. |
| **Explore** | `/explore` | Main Page | "Jump" page to discover new societies and hobbies globally. |
| **Plaza** | `/plaza` | Main Page | Public community feed for posts and interactions. |
| **Plaza Feed Post** | `src/components/feed/FeedPostCard.tsx` | Component | Individual post card supporting media, interactions, and translations. |
| **Live** | `/live` | Main Page | Real-time streaming or status feed for community activities. |
| **Chat** | `/chat` | Main Page | Global messaging center (Personal, Group, Market tabs). |
| **Search** | `/search` | Main Page | Unified global search across groups, events, and people. |

---

## 4. Tango Infrastructure (Events & Education)

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **Social (Milongas)** | `/social` | Main Page | List of Milongas and Practicas with location-based filtering. |
| **Events (Festivals)** | `/events` | Main Page | Major events (Festivals, Marathons, Workshops). |
| **Event Details** | `src/components/events/EventDetail.tsx` | Full Overlay | Multi-day event info with scroll-triggered sticky header. |
| **Class** | `/class` | Main Page | Educational directory for lessons and workshops. |
| **Class Portal** | `src/components/class/ClassPortal.tsx` | Component | Gateway for discovering classes. |
| **Class Detail & Registration** | `src/components/class/ClassDetail.tsx` | Full Page/Modal | Detailed view of a class with role selection and payment reporting flow. |
| **Venues** | `/venues` | Main Page | Map and list view of physical locations (Studios, Clubs, Shops). |
| **People** | `/people` | Main Page | Directory of community members, instructors, and organizers. |

---

## 5. Group / Society (The Core Ecosystem)

Groups act as a "Platform within a Platform" (App-in-App). See `ia_group.md` for a highly detailed breakdown of the Group module.

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **Groups Hub** | `/groups` | Main Page | Directory of all community groups and societies. |
| **Group Home** | `src/components/groups/GroupHome.tsx` | App-in-App | The standalone ecosystem within a group (Dashboard, Feed, Calendar). |
| **Post Detail Modal** | `src/components/groups/PostDetailModal.tsx` | Full Overlay | Modal for viewing and interacting with a specific group post. |
| **Group Editor** | `src/components/groups/GroupBasicEditor.tsx` | Full Overlay | Administrative panel for setting up Identity & Branding. |

---

## 6. Utility & Economy (Marketplace & Stay)

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **Shop** | `/shop` | Main Page | Official commerce marketplace for tango-related products. |
| **Resale** | `/resale` | Main Page | P2P marketplace for second-hand items. |
| **Rental** | `/rental` | Main Page | Shared economy for shoes, clothes, or space. |
| **Lost & Found** | `/lost` | Main Page | Reporting system for lost items in venues or events. |
| **Stay** | `/stay` | Main Page | Lodging and accommodation directory. |
| **Stay Detail** | `src/components/stay/StayDetail.tsx` | Full Overlay | Detailed view of a specific accommodation listing. |
| **Stay Checkout** | `/stay/[id]/checkout` | Full Page | Multi-step reservation and payment flow utilizing centralized `formatDate`. |
| **Wishlist Trays** | `src/components/*/WishlistTray.tsx` | Drawer | Mini-drawers for tracking items in Resale, Rental, and Shop. |

---

## 7. My Account, Admin, & Presentation

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **History** | `/history` | Main Page | User's activity log, including event participation and purchases. |
| **Wallet** | `/wallet` | Main Page | Financial dashboard for points, payments, and balances. |
| **Profile** | `/profile` | Main Page | User settings, bio, and role management. |
| **Profile Popup** | `src/components/profile/UserProfilePopup.tsx` | Modal | Quick view of another user's profile card. |
| **Admin Panel** | `/admin/*` | Admin Page | System management for Banners, Migrations, Seed Data, etc. |
| **Presentation** | `/pt` | Full Page | Fullscreen, slide-based cinematic presentation experience (`slides-s1` ~ `s6`). |
| **Hub** | `/hub` | Main Page | Central node for physical hub info (e.g., Hongdae Hub). |
| **Helpdesk** | `/helpdesk` | Main Page | Customer support and FAQ center. |

---

## 8. IA Principles & Rules (v2.0)

1. **Next.js App Router Adoption**: The platform embraces the App Router paradigm. Navigating to entities like groups or stays utilizes Parallel Routes (`@modal`) to provide overlay experiences seamlessly linked to URIs.
2. **Zero Design Deviation via Intercepted Routes**: Overlay modals must exactly mirror the original standalone designs while preserving router history capability.
3. **Dynamic Data Binding**: Every page mapped here must bind to real-time Firebase data (Firestore). No layout changes are permitted during data connection.
4. **Centralized Localization**: All date logic MUST use the `formatDate` utility from `LanguageContext` to ensure global standard compliance. Korean language support must be 100% covered across all dictionary keys.
5. **Modularity of Groups**: The Group feature acts as an OS. Any new group feature must reside in `src/components/groups/` and follow the standalone component pattern (See `ia_group.md`).
6. **Global Navigation Visibility**: Detail views and fullscreen components MUST correctly signal the global navigation provider (`setGlobalNavHidden(true)`) upon mounting to prevent overlap.
